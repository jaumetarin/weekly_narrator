import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { NormalizerService } from './normalizer.service';

@Module({
  controllers: [GitHubController],
  providers: [GitHubService, NormalizerService],
  exports: [GitHubService],
})
export class GitHubModule {}
