import { PartialType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional({ description: 'ID del avatar seleccionado' })
  @IsUUID()
  @IsOptional()
  avatarId?: string;
}
