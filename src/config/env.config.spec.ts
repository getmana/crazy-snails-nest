import { describe, expect, it } from '@jest/globals';
import { MIN_SECRET_LENGTH, validateEnv } from './env.config';

const JWT_SECRET = 'j'.repeat(MIN_SECRET_LENGTH);
const REFRESH_SECRET = 'r'.repeat(MIN_SECRET_LENGTH);
const FRONTEND_API_SECRET = 'f'.repeat(MIN_SECRET_LENGTH);

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5433/photo_album',
  JWT_SECRET,
  REFRESH_SECRET,
};

const errorFor = (env: Record<string, unknown>) => {
  try {
    validateEnv(env);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('expected validateEnv to throw');
};

describe('validateEnv', () => {
  it('returns the input unchanged, keeping values as strings', () => {
    const env = {
      ...validEnv,
      PORT: '4000',
      NODE_ENV: 'development',
      REGISTRATION_ENABLED: 'true',
      TRUST_PROXY: 'loopback',
      UNRELATED_OS_VAR: 'kept',
    };

    expect(validateEnv(env)).toBe(env);
    expect(env.REGISTRATION_ENABLED).toBe('true');
  });

  it.each(['DATABASE_URL', 'JWT_SECRET', 'REFRESH_SECRET'])(
    'reports a missing or empty %s',
    (key) => {
      expect(errorFor({ ...validEnv, [key]: undefined })).toContain(
        `${key}: is required`,
      );
      expect(errorFor({ ...validEnv, [key]: '' })).toContain(
        `${key}: is required`,
      );
    },
  );

  it('reports every problem in one error', () => {
    const message = errorFor({
      NODE_ENV: 'production',
      TRUST_PROXY: 'true',
      PORT: 'abc',
    });

    for (const key of [
      'DATABASE_URL',
      'JWT_SECRET',
      'REFRESH_SECRET',
      'TRUST_PROXY',
      'PORT',
      'FRONTEND_API_SECRET',
    ]) {
      expect(message).toContain(`${key}:`);
    }
    expect(message).not.toContain('must differ');
    expect(message.match(/PORT:/g)).toHaveLength(1);
  });

  it('rejects a short secret without printing it', () => {
    const shortSecret = 'too-short-secret';
    const message = errorFor({ ...validEnv, JWT_SECRET: shortSecret });

    expect(message).toContain('JWT_SECRET: must be at least');
    expect(message).not.toContain(shortSecret);
  });

  it('rejects equal JWT and refresh secrets without printing them', () => {
    const message = errorFor({ ...validEnv, REFRESH_SECRET: JWT_SECRET });

    expect(message).toContain('REFRESH_SECRET: must differ from JWT_SECRET');
    expect(message).not.toContain(JWT_SECRET);
  });

  it('requires FRONTEND_API_SECRET in production', () => {
    expect(errorFor({ ...validEnv, NODE_ENV: 'production' })).toContain(
      'FRONTEND_API_SECRET: is required when NODE_ENV is production',
    );
    expect(
      validateEnv({ ...validEnv, NODE_ENV: 'production', FRONTEND_API_SECRET }),
    ).toBeDefined();
  });

  it('allows a missing FRONTEND_API_SECRET outside production', () => {
    expect(validateEnv({ ...validEnv, NODE_ENV: 'development' })).toBeDefined();
  });

  it('rejects TRUST_PROXY=true', () => {
    expect(errorFor({ ...validEnv, TRUST_PROXY: 'true' })).toContain(
      'TRUST_PROXY: must not be "true"',
    );
  });

  it.each([
    ['DATABASE_URL', 'mysql://user@localhost/db', 'must be a postgres'],
    ['DATABASE_URL', 'not a url', 'must be a postgres'],
    ['PORT', 'abc', 'must be an integer'],
    ['PORT', '70000', 'must be between'],
    ['PORT', '0', 'must be between'],
    ['NODE_ENV', 'staging', 'must be one of'],
    ['REGISTRATION_ENABLED', 'yes', 'must be "true" or "false"'],
  ])('rejects %s=%p', (key, value, expected) => {
    expect(errorFor({ ...validEnv, [key]: value })).toContain(
      `${key}: ${expected}`,
    );
  });
});
