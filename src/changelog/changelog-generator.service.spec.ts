import { ForbiddenException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChangelogGeneratorService } from './changelog-generator.service';
import { NormalizedActivity } from '../github/normalizer.service';

describe('ChangelogGeneratorService', () => {
  let service: ChangelogGeneratorService;
  let configService: { get: jest.Mock };

  const activities: NormalizedActivity[] = [
    {
      type: 'commit',
      title: 'feat: add GitHub OAuth',
      authorName: 'Jaume',
      occurredAt: '2026-05-01T10:00:00.000Z',
      url: 'https://github.com/test/repo/commit/abc123',
      changedFiles: [
        {
          filename: 'src/auth/auth.service.ts',
          status: 'modified',
        },
      ],
    },
  ];

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GROQ_API_KEY') {
          return 'test-groq-key';
        }

        if (key === 'GROQ_MODEL') {
          return 'llama-3.3-70b-versatile';
        }

        return undefined;
      }),
    };

    service = new ChangelogGeneratorService(
      configService as unknown as ConfigService,
    );

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should generate changelog content when Groq responds successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content:
                'Esta semana se integró la autenticación con GitHub y se mejoró la estructura del backend.',
            },
          },
        ],
      }),
    });

    const result = await service.generateWeeklyChangelog(
      'weekly_narrator',
      activities,
    );

    expect(result).toBe(
      'Esta semana se integró la autenticación con GitHub y se mejoró la estructura del backend.',
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fail if GROQ_API_KEY is not configured', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'GROQ_MODEL') {
        return 'llama-3.3-70b-versatile';
      }

      return undefined;
    });

    await expect(
      service.generateWeeklyChangelog('weekly_narrator', activities),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should fail when Groq returns 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
    });

    await expect(
      service.generateWeeklyChangelog('weekly_narrator', activities),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should fail when Groq returns 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      text: jest.fn().mockResolvedValue('Rate limit reached'),
    });

    await expect(
      service.generateWeeklyChangelog('weekly_narrator', activities),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should fail when Groq response does not include generated content', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      }),
    });

    await expect(
      service.generateWeeklyChangelog('weekly_narrator', activities),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
