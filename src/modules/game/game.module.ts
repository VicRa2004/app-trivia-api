import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule {}
