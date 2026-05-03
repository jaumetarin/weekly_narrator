import { Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';



@Controller('changelogs')
export class ChangelogController {
  constructor(
    @InjectQueue('changelog') 
    private readonly changelogQueue: Queue,
  ) {}



  @UseGuards(JwtAuthGuard)
  @Post('generate/:repositoryId')
  generateChangelog(
    @Request() request,
    @Param('repositoryId') repositoryId: string,
  ) {
   return this.changelogQueue.add(
  'generate-changelog',
  {
    userId: request.user.id,
    repositoryId: Number(repositoryId),
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
