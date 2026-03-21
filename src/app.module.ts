import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [UsersModule, QuizzesModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
