import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatPartDto {
  @ApiProperty({ example: '¿Qué tecnologías usa la app?' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ChatTurnDto {
  @ApiProperty({ example: 'user', enum: ['user', 'model'] })
  @IsString()
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({ type: [ChatPartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatPartDto)
  parts: ChatPartDto[];
}

export class ChatRequestDto {
  @ApiProperty({ example: '¿Cómo puedo unirme a una partida?' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ type: [ChatTurnDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}
