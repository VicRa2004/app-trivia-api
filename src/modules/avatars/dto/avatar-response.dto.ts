import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AvatarResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ example: 'Astronauta' })
  @IsString()
  name: string;

  @ApiProperty({ example: '/avatars/astronauta.png' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;
}
