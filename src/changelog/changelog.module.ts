import { Module } from '@nestjs/common';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { GitHubModule } from '../github/github.module';
import { ChangelogGeneratorService } from './changelog-generator.service';

@Module({
  imports: [GitHubModule],
  controllers: [ChangelogController],
  providers: [
    ChangelogService,
    ChangelogGeneratorService,
  ],
})
export class ChangelogModule {}
