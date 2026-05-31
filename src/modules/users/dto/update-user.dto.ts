import { PartialType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional({ description: 'ID del avatar seleccionado' })
  @IsUUID()
  @IsOptional()
  avatarId?: string;

  @ApiPropertyOptional({ description: 'Contraseña actual del usuario' })
  @IsString()
  @IsOptional()
  currentPassword?: string;
}
