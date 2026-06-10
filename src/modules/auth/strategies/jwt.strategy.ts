import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { ErrorCodes } from 'src/constants/error-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: SharedUsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.userService.findByEmail(payload.email);

    if (!user)
      throw new UnauthorizedException({
        message: 'User not found',
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
      });

    return { id: user.id, email: user.email, role: user.role };
  }
}
