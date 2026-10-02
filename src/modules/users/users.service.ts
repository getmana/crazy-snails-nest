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
    const { email, password, username, role, locale } = data;

    await this.findExistingUser({ email, username });

    const hashedPassword = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        role,
        locale,
        password: hashedPassword,
      },
    });

    return {
      email,
      username,
      id: user.id,
      role,
      isActive: user.is_active,
      locale: user.locale,
      adminTheme: user.admin_theme,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        is_active: true,
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
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      throw new ActiveUserNotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findExistingUser({
    email,
    username,
    id,
  }: {
    email?: string;
    username?: string;
    id?: number;
  }): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
        ...(id !== undefined && { NOT: { id } }),
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
    const { username, email, adminTheme, locale } = updateUserDto;

    if (username || email) {
      await this.findExistingUser({ username, email, id });
    }

    const user = await this.prisma.user.update({
      where: { id, is_active: true },
      data: {
        username,
        email,
        admin_theme: adminTheme,
        locale,
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
      where: { id, is_active: true },
      data: { is_active: false },
    });

    return { id: deactivatedUser.id };
  }
}
