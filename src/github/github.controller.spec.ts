import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guards';

describe('GitHubController', () => {
  let app: INestApplication;

  const githubServiceMock = {
    syncRepositoriesForUser: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GitHubController],
      providers: [
        {
          provide: GitHubService,
          useValue: githubServiceMock,
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

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('POST /github/repos/sync should sync repositories for the authenticated user', async () => {
    githubServiceMock.syncRepositoriesForUser.mockResolvedValue([
      {
        id: 1,
        githubRepoId: 123456789,
        name: 'weekly_narrator',
        fullName: 'Jaume/weekly_narrator',
        userId: 1,
        isActive: true,
      },
    ]);

    await request(app.getHttpServer())
      .post('/github/repos/sync')
      .send({
        repositories: [
          {
            githubRepoId: 123456789,
            name: 'weekly_narrator',
            fullName: 'Jaume/weekly_narrator',
          },
        ],
      })
      .expect(201);

    expect(githubServiceMock.syncRepositoriesForUser).toHaveBeenCalledTimes(1);
    expect(githubServiceMock.syncRepositoriesForUser).toHaveBeenCalledWith(
      1,
      [
        {
          githubRepoId: 123456789,
          name: 'weekly_narrator',
          fullName: 'Jaume/weekly_narrator',
        },
      ],
    );
  });
  
  it('POST /github/repos/sync should reject an invalid request body', async () => {
  await request(app.getHttpServer())
    .post('/github/repos/sync')
    .send({
      repositories: [
        {
          githubRepoId: 'not-a-number',
          name: '',
          fullName: 123,
        },
      ],
    })
    .expect(400);

  expect(githubServiceMock.syncRepositoriesForUser).not.toHaveBeenCalled();
});

});
