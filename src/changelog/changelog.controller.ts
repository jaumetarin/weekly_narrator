import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangelogService } from './changelog.service';
import { GetChangelogsQueryDto } from './dto/get-changelogs-query.dto';


@ApiTags('changelogs')
@ApiBearerAuth()
@Controller('changelogs')
export class ChangelogController {
  constructor(
    @InjectQueue('changelog') 
    private readonly changelogQueue: Queue,
    private readonly changelogService: ChangelogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getChangelogs(
    @Request() request,
    @Query() query: GetChangelogsQueryDto,
  ) {
    return this.changelogService.getChangelogsForUser(
      request.user.id,
      query,
    );
  }


  @UseGuards(JwtAuthGuard)
  @Post('generate/:repositoryId')
  generateChangelog(
    @Request() request,
    @Param('repositoryId', ParseIntPipe) repositoryId: number,
  ) {
   return this.changelogQueue.add(
  'generate-changelog',
  {
    userId: request.user.id,
    repositoryId,
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
