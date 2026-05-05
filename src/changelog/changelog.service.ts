import { Injectable, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { ChangelogGeneratorService } from './changelog-generator.service';
import { GetChangelogsQueryDto } from './dto/get-changelogs-query.dto';

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
  async getChangelogsForUser(
    userId: number,
    query: GetChangelogsQueryDto,
  ) {
    const parsedPage = Number(query.page);
    const parsedLimit = Number(query.limit);

    const safePage = query.page ?? 1;
    const safeLimit = query.limit ?? 10;


    const skip = (safePage - 1) * safeLimit;

    const where = {
      repository: {
        userId,
      },
    };

    const [items, total] = await Promise.all([
      this.prismaService.changelog.findMany({
        where,
        include: {
          repository: {
            select: {
              id: true,
              name: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: safeLimit,
      }),
      this.prismaService.changelog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
      },
    };
  }
  
async generateWeeklyChangelogs() {
  const repositories = await this.prismaService.repository.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  const results = await Promise.allSettled(
    repositories.map((repository) =>
      this.generateChangelogForRepository(
        repository.userId,
        repository.id,
      ),
    ),
  );

  return {
    totalRepositories: repositories.length,
    successful: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}

  
}
