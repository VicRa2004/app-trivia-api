import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { PaginationDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class AvatarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.avatar.findMany({
        where: { isActive: true },
        skip,
        take: limit,
      }),
      this.prisma.avatar.count({ where: { isActive: true } }),
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
    const avatar = await this.prisma.avatar.findUnique({
      where: { id },
    });

    if (!avatar) {
      throw new NotFoundException(`Avatar with ID ${id} not found`);
    }
    return avatar;
  }

  async findDefault(): Promise<string | null> {
    const avatar = await this.prisma.avatar.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return avatar?.id || null;
  }

  async create(createAvatarDto: CreateAvatarDto) {
    return this.prisma.avatar.create({
      data: createAvatarDto,
    });
  }
}
