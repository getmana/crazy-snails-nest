import { beforeEach, describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { OptionalJwtGuard } from './optional-jwt.guard';
import { createHttpContext } from 'src/testing/http-context';

const user = { id: 7, email: 'user@example.com', role: Role.editor };
const anonymousRequest = { headers: {} };
const tokenRequest = { headers: { authorization: 'Bearer expired.token' } };

describe('OptionalJwtGuard.handleRequest', () => {
  let guard: OptionalJwtGuard;

  beforeEach(() => {
    guard = new OptionalJwtGuard();
  });

  it('rethrows an authentication error', () => {
    const error = new Error('strategy failure');

    expect(() =>
      guard.handleRequest(error, null, null, createHttpContext(tokenRequest)),
    ).toThrow(error);
  });

  it('returns the authenticated user', () => {
    expect(
      guard.handleRequest(null, user, null, createHttpContext(tokenRequest)),
    ).toBe(user);
  });

  it('returns null for an anonymous request', () => {
    expect(
      guard.handleRequest(
        null,
        false,
        null,
        createHttpContext(anonymousRequest),
      ),
    ).toBeNull();
  });

  it('rejects a request whose token could not be verified', () => {
    const info = new Error('jwt expired');

    expect(() =>
      guard.handleRequest(null, false, info, createHttpContext(tokenRequest)),
    ).toThrow(new UnauthorizedException('jwt expired'));
  });
});
