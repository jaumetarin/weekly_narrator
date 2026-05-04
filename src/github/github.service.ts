import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {NormalizerService} from './normalizer.service';
import { SyncRepositoryItemDto } from './dto/sync-repository-item.dto';


@Injectable()
export class GitHubService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly normalizerService: NormalizerService
  ) {}

  async getRepositoriesForUser(userId: number) {
  const user = await this.prismaService.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!user.githubAccessToken) {
    throw new UnauthorizedException('GitHub access token is missing for this user');
  }

  const trackedRepositories = await this.prismaService.repository.findMany({
    where: { userId },
    select: {
      id: true,
      githubRepoId: true,
      isActive: true,
    },
  });

  const trackedRepositoriesMap = new Map(
    trackedRepositories.map((repository) => [
      repository.githubRepoId,
      repository,
    ]),
  );

  const response = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    await this.handleGitHubError(
      response,
      'Failed to fetch repositories from GitHub',
    );
  }

  const repositories = await response.json();

  return repositories.map((repository: any) => {
    const trackedRepository = trackedRepositoriesMap.get(repository.id);

    return {
      repositoryId: trackedRepository?.id ?? null,
      githubRepoId: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      isPrivate: repository.private,
      defaultBranch: repository.default_branch,
      url: repository.html_url,
      isActive: trackedRepository?.isActive ?? false,
    };
  });
}


  async syncRepositoriesForUser(
  userId: number,
  repositories: Array<SyncRepositoryItemDto>,
) {
  return this.prismaService.$transaction(async (prisma) => {
    await prisma.repository.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return Promise.all(
      repositories.map((repository) =>
        prisma.repository.upsert({
          where: { githubRepoId: repository.githubRepoId },
          update: {
            name: repository.name,
            fullName: repository.fullName,
            userId,
            isActive: true,
          },
          create: {
            githubRepoId: repository.githubRepoId,
            name: repository.name,
            fullName: repository.fullName,
            userId,
            isActive: true,
          },
        }),
      ),
    );
  });
}


async getCommitsForRepository(userId: number, repositoryId: number) {
  const user = await this.prismaService.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!user.githubAccessToken) {
    throw new UnauthorizedException('GitHub access token is missing for this user');
  }

  const repository = await this.prismaService.repository.findFirst({
    where: {
      id: repositoryId,
      userId,
    },
  });

  if (!repository) {
    throw new NotFoundException('Repository not found for this user');
  }
    const sevenDaysAgo = this.getDateSevenDaysAgo();

    const response = await fetch(
    `https://api.github.com/repos/${repository.fullName}/commits?since=${sevenDaysAgo.toISOString()}&per_page=100`,

    {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
  await this.handleGitHubError(response, 'Failed to fetch commits from GitHub');
  }


  const commits = await response.json();
  const recentCommits = commits.filter((commit: any) =>
  this.isDateInLastSevenDays(commit.commit?.author?.date),
  );

   return Promise.all(
   recentCommits.map(async (commit: any) => {
    const commitDetailsResponse = await fetch(
      `https://api.github.com/repos/${repository.fullName}/commits/${commit.sha}`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!commitDetailsResponse.ok) {
  await this.handleGitHubError(
    commitDetailsResponse,
    'Failed to fetch commit details from GitHub',
  );
}


    const commitDetails = await commitDetailsResponse.json();

    return {
      sha: commit.sha,
      message: commit.commit?.message,
      authorName: commit.commit?.author?.name ?? null,
      authorDate: commit.commit?.author?.date ?? null,
      url: commit.html_url,
      changedFiles: (commitDetails.files ?? []).map((file: any) => ({
        filename: file.filename,
        status: file.status,
      })),
    };
  }),
);

}

async getPullRequestsForRepository(userId: number, repositoryId: number) {
  const user = await this.prismaService.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!user.githubAccessToken) {
    throw new UnauthorizedException('GitHub access token is missing for this user');
  }

  const repository = await this.prismaService.repository.findFirst({
    where: {
      id: repositoryId,
      userId,
    },
  });

  if (!repository) {
    throw new NotFoundException('Repository not found for this user');
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository.fullName}/pulls?state=closed&sort=updated&direction=desc&per_page=100`
    ,{
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    await this.handleGitHubError(response, 'Failed to fetch pull requests from GitHub');
  }


  const pullRequests = await response.json();

  const weeklyPullRequests = pullRequests.filter((pullRequest: any) =>
  this.isDateInLastSevenDays(pullRequest.merged_at),
);

return Promise.all(
  weeklyPullRequests.map(async (pullRequest: any) => {
    const pullRequestFilesResponse = await fetch(
    `https://api.github.com/repos/${repository.fullName}/pulls/${pullRequest.number}/files`
      ,{
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!pullRequestFilesResponse.ok) {
    await this.handleGitHubError(
    pullRequestFilesResponse,
    'Failed to fetch pull request files from GitHub',
    );
}


    const pullRequestFiles = await pullRequestFilesResponse.json();

    return {
      id: pullRequest.id,
      title: pullRequest.title,
      authorName: pullRequest.user?.login ?? null,
      state: pullRequest.state,
      mergedAt: pullRequest.merged_at,
      url: pullRequest.html_url,
      changedFiles: (pullRequestFiles ?? []).map((file: any) => ({
        filename: file.filename,
        status: file.status,
      })),
    };
  }),
);

}

async getNormalizedCommitsForRepository(userId: number, repositoryId: number) {
  const commits = await this.getCommitsForRepository(userId, repositoryId);
  return this.normalizerService.normalizeCommits(commits);
}

async getNormalizedPullRequestsForRepository(userId: number, repositoryId: number) {
  const pullRequests = await this.getPullRequestsForRepository(userId, repositoryId);
  return this.normalizerService.normalizePullRequests(pullRequests);
}
  private getDateSevenDaysAgo() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo;
  }

  private isDateInLastSevenDays(dateString: string | null | undefined) {
    if (!dateString) {
      return false;
    }

    const date = new Date(dateString);
    const sevenDaysAgo = this.getDateSevenDaysAgo();
    const now = new Date();

    return date >= sevenDaysAgo && date <= now;
  }

  private async handleGitHubError(
    response: Response,
    defaultMessage: string,
  ): Promise<never> {
    const errorText = await response.text();
    const retryAfter = response.headers.get('retry-after');
    const remaining = response.headers.get('x-ratelimit-remaining');

    if (response.status === 401) {
      throw new UnauthorizedException(`${defaultMessage}: invalid GitHub token`);
    }

    if (response.status === 404) {
      throw new NotFoundException(`${defaultMessage}: resource not found on GitHub`);
    }

    if (
      response.status === 403 &&
      (remaining === '0' || errorText.toLowerCase().includes('rate limit'))
    ) {
      const retrySuffix = retryAfter
        ? ` Retry after ${retryAfter} seconds.`
        : '';

      throw new ForbiddenException(
        `${defaultMessage}: GitHub rate limit reached.${retrySuffix}`,
      );
    }

    if (response.status === 403) {
      throw new ForbiddenException(`${defaultMessage}: access forbidden by GitHub`);
    }

    throw new InternalServerErrorException(
      `${defaultMessage}: GitHub responded with ${response.status}`,
    );
  }

}
