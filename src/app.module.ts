import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import {GitHubModule} from "./github/github.module";  
import { ChangelogModule } from './changelog/changelog.module';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

function validateEnv(env: Record<string, string | undefined>) {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL',
    'FRONTEND_URL',
  ];

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, validate: validateEnv}),
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: 6379,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    GitHubModule,
    ChangelogModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
