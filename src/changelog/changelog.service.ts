import { Injectable, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';

@Injectable()
export class ChangelogService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly githubService: GitHubService,
    private readonly configService: ConfigService,
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
    const content = await this.generateContentWithGroq(
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

  private async generateContentWithGroq(
    repositoryName: string,
    activities: Array<{
      type: 'commit' | 'pull_request';
      title: string;
      authorName: string | null;
      occurredAt: string | null;
      url: string;
      changedFiles: Array<{
        filename: string;
        status: string;
      }>;
    }>,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const model =
      this.configService.get<string>('GROQ_MODEL') ??
      'llama-3.3-70b-versatile';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY is not configured',
      );
    }

   const systemPrompt =
  'You are a CTO writing a short weekly update for non-technical stakeholders. Write in clear European Spanish. Focus on concrete progress and explain what was actually built or integrated. If the input shows progress in several areas, mention the most important ones instead of focusing on a single technical detail. Use changed files only as supporting context. Do not invent details, do not exaggerate impact, and avoid vague corporate phrases. Write 3 to 5 full sentences. Do not use bullet points, headings, or markdown lists.';





   const userPrompt = [
  `Repository: ${repositoryName}`,
  '',
  'Write a short weekly changelog in European Spanish based on the following normalized repository activity.',
  'Summarize the most important progress of the week in a concrete and natural way.',
  'If the activity includes authentication, GitHub integration, repository synchronization, normalization, or changelog generation, mention the most relevant areas instead of focusing only on one.',
  'Prefer precise language over generic claims.',
  'Do not mention every file individually unless it is essential to understand the progress.',
  '',
  JSON.stringify(activities, null, 2),
].join('\n');




    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.3,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Failed to generate changelog with Groq: ${errorText}`,
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException(
        'Groq response did not include generated content',
      );
    }

    return content;
  }
}
