import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, type User } from './dto/users.dto';
import { ActiveUserNotFoundException } from 'src/exceptions/active-user-not-found.exception';
import { UserAlreadyExistsException } from 'src/exceptions/user-already-exists.exception';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const { email, password, username, role, isActive, locale } = data;

    const hashedPassword = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        role,
        locale,
        password: hashedPassword,
        isActive,
      },
    });

    return {
      email,
      username,
      id: user.id,
      role,
      isActive,
      locale: user.locale,
    };
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

  async findExistingUser({
    email,
    username,
  }: {
    email: string;
    username: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      throw new UserAlreadyExistsException(
        existingUser.email === email
          ? 'A user with this email already exists'
          : 'A user with this username already exists',
      );
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    console.log('service updateUserDto.email ===>', updateUserDto.email);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username || undefined,
        email: updateUserDto.email || undefined,
        admin_theme: updateUserDto.adminTheme || undefined,
        locale: updateUserDto.locale || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        admin_theme: true,
        locale: true,
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
