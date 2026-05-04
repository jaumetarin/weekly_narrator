import { Controller, Get, Query, Request, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  redirectToGitHub(@Res() response: Response) {
    const authorizationUrl = this.authService.getGitHubAuthorizationUrl();
    return response.redirect(authorizationUrl);
  }

  @Get('github/callback')
  async handleGitHubCallback(
    @Query('code') code: string,
  ) {
    const accessToken = await this.authService.exchangeCodeForToken(code);
    const githubUser = await this.authService.getGitHubUserProfile(accessToken);
    const user = await this.authService.findOrCreateUser(githubUser, accessToken);
    const jwt = await this.authService.generateJwt(user);
    return { message: 'GitHub authentication successful', accessToken : jwt, user };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  getAuthenticatedUser(@Request() request) {
  return request.user;
}

}
