import argon2 from 'argon2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ErrorCodes } from 'src/constants/error-codes';
import { ActiveUserNotFoundException } from 'src/exceptions';

@Injectable()
export class SharedUsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    }
    return user;
  }

  async findActiveUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new ActiveUserNotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
