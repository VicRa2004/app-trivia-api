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

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly jwtService: JwtService,
  ) {}

  // Autenticación Manual para mayor flexibilidad, no intercepto la conexión forzosamente.
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Aquí podrías agregar lógica para marcar al jugador como Inactivo si lo requieres
  }

  private extractUserId(token: string): string | null {
    try {
      const payload = this.jwtService.verify(token);
      return payload.sub; // subject is the userId
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

      const { game, player } = await this.gameService.joinGame(
        data.gamePin,
        userId,
        client.id,
      );

      client.join(data.gamePin);

      // Notificar a todos en la sala que se unió (para que el Host lo vea, y el mismo jugador)
      const currentPlayers = this.gameService.getPlayers(data.gamePin);
      this.server.to(data.gamePin).emit('player_joined', {
        player: player?.username,
        playersList: currentPlayers,
      });

      // Retornar al jugador un éxito
      return {
        event: 'joined',
        data: { success: true, gamePin: game.gamePin },
      };
    } catch (error: any) {
      client.emit('error', { message: error.message });
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
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('next_question')
  async handleNextQuestion(
    @MessageBody() data: { gamePin: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.extractUserId(data.token);
      if (!userId) return;

      const nextQ = this.gameService.nextQuestion(data.gamePin, userId);

      if (!nextQ) {
        // No hay más preguntas, notificar para que pidan los resultados
        this.server.to(data.gamePin).emit('all_questions_ended', {
          message: 'Fin de las preguntas.',
        });
        return;
      }

      this.server.to(data.gamePin).emit('new_question', nextQ);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody()
    data: {
      gamePin: string;
      token: string;
      optionId: string;
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
        data.optionId,
        data.timeElapsedMs,
      );

      if (result.success) {
        // Confirmar recepción al cliente individual
        client.emit('answer_received', {
          success: true,
          pointsScored: result.pointsScored,
          newScore: result.newScore, // Sólo él ve sus puntos de inmediato si quieres, en Kahoots se muestra al final de la ronda.
        });
      }
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('show_correct_answer')
  async handleShowCorrectAnswer(
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
        currentRanking: players.sort((a, b) => b.score - a.score).slice(0, 5), // Top 5
      });
    } catch (error: any) {
      client.emit('error', { message: error.message });
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

      // Se expulsa a todos de la room tras vaciar
      this.server.in(data.gamePin).socketsLeave(data.gamePin);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }
}
