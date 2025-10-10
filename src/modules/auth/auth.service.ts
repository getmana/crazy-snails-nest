import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SharedUsersService } from 'src/modules/shared/shared-users.service';
import { Response } from 'express';
import { UserStrategyPayload } from './strategies';

export type JwtPayload = {
  email: string;
  sub: number;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: SharedUsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    return this.userService.validateUser(email, password);
  }

  async signin(user: { id: number; email: string }) {
    const { id, email } = user;
    const { accessToken, refreshToken } = await this.getTokens({
      id,
      email,
    });

    return { accessToken, refreshToken, id };
  }

  async refreshToken(user: UserStrategyPayload) {
    try {
      console.log('refreshing token===============>');
      const { id, email } = user;

      const { accessToken, refreshToken } = await this.getTokens({
        id,
        email,
      });

      return { accessToken, refreshToken, id };
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  signout(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out successfully' };
  }

  async getTokens({
    id,
    email,
  }: {
    id: number;
    email: string;
  }): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: id,
      email: email,
    };
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(jwtPayload, {
          secret: process.env.JWT_SECRET as string,
          expiresIn: '15m',
        }),
        this.jwtService.signAsync(jwtPayload, {
          secret: process.env.REFRESH_SECRET as string,
          expiresIn: '7d',
        }),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Token generation failed');
    }
  }
}
