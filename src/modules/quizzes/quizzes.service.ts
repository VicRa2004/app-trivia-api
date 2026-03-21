import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuizDto: CreateQuizDto, userId: string) {
    return this.prisma.quiz.create({
      data: {
        title: createQuizDto.title,
        description: createQuizDto.description,
        thumbnailUrl: createQuizDto.thumbnailUrl,
        isPublic: createQuizDto.isPublic ?? true,
        categoryId: createQuizDto.categoryId,
        creatorId: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      where: { isPublic: true },
      include: {
        creator: {
          select: { id: true, username: true },
        },
        category: true,
      },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true },
        },
        category: true,
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, userId: string) {
    const quiz = await this.findOne(id);
    if (quiz.creatorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este quiz');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: updateQuizDto,
    });
  }

  async remove(id: string, userId: string) {
    const quiz = await this.findOne(id);
    if (quiz.creatorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este quiz',
      );
    }

    return this.prisma.quiz.delete({ where: { id } });
  }

  // --- QUESTIONS LOGIC ---

  async addQuestion(
    quizId: string,
    userId: string,
    dto: import('./dto/create-question.dto').CreateQuestionDto,
  ) {
    const quiz = await this.findOne(quizId);
    if (quiz.creatorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este quiz');
    }

    return this.prisma.question.create({
      data: {
        quizId,
        questionText: dto.questionText,
        questionType: dto.questionType,
        explanation: dto.explanation,
        points: dto.points ?? 1000,
        timeLimit: dto.timeLimit ?? 20,
        orderNumber: dto.orderNumber,
        options: {
          create: dto.options,
        },
      },
      include: { options: true },
    });
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    userId: string,
    dto: import('./dto/update-question.dto').UpdateQuestionDto,
  ) {
    const quiz = await this.findOne(quizId);
    if (quiz.creatorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este quiz');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.quizId !== quizId) {
      throw new NotFoundException(
        'La pregunta no existe o no pertenece a este quiz',
      );
    }

    if (dto.options) {
      await this.prisma.option.deleteMany({ where: { questionId } });
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: dto.questionText,
        questionType: dto.questionType,
        explanation: dto.explanation,
        points: dto.points,
        timeLimit: dto.timeLimit,
        orderNumber: dto.orderNumber,
        ...(dto.options && {
          options: {
            create: dto.options,
          },
        }),
      },
      include: { options: true },
    });
  }

  async removeQuestion(quizId: string, questionId: string, userId: string) {
    const quiz = await this.findOne(quizId);
    if (quiz.creatorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este quiz');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.quizId !== quizId) {
      throw new NotFoundException(
        'La pregunta no existe o no pertenece a este quiz',
      );
    }

    return this.prisma.question.delete({ where: { id: questionId } });
  }
}
