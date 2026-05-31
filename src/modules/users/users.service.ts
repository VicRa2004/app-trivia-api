import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    paginationDto: import('../../common/dto/pagination-query.dto').PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          age: true,
          preferredLanguage: true,
          createdAt: true,
          avatar: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        age: true,
        preferredLanguage: true,
        createdAt: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { currentPassword, password, username, email, ...rest } = updateUserDto;
    const updateData: any = { ...rest };

    // 1. Validar unicidad de username
    if (username && username !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está registrado');
      }
      updateData.username = username;
    }

    // 2. Validar unicidad de email
    if (email && email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      updateData.email = email;
    }

    // 3. Validar y procesar cambio de contraseña
    if (password) {
      if (!currentPassword) {
        throw new BadRequestException('Debes proporcionar tu contraseña actual');
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      const salt = await bcrypt.genSalt();
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        age: true,
        preferredLanguage: true,
        avatar: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async getPlayerStats(userId: string) {
    const [totalGames, maxScoreResult, podiums, responsesStats, correctResponsesStats] = await Promise.all([
      this.prisma.attempt.count({ where: { userId } }),
      this.prisma.attempt.aggregate({
        where: { userId },
        _max: { totalScore: true },
      }),
      this.prisma.attempt.count({
        where: {
          userId,
          finalRank: { in: [1, 2, 3] },
        },
      }),
      this.prisma.userResponse.aggregate({
        where: { attempt: { userId } },
        _count: { id: true },
      }),
      this.prisma.userResponse.aggregate({
        where: { attempt: { userId }, isCorrect: true },
        _count: { id: true },
      }),
    ]);

    const totalAnswers = responsesStats._count.id;
    const correctAnswers = correctResponsesStats._count.id;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalGames,
      maxScore: maxScoreResult._max.totalScore || 0,
      podiums,
      accuracy,
    };
  }
}
