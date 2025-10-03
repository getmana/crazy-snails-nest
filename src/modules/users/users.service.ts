import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type User } from './users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const { email, password, username, role, isActive } = data;

    const hashedPassword = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        role,
        password: hashedPassword,
        isActive,
      },
    });

    return { email, username, id: user.id, role, isActive };
  }

  async deleteUser(id: number) {
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    return deletedUser.id;
  }
}
