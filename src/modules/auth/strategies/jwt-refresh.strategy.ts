import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SharedUsersService } from 'src/modules/shared/shared-users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private userService: SharedUsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET || '',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.userService.findByEmail(payload.email);

    if (!user) throw new UnauthorizedException('User not found');

    return { id: user.id, email: user.email, role: user.role };
  }
}
