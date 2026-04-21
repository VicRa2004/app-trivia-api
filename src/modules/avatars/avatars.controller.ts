import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { PaginationDto } from '../../common/dto/pagination-query.dto';
import { AvatarResponseDto } from './dto/avatar-response.dto';

@ApiTags('avatars')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los avatares disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avatares activos',
    type: [AvatarResponseDto],
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.avatarsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un avatar por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del avatar',
    type: AvatarResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Avatar no encontrado' })
  findOne(@Param('id') id: string) {
    return this.avatarsService.findOne(id);
  }
}
