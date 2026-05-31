import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination-query.dto';

export class QuizPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Texto a buscar en título o descripción' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de categoría' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
