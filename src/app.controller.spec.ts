import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigService} from "@nestjs/config";

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, {
        provide: ConfigService,
        useValue: {
          get: (key: string) => {
            if (key === 'APP_NAME') {
              return 'weekly_narrator_api';
            }
            return undefined;
          },
        },
      }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health check information', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' ,
         app:'weekly_narrator_api'});
    });
  });
});
