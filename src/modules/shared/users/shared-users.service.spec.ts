import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import { SharedUsersService } from './shared-users.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ActiveUserNotFoundException } from 'src/exceptions';
import { ErrorCodes } from 'src/constants/error-codes';
import { asyncMock } from 'src/testing/jest-mocks';

const PASSWORD = 'Correct-Horse-1';
const EMAIL = 'user@example.com';

const mockPrisma = {
  user: { findUnique: asyncMock() },
};

describe('SharedUsersService', () => {
  let service: SharedUsersService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await argon2.hash(PASSWORD);
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SharedUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(SharedUsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateUser', () => {
    const invalidCredentials = {
      response: {
        message: 'Invalid credentials',
        code: ErrorCodes.INVALID_CREDENTIALS,
      },
    };

    it('returns the user when the password matches', async () => {
      const user = { id: 1, email: EMAIL, password: passwordHash };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.validateUser(EMAIL, PASSWORD)).resolves.toBe(user);
    });

    it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: EMAIL,
        password: passwordHash,
      });

      const call = service.validateUser(EMAIL, 'Wrong-Password-1');

      await expect(call).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(call).rejects.toMatchObject(invalidCredentials);
    });

    it('rejects an unknown email exactly like a wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const call = service.validateUser('nobody@example.com', PASSWORD);

      await expect(call).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(call).rejects.toMatchObject(invalidCredentials);
    });

    it('only looks up active users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(EMAIL, PASSWORD)).rejects.toThrow();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: EMAIL, is_active: true },
      });
    });
  });

  describe('assertActiveUser', () => {
    it('resolves when an active user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.assertActiveUser(1)).resolves.toBeUndefined();
    });

    it('throws ActiveUserNotFoundException when no active user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assertActiveUser(1)).rejects.toBeInstanceOf(
        ActiveUserNotFoundException,
      );
    });
  });
});
