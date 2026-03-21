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
}
