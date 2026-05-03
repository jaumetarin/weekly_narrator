import { Injectable, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { ChangelogGeneratorService } from './changelog-generator.service';

@Injectable()
export class ChangelogService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly githubService: GitHubService,
    private readonly changelogGeneratorService: ChangelogGeneratorService,
  ) {}

  async generateChangelogForRepository(userId: number, repositoryId: number) {
    const repository = await this.prismaService.repository.findFirst({
      where: {
        id: repositoryId,
        userId,
      },
    });

    if (!repository) {
      throw new NotFoundException('Repository not found for this user');
    }

    const commits =
      await this.githubService.getNormalizedCommitsForRepository(
        userId,
        repositoryId,
      );

    const pullRequests =
      await this.githubService.getNormalizedPullRequestsForRepository(
        userId,
        repositoryId,
      );

    const activities = [...pullRequests, ...commits].sort((a, b) => {
      const first = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const second = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return second - first;
    });

    const title = `Changelog for ${repository.name}`;
    const content = await this.changelogGeneratorService.generateWeeklyChangelog(
      repository.name,
      activities,
    );

    return this.prismaService.changelog.create({
      data: {
        title,
        content,
        repositoryId: repository.id,
      },
    });
  }

  
}
