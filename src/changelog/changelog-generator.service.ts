import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NormalizedActivity } from '../github/normalizer.service';

@Injectable()
export class ChangelogGeneratorService {
  constructor(private readonly configService: ConfigService) {}

  async generateWeeklyChangelog(
    repositoryName: string,
    activities: NormalizedActivity[],
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;

    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new InternalServerErrorException(
          'Groq request timed out after 15 seconds',
        );
      }

      throw new InternalServerErrorException(
        'Failed to connect to Groq API',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      await this.handleGroqError(response);
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

  private async handleGroqError(response: Response): Promise<never> {
    const errorText = await response.text();

    if (response.status === 401) {
      throw new UnauthorizedException('Groq API authentication failed');
    }

    if (response.status === 403) {
      throw new ForbiddenException('Groq API access forbidden');
    }

    if (response.status === 429) {
      throw new ForbiddenException('Groq API rate limit reached');
    }

    throw new InternalServerErrorException(
      `Groq API request failed with status ${response.status}: ${errorText}`,
    );
  }
}
