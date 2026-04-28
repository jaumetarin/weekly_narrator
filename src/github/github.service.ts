import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {NormalizerService} from './normalizer.service';

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

    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch repositories from GitHub');
    }

    const repositories = await response.json();

    return repositories.map((repository: any) => ({
      githubRepoId: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      isPrivate: repository.private,
      defaultBranch: repository.default_branch,
      url: repository.html_url,
    }));
  }

  async syncRepositoriesForUser(
  userId: number,
  repositories: Array<{
    githubRepoId: number;
    name: string;
    fullName: string;
  }>,
) {
  return Promise.all(
    repositories.map((repository) =>
      this.prismaService.repository.upsert({
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

  const response = await fetch(
    `https://api.github.com/repos/${repository.fullName}/commits?per_page=30`,
    {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    throw new UnauthorizedException('Failed to fetch commits from GitHub');
  }

  const commits = await response.json();

return Promise.all(
  commits.slice(0, 10).map(async (commit: any) => {
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
      throw new UnauthorizedException('Failed to fetch commit details from GitHub');
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
    `https://api.github.com/repos/${repository.fullName}/pulls?state=all&per_page=30`,
    {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    throw new UnauthorizedException('Failed to fetch pull requests from GitHub');
  }

  const pullRequests = await response.json();

return Promise.all(
  pullRequests.slice(0, 10).map(async (pullRequest: any) => {
    const pullRequestFilesResponse = await fetch(
      `https://api.github.com/repos/${repository.fullName}/pulls/${pullRequest.number}/files`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!pullRequestFilesResponse.ok) {
      throw new UnauthorizedException('Failed to fetch pull request files from GitHub');
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


}
