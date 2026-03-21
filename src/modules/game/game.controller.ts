import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create/:quizId')
  @ApiOperation({ summary: 'Crear una sala de juego desde un Quiz' })
  @ApiResponse({
    status: 201,
    description: 'Sala de juego creada, devuelve el código PIN',
    schema: {
      example: {
        gamePin: '123456',
        sessionId: 'd8c2e6f4-b9b5-412d-a2f0-f9e0ebc1b0c9',
      },
    },
  })
  createSession(
    @Param('quizId') quizId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.gameService.createSession(quizId, req.user.userId);
  }
}
