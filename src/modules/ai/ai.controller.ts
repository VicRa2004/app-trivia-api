import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
}
