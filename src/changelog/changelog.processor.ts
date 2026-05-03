import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChangelogService } from './changelog.service';

@Processor('changelog')
export class ChangelogProcessor extends WorkerHost {
  constructor(private readonly changelogService: ChangelogService) {
    super();
  }

  async process(job: Job) {
    console.log('Processing job:', job.name, job.data);
    if (job.name === 'generate-changelog') {
      const { userId, repositoryId } = job.data;
      console.log('Generating changelog for repository:', repositoryId);
      return this.changelogService.generateChangelogForRepository(
        userId,
        repositoryId,
      );
    }
  }
}
