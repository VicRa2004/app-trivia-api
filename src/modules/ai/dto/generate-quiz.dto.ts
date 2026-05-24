import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiProperty({ example: 'Mitología Nórdica', description: 'El tema o temática sobre el cual la IA generará las preguntas' })
  @IsString()
  @IsNotEmpty()
  theme: string;

  @ApiProperty({ example: 5, description: 'Número de preguntas que se generarán (máximo 10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  numQuestions: number;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la categoría a la cual se asociará el quiz' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
