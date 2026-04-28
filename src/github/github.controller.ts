import { Controller, Get, Request, UseGuards, Body, Post, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { GitHubService } from './github.service';

@Controller('github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @UseGuards(JwtAuthGuard)
  @Get('repos')
  getRepositories(@Request() request) {
    return this.githubService.getRepositoriesForUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
@Post('repos/sync')
syncRepositories(
  @Request() request,
  @Body()
  repositories: Array<{
    githubRepoId: number;
    name: string;
    fullName: string;
  }>,
) {
  return this.githubService.syncRepositoriesForUser(request.user.id, repositories);
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/commits')
getRepositoryCommits(
  @Request() request,
  @Param('repositoryId') repositoryId: string,
) {
  return this.githubService.getCommitsForRepository(
    request.user.id,
    Number(repositoryId),
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/pulls')
getRepositoryPullRequests(
  @Request() request,
  @Param('repositoryId') repositoryId: string,
) {
  return this.githubService.getPullRequestsForRepository(
    request.user.id,
    Number(repositoryId),
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/commits/normalized')
getNormalizedRepositoryCommits(
  @Request() request,
  @Param('repositoryId') repositoryId: string,
) {
  return this.githubService.getNormalizedCommitsForRepository(
    request.user.id,
    Number(repositoryId),
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/pulls/normalized')
getNormalizedRepositoryPullRequests(
  @Request() request,
  @Param('repositoryId') repositoryId: string,
) {
  return this.githubService.getNormalizedPullRequestsForRepository(
    request.user.id,
    Number(repositoryId),
  );
}


}
