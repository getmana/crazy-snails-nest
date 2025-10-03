import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SharedUsersService } from 'src/modules/shared/shared-users.service';
import { Response } from 'express';

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

  async signin(user: { id: number; email: string }, res: Response) {
    const { id, email } = user;
    const { accessToken, refreshToken } = await this.getTokens({
      id,
      email,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  async refreshToken(refreshToken: string, res: Response) {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });
      const user = await this.userService.findByEmail(payload.email);
      if (!user) throw new UnauthorizedException();
      const { id, email } = user;

      const { accessToken, refreshToken: newRefreshToken } =
        await this.getTokens({
          id,
          email,
        });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken };
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
