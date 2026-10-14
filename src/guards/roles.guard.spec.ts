import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ErrorCodes } from 'src/constants/error-codes';
import { createHttpContext } from 'src/testing/http-context';

const editor = { id: 7, email: 'editor@example.com', role: Role.editor };

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const requireRoles = (roles: Role[] | undefined) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  it('allows any request when the route requires no roles', () => {
    requireRoles(undefined);

    expect(guard.canActivate(createHttpContext({}))).toBe(true);
  });

  it('allows a user whose role is required', () => {
    requireRoles([Role.admin, Role.editor]);

    expect(guard.canActivate(createHttpContext({ user: editor }))).toBe(true);
  });

  it('forbids a user whose role is not required', () => {
    requireRoles([Role.admin]);

    expect(() =>
      guard.canActivate(createHttpContext({ user: editor })),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        }),
      }),
    );
  });

  it('forbids a request without a user when roles are required', () => {
    requireRoles([Role.admin]);

    expect(() => guard.canActivate(createHttpContext({}))).toThrow(
      ForbiddenException,
    );
  });
});
