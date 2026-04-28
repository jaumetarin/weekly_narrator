import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import {GitHubModule} from "./github/github.module";  
import { ChangelogModule } from './changelog/changelog.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    PrismaModule,
    AuthModule,
    GitHubModule,
    ChangelogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
