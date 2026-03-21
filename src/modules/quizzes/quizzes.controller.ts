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
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQuizDto: CreateQuizDto, @Request() req: any) {
    return this.quizzesService.create(createQuizDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Request() req: any,
  ) {
    return this.quizzesService.update(id, updateQuizDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.quizzesService.remove(id, req.user.userId);
  }

  // --- QUESTIONS ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  addQuestion(
    @Param('id') id: string,
    @Body()
    createQuestionDto: import('./dto/create-question.dto').CreateQuestionDto,
    @Request() req: any,
  ) {
    return this.quizzesService.addQuestion(
      id,
      req.user.userId,
      createQuestionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/questions/:questionId')
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body()
    updateQuestionDto: import('./dto/update-question.dto').UpdateQuestionDto,
    @Request() req: any,
  ) {
    return this.quizzesService.updateQuestion(
      id,
      questionId,
      req.user.userId,
      updateQuestionDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/questions/:questionId')
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.quizzesService.removeQuestion(id, questionId, req.user.userId);
  }
}
