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
        return;
      }

      const { game, player, isHost } = await this.gameService.joinGame(
        data.gamePin,
        userId,
        client.id,
      );

      await client.join(data.gamePin);

      if (isHost) {
        return {
          event: 'joined',
          data: { success: true, gamePin: game.gamePin, isHost: true },
        };
      }

      const currentPlayers = this.gameService.getPlayers(data.gamePin);
      this.server.to(data.gamePin).emit('player_joined', {
        player: player!.username,
        playersList: currentPlayers,
      });

      return {
        event: 'joined',
        data: { success: true, gamePin: game.gamePin },
      };
    } catch (error: unknown) {
      const err = error as Error;
      client.emit('error', { message: err.message || 'Error desconocido' });
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
          newScore: result.newScore,
        });
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
