import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {JwtService} from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService, 
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  getGitHubAuthorizationUrl() {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GITHUB_CALLBACK_URL');

    const params = new URLSearchParams({
      client_id: clientId ?? '',
      redirect_uri: callbackUrl ?? '',
      scope: 'repo read:user user:email',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }


  async exchangeCodeForToken(code: string) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GITHUB_CALLBACK_URL');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
        redirect_uri: callbackUrl ?? '',
        code,
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new UnauthorizedException('Failed to exchange code for token');
    }
    return data.access_token;
  }

  async getGitHubUserProfile(accessToken: string) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',

      },
    });
    const data = await response.json();
    if (!data.id) {
      throw new UnauthorizedException('Failed to retrieve GitHub user profile');
    }
    return data;
  }

  async findOrCreateUser(githubUser: {
    id: number;
    login: string;
    name: string| null;
    email?: string| null;
  },
    accessToken: string,) {
    const githubId = githubUser.id.toString();

    const existingUser = await this.prismaService.user.findUnique({
      where: { githubId },
    });
    if (existingUser) {
      return this.prismaService.user.update({
        where: { id: existingUser.id },
        data: { githubAccessToken: accessToken },
      });
    }
    return this.prismaService.user.create({
      data: {
        githubId,
        name: githubUser.login,
        email: githubUser.email ?? null,
        githubAccessToken: accessToken
        ,
      },
    });
  }
  async generateJwt(user: { id: number; githubId: string | null }) {
  return this.jwtService.signAsync({
    sub: user.id,
    githubId: user.githubId ?? null,
  });
}

}