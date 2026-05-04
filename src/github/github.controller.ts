import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { GitHubService } from './github.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SyncRepositoriesDto } from './dto/sync-repositories.dto';


@ApiTags('github')
@ApiBearerAuth()
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
  @Body() body: SyncRepositoriesDto,
) {
  return this.githubService.syncRepositoriesForUser(request.user.id, body.repositories);
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/commits')
getRepositoryCommits(
  @Request() request,
  @Param('repositoryId', ParseIntPipe) repositoryId: number,
) {
  return this.githubService.getCommitsForRepository(
    request.user.id,
    repositoryId,
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/pulls')
getRepositoryPullRequests(
  @Request() request,
  @Param('repositoryId', ParseIntPipe) repositoryId: number,
) {
  return this.githubService.getPullRequestsForRepository(
    request.user.id,
    repositoryId,
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/commits/normalized')
getNormalizedRepositoryCommits(
  @Request() request,
  @Param('repositoryId', ParseIntPipe) repositoryId: number,
) {
  return this.githubService.getNormalizedCommitsForRepository(
    request.user.id,
    repositoryId,
  );
}

@UseGuards(JwtAuthGuard)
@Get('repos/:repositoryId/pulls/normalized')
getNormalizedRepositoryPullRequests(
  @Request() request,
  @Param('repositoryId', ParseIntPipe) repositoryId: number,
) {
  return this.githubService.getNormalizedPullRequestsForRepository(
    request.user.id,
    repositoryId,
  );
}


}
