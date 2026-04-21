import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { GameModule } from './modules/game/game.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { AvatarsModule } from './modules/avatars/avatars.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    QuizzesModule,
    GameModule,
    CategoriesModule,
    AuthModule,
    AvatarsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
