import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, type User } from './dto/users.dto';
import { Prisma } from '@prisma/client';
import { ActiveUserNotFoundException } from 'src/exceptions/active-user-not-found';

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

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

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

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    console.log('service updateUserDto.email ===>', updateUserDto.email);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username || undefined,
        email: updateUserDto.email || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    return user;
  }

  async deactivateUser(id: number) {
    const deactivatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { id: deactivatedUser.id };
  }
}
