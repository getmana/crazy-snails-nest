import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import argon2 from 'argon2';
import { AdminTheme, Locale, Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActiveUserNotFoundException } from 'src/exceptions/active-user-not-found.exception';
import { UserAlreadyExistsException } from 'src/exceptions/user-already-exists.exception';
import { asyncMock } from 'src/testing/jest-mocks';

const PASSWORD = 'Correct-Horse-1';

const mockPrisma = {
  user: {
    create: asyncMock(),
    findMany: asyncMock(),
    findUnique: asyncMock(),
    findFirst: asyncMock(),
    update: asyncMock(),
  },
};

type QueryArgs = {
  where: Record<string, unknown>;
  select?: Record<string, boolean>;
  data?: Record<string, unknown>;
};

const firstCallArgs = (
  mock: (typeof mockPrisma.user)[keyof typeof mockPrisma.user],
) => {
  const [[args]] = mock.mock.calls as [[QueryArgs]];
  return args;
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createUser', () => {
    const signup = {
      email: 'new@example.com',
      username: 'newbie',
      password: PASSWORD,
      role: Role.editor,
      locale: Locale.en,
    };

    const createdRow = {
      id: 9,
      email: signup.email,
      username: signup.username,
      password: '$argon2id$stored',
      role: Role.editor,
      locale: Locale.en,
      admin_theme: AdminTheme.light,
      is_active: true,
    };

    it('checks that the email and username are free', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdRow);

      await service.createUser(signup);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ email: signup.email }, { username: signup.username }] },
      });
    });

    it('stores a hash of the password, never the password itself', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdRow);

      await service.createUser(signup);

      const stored = firstCallArgs(mockPrisma.user.create).data?.password;
      expect(typeof stored).toBe('string');
      expect(stored).not.toBe(PASSWORD);
      await expect(argon2.verify(stored as string, PASSWORD)).resolves.toBe(
        true,
      );
    });

    it('returns the new user without the password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdRow);

      await expect(service.createUser(signup)).resolves.toStrictEqual({
        id: 9,
        email: signup.email,
        username: signup.username,
        role: Role.editor,
        locale: Locale.en,
        isActive: true,
        adminTheme: AdminTheme.light,
      });
    });

    it('does not create a user when the email or username is taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ email: signup.email });

      await expect(service.createUser(signup)).rejects.toBeInstanceOf(
        UserAlreadyExistsException,
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lists active users without selecting the password', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll();

      const args = firstCallArgs(mockPrisma.user.findMany);
      expect(args.where).toEqual({ is_active: true });
      expect(args.select).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('returns an active user', async () => {
      const user = {
        id: 3,
        email: 'a@example.com',
        username: 'a',
        role: Role.editor,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findOne(3)).resolves.toBe(user);
    });

    it('throws ActiveUserNotFoundException for a missing or deactivated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(3)).rejects.toBeInstanceOf(
        ActiveUserNotFoundException,
      );
    });

    it('only looks up active users and never selects the password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(3)).rejects.toThrow();

      const args = firstCallArgs(mockPrisma.user.findUnique);
      expect(args.where).toEqual({ id: 3, is_active: true });
      expect(args.select).not.toHaveProperty('password');
    });
  });

  describe('findExistingUser', () => {
    it('resolves when nobody uses the email or username', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findExistingUser({ email: 'a@example.com', username: 'a' }),
      ).resolves.toBeUndefined();
    });

    it('reports a taken email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ email: 'a@example.com' });

      await expect(
        service.findExistingUser({ email: 'a@example.com', username: 'a' }),
      ).rejects.toThrow('A user with this email already exists');
    });

    it('reports a taken username', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        email: 'other@example.com',
      });

      await expect(
        service.findExistingUser({ email: 'a@example.com', username: 'a' }),
      ).rejects.toThrow('A user with this username already exists');
    });

    it('reports a taken username when no email is given', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        email: 'other@example.com',
      });

      await expect(service.findExistingUser({ username: 'a' })).rejects.toThrow(
        'A user with this username already exists',
      );
    });

    it('ignores the user themselves when an id is given', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await service.findExistingUser({ username: 'a', id: 3 });

      expect(firstCallArgs(mockPrisma.user.findFirst).where).toMatchObject({
        NOT: { id: 3 },
      });
    });

    it('does not exclude anyone when no id is given', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await service.findExistingUser({ username: 'a' });

      expect(firstCallArgs(mockPrisma.user.findFirst).where).not.toHaveProperty(
        'NOT',
      );
    });
  });

  describe('updateUser', () => {
    it('skips the uniqueness check when neither email nor username changes', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 3 });

      await service.updateUser(3, {
        adminTheme: AdminTheme.dark,
        locale: Locale.uk,
      });

      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('checks uniqueness excluding the user themselves', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ id: 3 });

      await service.updateUser(3, { username: 'renamed' });

      expect(firstCallArgs(mockPrisma.user.findFirst).where).toMatchObject({
        NOT: { id: 3 },
      });
    });

    it('does not update when the new email or username is taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        email: 'taken@example.com',
      });

      await expect(
        service.updateUser(3, { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(UserAlreadyExistsException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('updates an active user and never selects the password', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 3 });

      await service.updateUser(3, { adminTheme: AdminTheme.dark });

      const args = firstCallArgs(mockPrisma.user.update);
      expect(args.where).toEqual({ id: 3, is_active: true });
      expect(args.data).toMatchObject({ admin_theme: AdminTheme.dark });
      expect(args.select).not.toHaveProperty('password');
    });
  });

  describe('deactivateUser', () => {
    it('deactivates an active user and returns its id', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 3, is_active: false });

      await expect(service.deactivateUser(3)).resolves.toEqual({ id: 3 });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 3, is_active: true },
        data: { is_active: false },
      });
    });
  });
});
