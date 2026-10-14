import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { ErrorCodes } from 'src/constants/error-codes';
import { asyncMock } from 'src/testing/jest-mocks';

const mockUsers = { findActiveByEmail: asyncMock() };
const mockConfig = { getOrThrow: () => 'test-secret' };
const payload = { sub: 7, email: 'user@example.com' };

const strategies = [JwtStrategy, JwtRefreshStrategy].map((Strategy) => ({
  name: Strategy.name,
  Strategy,
}));

describe.each(strategies)('$name.validate', ({ Strategy }) => {
  let strategy: JwtStrategy | JwtRefreshStrategy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        Strategy,
        { provide: SharedUsersService, useValue: mockUsers },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get(Strategy);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('looks the user up among active users by the token email', async () => {
    mockUsers.findActiveByEmail.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow();

    expect(mockUsers.findActiveByEmail).toHaveBeenCalledWith(payload.email);
  });

  it('returns only id, email and role of the user', async () => {
    mockUsers.findActiveByEmail.mockResolvedValue({
      id: 7,
      email: payload.email,
      role: Role.editor,
      password: '$argon2id$hash',
      is_active: true,
    });

    await expect(strategy.validate(payload)).resolves.toStrictEqual({
      id: 7,
      email: payload.email,
      role: Role.editor,
    });
  });

  it('rejects with AUTH_USER_NOT_FOUND when no active user exists', async () => {
    mockUsers.findActiveByEmail.mockResolvedValue(null);

    const call = strategy.validate(payload);

    await expect(call).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(call).rejects.toMatchObject({
      response: { code: ErrorCodes.AUTH_USER_NOT_FOUND },
    });
  });
});
