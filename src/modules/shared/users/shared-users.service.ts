import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  ActiveUserNotFoundException,
  InvalidCredentialsException,
} from 'src/exceptions';

@Injectable()
export class SharedUsersService {
  constructor(private prisma: PrismaService) {}

  async findActiveByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email, is_active: true } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findActiveByEmail(email);
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new InvalidCredentialsException('Invalid credentials');
    }
    return user;
  }

  async assertActiveUser(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id, is_active: true },
      select: { id: true },
    });

    if (!user) {
      throw new ActiveUserNotFoundException(`User with ID ${id} not found`);
    }
  }
}
