import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface PlayerState {
  socketId: string;
  userId: string;
  username: string;
  score: number;
  responses: Array<{
    questionId: string;
    optionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
    pointsScored: number;
  }>;
}

export interface GameState {
  sessionId: string;
  hostId: string;
  quizId: string;
  gamePin: string;
  status: 'waiting' | 'in_progress' | 'finished';
  currentQuestionIndex: number; // Starts at -1
  questions: any[];
  players: Map<string, PlayerState>;
}

@Injectable()
export class GameService {
  private activeGames = new Map<string, GameState>();

  constructor(private prisma: PrismaService) {}

  async createSession(quizId: string, hostId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });

    if (!quiz) throw new NotFoundException('Quiz no encontrado');
    if (quiz.questions.length === 0)
      throw new BadRequestException('El quiz no tiene preguntas');

    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();

    const session = await this.prisma.gameSession.create({
      data: {
        quizId,
        hostId,
        gamePin,
        status: 'waiting',
      },
    });

    // Ordenar preguntas por orderNumber
    const sortedQuestions = quiz.questions.sort(
      (a, b) => a.orderNumber - b.orderNumber,
    );

    this.activeGames.set(gamePin, {
      sessionId: session.id,
      hostId,
      quizId,
      gamePin,
      status: 'waiting',
      currentQuestionIndex: -1,
      questions: sortedQuestions,
      players: new Map(),
    });

    return { gamePin, sessionId: session.id };
  }

  async joinGame(gamePin: string, userId: string, socketId: string) {
    const game = this.activeGames.get(gamePin);
    if (!game) throw new NotFoundException('PIN de juego inválido o inactivo');
    if (game.status !== 'waiting')
      throw new BadRequestException('El juego ya ha comenzado');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no válido');

    if (game.players.has(userId)) {
      const player = game.players.get(userId)!;
      player.socketId = socketId;
    } else {
      game.players.set(userId, {
        socketId,
        userId,
        username: user.username,
        score: 0,
        responses: [],
      });
    }

    return { game, player: game.players.get(userId) };
  }

  getPlayers(gamePin: string) {
    const game = this.activeGames.get(gamePin);
    if (!game) return [];
    return Array.from(game.players.values()).map((p) => ({
      userId: p.userId,
      username: p.username,
      score: p.score,
    }));
  }

  async startGame(gamePin: string, hostId: string) {
    const game = this.activeGames.get(gamePin);
    if (!game) throw new NotFoundException('Juego no encontrado');
    if (game.hostId !== hostId)
      throw new ForbiddenException('Solo el host puede iniciar');

    game.status = 'in_progress';
    game.currentQuestionIndex = -1;

    await this.prisma.gameSession.update({
      where: { id: game.sessionId },
      data: { status: 'in_progress' },
    });

    return game;
  }

  nextQuestion(gamePin: string, hostId: string) {
    const game = this.activeGames.get(gamePin);
    if (!game) throw new NotFoundException('Juego no encontrado');
    if (game.hostId !== hostId) throw new ForbiddenException('No autorizado');

    game.currentQuestionIndex++;

    if (game.currentQuestionIndex >= game.questions.length) {
      return null;
    }

    const currentQ = game.questions[game.currentQuestionIndex];

    const sanitizedOptions = currentQ.options.map((opt: any) => ({
      id: opt.id,
      content: opt.content,
    }));

    return {
      index: game.currentQuestionIndex,
      total: game.questions.length,
      question: {
        id: currentQ.id,
        text: currentQ.questionText,
        type: currentQ.questionType,
        points: currentQ.points,
        timeLimit: currentQ.timeLimit,
        options: sanitizedOptions,
      },
    };
  }

  submitAnswer(
    gamePin: string,
    userId: string,
    optionId: string,
    timeElapsedMs: number,
  ) {
    const game = this.activeGames.get(gamePin);
    if (!game || game.status !== 'in_progress')
      throw new BadRequestException('Juego inactivo');

    const currentQ = game.questions[game.currentQuestionIndex];
    if (!currentQ) throw new BadRequestException('Pregunta no disponible');

    const player = game.players.get(userId);
    if (!player) throw new ForbiddenException('No eres jugador de esta sala');

    if (player.responses.some((r) => r.questionId === currentQ.id)) {
      return { success: false, message: 'Ya respondiste' };
    }

    const selectedOption = currentQ.options.find((o: any) => o.id === optionId);
    if (!selectedOption) throw new BadRequestException('Opción inválida');

    const isCorrect = selectedOption.isCorrect;

    let pointsScored = 0;
    if (isCorrect) {
      const timeLimitMs = currentQ.timeLimit * 1000;
      const timeFactor = Math.max(0, 1 - timeElapsedMs / timeLimitMs);
      pointsScored = Math.round(currentQ.points * (0.5 + 0.5 * timeFactor));
    }

    player.score += pointsScored;
    player.responses.push({
      questionId: currentQ.id,
      optionId,
      isCorrect,
      responseTimeMs: timeElapsedMs,
      pointsScored,
    });

    return {
      success: true,
      pointsScored,
      isCorrect,
      newScore: player.score,
      username: player.username,
    };
  }

  getCorrectAnswer(gamePin: string) {
    const game = this.activeGames.get(gamePin);
    if (!game || game.currentQuestionIndex === -1) return null;
    const currentQ = game.questions[game.currentQuestionIndex];
    const correctOptions = currentQ.options
      .filter((o: any) => o.isCorrect)
      .map((o: any) => o.id);
    return correctOptions;
  }

  async finishGame(gamePin: string, hostId: string) {
    const game = this.activeGames.get(gamePin);
    if (!game) throw new NotFoundException('Juego no encontrado');
    if (game.hostId !== hostId) throw new ForbiddenException('No autorizado');

    game.status = 'finished';

    const attemptsInput = Array.from(game.players.values()).map((player) => ({
      userId: player.userId,
      totalScore: player.score,
      responses: player.responses,
    }));

    await this.prisma.$transaction(async (prisma) => {
      await prisma.gameSession.update({
        where: { id: game.sessionId },
        data: {
          status: 'finished',
          currentQuestionIndex: game.currentQuestionIndex,
        },
      });

      for (const attemptInput of attemptsInput) {
        const attempt = await prisma.attempt.create({
          data: {
            userId: attemptInput.userId,
            sessionId: game.sessionId,
            totalScore: attemptInput.totalScore,
          },
        });

        if (attemptInput.responses.length > 0) {
          const formattedResponses = attemptInput.responses.map((r) => ({
            attemptId: attempt.id,
            questionId: r.questionId,
            givenAnswer: r.optionId,
            isCorrect: r.isCorrect,
            responseTimeMs: r.responseTimeMs,
          }));

          await prisma.userResponse.createMany({
            data: formattedResponses,
          });
        }
      }
    });

    this.activeGames.delete(gamePin);

    const podium = Array.from(game.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ username: p.username, score: p.score }));

    return podium;
  }
}
