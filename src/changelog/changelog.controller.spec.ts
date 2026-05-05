import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';

describe('ChangelogController', () => {
  let app: INestApplication;

  const changelogServiceMock = {
    getChangelogsForUser: jest.fn(),
    generateChangelogForRepository: jest.fn(),
    generateWeeklyChangelogs: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'CRON_API_KEY') {
        return 'test-cron-key';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChangelogController],
      providers: [
        {
          provide: ChangelogService,
          useValue: changelogServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 1 };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('GET /changelogs should return paginated changelogs for the authenticated user', () => {
    changelogServiceMock.getChangelogsForUser.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Changelog for weekly_narrator',
          content: 'Resumen semanal generado',
          repository: {
            id: 3,
            name: 'weekly_narrator',
            fullName: 'Jaume/weekly_narrator',
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });

    return request(app.getHttpServer())
      .get('/changelogs?page=1&limit=10')
      .expect(200)
      .expect({
        items: [
          {
            id: 1,
            title: 'Changelog for weekly_narrator',
            content: 'Resumen semanal generado',
            repository: {
              id: 3,
              name: 'weekly_narrator',
              fullName: 'Jaume/weekly_narrator',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
        },
      });
  });

  it('POST /changelogs/generate/:repositoryId should generate a changelog for the authenticated user', async () => {
    changelogServiceMock.generateChangelogForRepository.mockResolvedValue({
      id: 10,
      title: 'Changelog for weekly_narrator',
      content: 'Resumen semanal generado',
      repositoryId: 3,
    });

    await request(app.getHttpServer())
      .post('/changelogs/generate/3')
      .expect(201)
      .expect({
        message: 'Changelog generated successfully',
        changelog: {
          id: 10,
          title: 'Changelog for weekly_narrator',
          content: 'Resumen semanal generado',
          repositoryId: 3,
        },
      });

    expect(
      changelogServiceMock.generateChangelogForRepository,
    ).toHaveBeenCalledTimes(1);

    expect(
      changelogServiceMock.generateChangelogForRepository,
    ).toHaveBeenCalledWith(1, 3);
  });

  it('POST /changelogs/generate should return 202 when the cron API key is valid', async () => {
    changelogServiceMock.generateWeeklyChangelogs.mockResolvedValue({
      totalRepositories: 2,
      successful: 2,
      failed: 0,
    });

    await request(app.getHttpServer())
      .post('/changelogs/generate')
      .set('x-api-key', 'test-cron-key')
      .expect(202)
      .expect({
        message: 'Weekly changelog generation started',
      });

    expect(
      changelogServiceMock.generateWeeklyChangelogs,
    ).toHaveBeenCalledTimes(1);
  });

  it('POST /changelogs/generate should return 403 when the cron API key is invalid', async () => {
    await request(app.getHttpServer())
      .post('/changelogs/generate')
      .set('x-api-key', 'wrong-key')
      .expect(403);

    expect(
      changelogServiceMock.generateWeeklyChangelogs,
    ).not.toHaveBeenCalled();
  });
});
