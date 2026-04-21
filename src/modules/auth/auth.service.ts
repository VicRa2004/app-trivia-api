import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AvatarsService } from '../avatars/avatars.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private avatarsService: AvatarsService,
  ) {}

  async register(data: RegisterDto) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (userExists) {
      throw new BadRequestException(
        'El usuario o el email ya están registrados',
      );
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);
    const defaultAvatarId = await this.avatarsService.findDefault();

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        passwordHash,
        age: data.age,
        preferredLanguage: data.preferredLanguage,
        avatarId: defaultAvatarId,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    return { message: 'Usuario registrado correctamente', user };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}
