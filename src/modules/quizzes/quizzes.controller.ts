import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination-query.dto';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Crear un Quiz' })
  create(
    @Body() createQuizDto: CreateQuizDto,
    @Request() req: RequestWithUser,
  ) {
    return this.quizzesService.create(createQuizDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de quizzes públicos paginada' })
  @ApiResponse({
    status: 200,
    description: 'Respuesta paginada con los quizzes públicos.',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            creatorId: 'user-uuid',
            categoryId: 'category-uuid',
            title: 'Historia Mundial',
            description: 'Un quiz sobre eventos históricos',
            thumbnailUrl: 'https://ejemplo.com/thumb.png',
            isPublic: true,
            totalPlays: 150,
            createdAt: '2026-03-21T12:00:00.000Z',
            creator: {
              id: 'user-uuid',
              username: 'profesor123',
            },
            category: {
              id: 'category-uuid',
              name: 'Historia',
              iconUrl: 'https://ejemplo.com/historia.png',
            },
          },
        ],
        meta: {
          total: 5,
          page: 1,
          limit: 10,
          lastPage: 1,
        },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.quizzesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener Quiz por ID con sus preguntas' })
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un Quiz' })
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Request() req: RequestWithUser,
  ) {
    return this.quizzesService.update(id, updateQuizDto, req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un Quiz' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.quizzesService.remove(id, req.user.userId);
  }

  // --- QUESTIONS ENDPOINTS ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  @ApiOperation({ summary: 'Añadir o crear una pregunta dentro del Quiz' })
  addQuestion(
    @Param('id') id: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.quizzesService.addQuestion(
      id,
      req.user.userId,
      createQuestionDto,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Editar una pregunta del Quiz y sus opciones' })
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.quizzesService.updateQuestion(
      id,
      questionId,
      req.user.userId,
      updateQuestionDto,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Eliminar una pregunta del Quiz' })
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.quizzesService.removeQuestion(id, questionId, req.user.userId);
  }
}
