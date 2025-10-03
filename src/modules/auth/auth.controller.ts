import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { type Request, type Response } from 'express';
import { type SignInPayload } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  async signin(@Body() signInPayload: SignInPayload, @Res() res: Response) {
    const user = await this.authService.validateUser(
      signInPayload.email,
      signInPayload.password,
    );
    const result = await this.authService.signin(user, res);
    res.send(result);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken =
      (req.cookies as { [key: string]: string })['refresh_token'] || '';

    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const result = await this.authService.refreshToken(refreshToken, res);
    res.send(result);
  }

  @Post('sign-out')
  @HttpCode(200)
  signout(@Res() res: Response) {
    const result = this.authService.signout(res);
    res.send(result);
  }
}
