import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService} from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async getHealth() {
    const usersCount = await this.prismaService.user.count();
    return {status: 'ok'
      , app: this.configService.get<string>('APP_NAME')
      , usersCount,
    };
  }
}
