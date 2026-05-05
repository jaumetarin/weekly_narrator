import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangelogService } from './changelog.service';
import { GetChangelogsQueryDto } from './dto/get-changelogs-query.dto';

@ApiTags('changelogs')
@ApiBearerAuth()
@Controller('changelogs')
export class ChangelogController {
  private readonly logger = new Logger(ChangelogController.name);
  constructor(
    private readonly changelogService: ChangelogService,
    private readonly configService: ConfigService,
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
  async generateChangelog(
    @Request() request,
    @Param('repositoryId', ParseIntPipe) repositoryId: number,
  ) {
    const changelog = await this.changelogService.generateChangelogForRepository(
      request.user.id,
      repositoryId,
    );

    return {
      message: 'Changelog generated successfully',
      changelog,
    };
  }
  
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  generateWeeklyChangelogs(
    @Headers('x-api-key') apiKey: string | undefined,
  ) {
    const expectedApiKey = this.configService.get<string>('CRON_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new ForbiddenException('Invalid cron API key');
    }

      void this.changelogService.generateWeeklyChangelogs().catch((error) => {
      this.logger.error(
        'Weekly changelog generation failed',
        error instanceof Error ? error.stack : undefined,
      );
    });


    return {
      message: 'Weekly changelog generation started',
    };
  }

}
