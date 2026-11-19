import { afterEach, describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import {
  createThrottlerOptions,
  FRONTEND_SECRET_ENV,
  FRONTEND_SECRET_HEADER,
  isTrustedFrontend,
} from './throttler.config';
import { createHttpContext } from 'src/testing/http-context';

const SECRET = 'a-long-random-frontend-secret';

describe('isTrustedFrontend', () => {
  it('trusts a header that matches the secret', () => {
    expect(isTrustedFrontend(SECRET, SECRET)).toBe(true);
  });

  it.each([
    ['a wrong value', 'not-the-secret'],
    ['a different-length value', `${SECRET}-extra`],
    ['an empty header', ''],
    ['a missing header', undefined],
    ['a repeated header', [SECRET, SECRET]],
  ])('rejects %s', (_label, header) => {
    expect(isTrustedFrontend(header, SECRET)).toBe(false);
  });

  it.each([[undefined], ['']])(
    'trusts nothing when the secret is %p, even an empty header',
    (secret) => {
      expect(isTrustedFrontend('', secret)).toBe(false);
      expect(isTrustedFrontend(undefined, secret)).toBe(false);
    },
  );
});

// ConfigService reads process.env first, so the tests set the secret there.
describe('createThrottlerOptions', () => {
  const originalSecret = process.env[FRONTEND_SECRET_ENV];

  afterEach(() => {
    if (originalSecret === undefined) delete process.env[FRONTEND_SECRET_ENV];
    else process.env[FRONTEND_SECRET_ENV] = originalSecret;
  });

  const skipIfFor = (headers: Record<string, string>) => {
    const { skipIf } = createThrottlerOptions(new ConfigService());
    return skipIf(createHttpContext({ headers }));
  };

  it('skips the limits for a request with the configured secret', () => {
    process.env[FRONTEND_SECRET_ENV] = SECRET;

    expect(skipIfFor({ [FRONTEND_SECRET_HEADER]: SECRET })).toBe(true);
  });

  it('applies the limits to a request without the secret', () => {
    process.env[FRONTEND_SECRET_ENV] = SECRET;

    expect(skipIfFor({})).toBe(false);
  });

  it('applies the limits when no secret is configured', () => {
    delete process.env[FRONTEND_SECRET_ENV];

    expect(skipIfFor({ [FRONTEND_SECRET_HEADER]: '' })).toBe(false);
  });
});
