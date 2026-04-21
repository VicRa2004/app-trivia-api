import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAvatarDto {
  @ApiProperty({ example: 'Astronauta' })
  @IsString()
  name: string;

  @ApiProperty({ example: '/avatars/astronauta.png' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
