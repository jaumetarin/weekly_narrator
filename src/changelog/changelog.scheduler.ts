import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChangelogScheduler {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue('changelog')
    private readonly changelogQueue: Queue,
  ) {}

  @Cron('0 9 * * 5', {
    timeZone: 'Europe/Madrid',
  })
  async scheduleDailyChangelogs() {
    console.log('Running daily changelog scheduler');
    const repositories = await this.prismaService.repository.findMany({
      where: {
        isActive: true,
      },
    });
    console.log('Active repositories found:', repositories.length);

    for (const repository of repositories) {
      console.log('Enqueuing changelog job for repository:', repository.id);
      await this.changelogQueue.add(
        'generate-changelog',
        {
          userId: repository.userId,
          repositoryId: repository.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }
}
