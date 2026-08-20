import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { UserStrategyPayload } from './strategies';
import { AdminTheme, Locale } from '@prisma/client';
import { TokenGenerationFailedException } from 'src/exceptions';
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';

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
    @InjectPinoLogger(AuthService.name) private logger: PinoLogger,
  ) {}

  async validateUser(email: string, password: string) {
    return this.userService.validateUser(email, password);
  }

  async signin(user: {
    id: number;
    email: string;
    locale: Locale;
    admin_theme: AdminTheme;
  }) {
    const { id, email, locale, admin_theme } = user;
    const { accessToken, refreshToken } = await this.getTokens({
      id,
      email,
    });

    return { accessToken, refreshToken, id, locale, adminTheme: admin_theme };
  }

  async refreshToken(user: UserStrategyPayload) {
    console.log('refreshing token===============>');
    const { id, email } = user;

    const { accessToken, refreshToken } = await this.getTokens({
      id,
      email,
    });

    return { accessToken, refreshToken, id };
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
      this.logger.error(
        'AuthService error',
        e instanceof Error ? e.stack : String(e),
        AuthService.name,
      );

      throw new TokenGenerationFailedException('Token generation failed');
    }
  }
}
