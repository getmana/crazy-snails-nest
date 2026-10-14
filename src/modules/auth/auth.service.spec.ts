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
import { JwtService } from '@nestjs/jwt';
import { AdminTheme, Locale, Role } from '@prisma/client';
import { getLoggerToken } from 'pino-nestjs';
import { AuthService, type JwtPayload } from './auth.service';
import { SharedUsersService } from 'src/modules/shared/users/shared-users.service';
import { TokenGenerationFailedException } from 'src/exceptions';

const SECRETS: Record<string, string> = {
  JWT_SECRET: 'test-access-secret',
  REFRESH_SECRET: 'test-refresh-secret',
};
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

type SignedPayload = JwtPayload & { iat: number; exp: number };

const getSecret = (key: string) => {
  const secret = SECRETS[key];
  if (!secret) throw new Error(`Missing config key ${key}`);
  return secret;
};

const mockConfig = { getOrThrow: jest.fn<(key: string) => string>() };
const mockLogger = { error: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;
  const jwtService = new JwtService();

  beforeEach(async () => {
    mockConfig.getOrThrow.mockImplementation(getSecret);

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SharedUsersService, useValue: {} },
        { provide: getLoggerToken(AuthService.name), useValue: mockLogger },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const verify = (token: string, secret: string) =>
    jwtService.verifyAsync<SignedPayload>(token, { secret });

  describe('getTokens', () => {
    it('signs a 15-minute access token with JWT_SECRET', async () => {
      const { accessToken } = await service.getTokens({
        id: 7,
        email: 'user@example.com',
      });

      const payload = await verify(accessToken, SECRETS.JWT_SECRET);

      expect(payload).toMatchObject({ sub: 7, email: 'user@example.com' });
      expect(payload.exp - payload.iat).toBe(ACCESS_TTL_SECONDS);
    });

    it('signs a 7-day refresh token with REFRESH_SECRET', async () => {
      const { refreshToken } = await service.getTokens({
        id: 7,
        email: 'user@example.com',
      });

      const payload = await verify(refreshToken, SECRETS.REFRESH_SECRET);

      expect(payload).toMatchObject({ sub: 7, email: 'user@example.com' });
      expect(payload.exp - payload.iat).toBe(REFRESH_TTL_SECONDS);
    });

    it('does not accept the access token with the refresh secret', async () => {
      const { accessToken } = await service.getTokens({
        id: 7,
        email: 'user@example.com',
      });

      await expect(
        verify(accessToken, SECRETS.REFRESH_SECRET),
      ).rejects.toThrow();
    });

    it('throws TokenGenerationFailedException and logs when signing fails', async () => {
      mockConfig.getOrThrow.mockImplementation(() => {
        throw new Error('Missing config key JWT_SECRET');
      });

      await expect(
        service.getTokens({ id: 7, email: 'user@example.com' }),
      ).rejects.toBeInstanceOf(TokenGenerationFailedException);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('signin', () => {
    it('returns tokens and profile fields without the password hash', async () => {
      const userRow = {
        id: 7,
        email: 'user@example.com',
        password: '$argon2id$hash',
        role: Role.editor,
        locale: Locale.uk,
        admin_theme: AdminTheme.light,
      };

      const result = await service.signin(userRow);

      expect(Object.keys(result).sort()).toEqual(
        ['accessToken', 'admin_theme', 'id', 'locale', 'refreshToken'].sort(),
      );
      expect(result).toMatchObject({
        id: 7,
        locale: Locale.uk,
        admin_theme: AdminTheme.light,
      });
    });
  });

  describe('refreshToken', () => {
    it('returns a fresh token pair and the user id', async () => {
      const result = await service.refreshToken({
        id: 7,
        email: 'user@example.com',
        role: Role.editor,
      });

      expect(Object.keys(result).sort()).toEqual(
        ['accessToken', 'id', 'refreshToken'].sort(),
      );
      await expect(
        verify(result.refreshToken, SECRETS.REFRESH_SECRET),
      ).resolves.toMatchObject({ sub: 7 });
    });
  });
});
