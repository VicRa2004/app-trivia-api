import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';

// Interfaz para controlar el JWT Decodificado
interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// CORS abierto (*) en WebSocket ya que la autenticación se valida con JWT
// Todos los eventos requieren un token válido (ver extractUserId)
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    const disconnectedInfo = this.gameService.handlePlayerDisconnect(client.id);
    if (disconnectedInfo) {
      this.server.to(disconnectedInfo.gamePin).emit('player_disconnected', {
        player: disconnectedInfo.username,
        playersList: this.gameService.getPlayers(disconnectedInfo.gamePin),
      });
    }
  }

  private extractUserId(token: string): string | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload.sub;
    } catch {
      return null;
    }
  }

  @SubscribeMessage('join_game')
  async handleJoinGame(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) {
        client.emit('error', { message: 'Token inválido o expirado' });
        return { success: false, message: 'Token inválido o expirado' };
      }

      const { game, player, isHost } = await this.gameService.joinGame(
        data.gamePin,
        userId,
        client.id,
      );

      await client.join(data.gamePin);

      const currentPlayers = this.gameService.getPlayers(data.gamePin);

      let currentQuestion: any = null;
      if (game.currentQuestionIndex >= 0 && game.currentQuestionIndex < game.questions.length) {
        const q = game.questions[game.currentQuestionIndex];
        currentQuestion = {
          id: q.id,
          text: q.questionText,
          type: q.questionType,
          imageUrl: q.imageUrl,
          points: q.points,
          timeLimit: q.timeLimit,
          options: q.options.map(opt => ({
            id: opt.id,
            content: opt.content,
            imageUrl: opt.imageUrl,
            position: opt.position,
          }))
        };
      }

      if (isHost) {
        console.log('[DEBUG Gateway] Host joined successfully:', game.gamePin);
        return {
          success: true,
          gamePin: game.gamePin,
          isHost: true,
          playersList: currentPlayers,
          status: game.status,
          currentQuestion,
          currentQuestionIndex: game.currentQuestionIndex,
          totalQuestions: game.questions.length,
        };
      }

      console.log('[DEBUG Gateway] Player joined successfully:', player!.username);
      this.server.to(data.gamePin).emit('player_joined', {
        player: player!.username,
        playersList: currentPlayers,
      });

      return {
        success: true,
        gamePin: game.gamePin,
        isHost: false,
        playersList: currentPlayers,
        status: game.status,
        currentQuestion,
        currentQuestionIndex: game.currentQuestionIndex,
        totalQuestions: game.questions.length,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[DEBUG Gateway] Error in handleJoinGame:', err);
      client.emit('error', { message: err.message || 'Error desconocido' });
      return { success: false, message: err.message || 'Error desconocido' };
    }
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      await this.gameService.startGame(data.gamePin, userId);
      this.server.to(data.gamePin).emit('game_started', {
        message: '¡El host ha iniciado la partida! Preparaos...',
      });

      // Avanzar automáticamente a la primera pregunta
      const nextQ = this.gameService.nextQuestion(data.gamePin, userId);
      if (nextQ) {
        this.server.to(data.gamePin).emit('new_question', nextQ);
      }
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
    }
  }

  @SubscribeMessage('next_question')
  handleNextQuestion(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      const nextQ = this.gameService.nextQuestion(data.gamePin, userId);

      if (!nextQ) {
        this.server.to(data.gamePin).emit('all_questions_ended', {
          message: 'Fin de las preguntas.',
        });
        return;
      }

      this.server.to(data.gamePin).emit('new_question', nextQ);
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
    }
  }

  @SubscribeMessage('submit_answer')
  handleSubmitAnswer(
    @MessageBody()
    data: {
      gamePin: string;
      token: string;
      answerPayload: string | string[];
      timeElapsedMs: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      const result = this.gameService.submitAnswer(
        data.gamePin,
        userId,
        data.answerPayload,
        data.timeElapsedMs,
      );

      if (result.success) {
        client.emit('answer_received', {
          success: true,
          pointsScored: result.pointsScored,
          isCorrect: result.isCorrect,
          newScore: result.newScore,
        });

        // Broadcast updated answers count to the room
        const count = this.gameService.getAnswersCountForCurrentQuestion(data.gamePin);
        this.server.to(data.gamePin).emit('answers_count_updated', count);

        // Si todos los jugadores han respondido, revelar la respuesta correcta automáticamente
        if (count.total > 0 && count.answered === count.total) {
          const correctOptions = this.gameService.getCorrectAnswer(data.gamePin);
          const players = this.gameService.getPlayers(data.gamePin);

          this.server.to(data.gamePin).emit('correct_answer_revealed', {
            correctOptions,
            currentRanking: players.sort((a, b) => b.score - a.score).slice(0, 5),
          });
        }
      } else {
        client.emit('answer_received', {
          success: false,
          message: result.message,
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
    }
  }

  @SubscribeMessage('show_correct_answer')
  handleShowCorrectAnswer(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      const correctOptions = this.gameService.getCorrectAnswer(data.gamePin);
      const players = this.gameService.getPlayers(data.gamePin);

      this.server.to(data.gamePin).emit('correct_answer_revealed', {
        correctOptions,
        currentRanking: players.sort((a, b) => b.score - a.score).slice(0, 5),
      });
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
    }
  }

  @SubscribeMessage('finish_game')
  async handleFinishGame(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      const podium = await this.gameService.finishGame(data.gamePin, userId);

      this.server.to(data.gamePin).emit('game_finished', {
        message: 'El juego ha finalizado. Aquí los resultados:',
        podium,
      });

      this.server.in(data.gamePin).socketsLeave(data.gamePin);
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
    }
  }
}
