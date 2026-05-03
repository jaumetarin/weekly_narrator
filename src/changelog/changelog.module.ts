import { Module } from '@nestjs/common';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { GitHubModule } from '../github/github.module';
import { BullModule } from '@nestjs/bullmq';
import { ChangelogProcessor } from './changelog.processor';
import { ChangelogScheduler } from './changelog.scheduler';
import { ChangelogGeneratorService } from './changelog-generator.service';



@Module({
  imports: [GitHubModule, 
    BullModule.registerQueue({ name: 'changelog' })],
  controllers: [ChangelogController],
  providers: [ChangelogService, ChangelogProcessor, ChangelogScheduler, ChangelogGeneratorService],
})
export class ChangelogModule {}
