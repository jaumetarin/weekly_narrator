import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';
import { getQueueToken } from '@nestjs/bullmq';

describe('ChangelogController', () => {
  let app: INestApplication;

  const changelogServiceMock = {
    getChangelogsForUser: jest.fn(),
  };

  const queueMock = {
    add: jest.fn(),
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
          provide: getQueueToken('changelog'),
          useValue: queueMock,
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
  
    it('POST /changelogs/generate/:repositoryId should enqueue a changelog job', async () => {
    queueMock.add.mockResolvedValue({
      id: 'job-1',
      name: 'generate-changelog',
      data: {
        userId: 1,
        repositoryId: 3,
      },
    });

    await request(app.getHttpServer())
      .post('/changelogs/generate/3')
      .expect(201);

    expect(queueMock.add).toHaveBeenCalledTimes(1);
    expect(queueMock.add).toHaveBeenCalledWith(
      'generate-changelog',
      {
        userId: 1,
        repositoryId: 3,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  });
});
