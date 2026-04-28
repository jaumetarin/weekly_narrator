import { Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { ChangelogService } from './changelog.service';

@Controller('changelogs')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate/:repositoryId')
  generateChangelog(
    @Request() request,
    @Param('repositoryId') repositoryId: string,
  ) {
    return this.changelogService.generateChangelogForRepository(
      request.user.id,
      Number(repositoryId),
    );
  }
}
