import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { type Request, type Response } from 'express';
import { type SignInPayload } from './auth.dto';
import { UserStrategyPayload } from './strategies';

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
    const result = await this.authService.signin(user);
    res.send(result);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: Request & { user: UserStrategyPayload }) {
    const user = req.user;
    const result = await this.authService.refreshToken(user);
    return result;
  }

  @Post('sign-out')
  @HttpCode(200)
  signout(@Res() res: Response) {
    const result = this.authService.signout(res);
    res.send(result);
  }
}
