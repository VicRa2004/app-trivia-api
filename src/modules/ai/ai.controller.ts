import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('AI (IA)')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Enviar un mensaje a la IA sobre TriviaApp' })
  @ApiResponse({
    status: 201,
    description: 'Respuesta generada por la IA.',
    schema: {
      example: {
        text: 'Para iniciar una partida como Host, debes primero crear la sesión mediante REST y luego conectarte por WebSockets...',
      },
    },
  })
  chat(@Body() chatRequestDto: ChatRequestDto) {
    return this.aiService.getChatResponse(chatRequestDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate-quiz')
  @ApiOperation({ summary: 'Generar un Quiz completo con Inteligencia Artificial' })
  @ApiResponse({
    status: 201,
    description: 'Quiz generado exitosamente y guardado en base de datos.',
  })
  generateQuiz(
    @Body() generateQuizDto: GenerateQuizDto,
    @Request() req: RequestWithUser,
  ) {
    return this.aiService.generateQuiz(generateQuizDto, req.user.userId);
  }
}
