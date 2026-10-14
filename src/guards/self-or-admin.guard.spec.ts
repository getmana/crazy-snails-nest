import { beforeEach, describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { SelfOrAdminGuard } from './self-or-admin.guard';
import { type UserStrategyPayload } from 'src/modules/auth/strategies';
import { createHttpContext } from 'src/testing/http-context';

const admin: UserStrategyPayload = {
  id: 1,
  email: 'admin@example.com',
  role: Role.admin,
};
const editor: UserStrategyPayload = {
  id: 7,
  email: 'editor@example.com',
  role: Role.editor,
};

describe('SelfOrAdminGuard', () => {
  let guard: SelfOrAdminGuard;

  beforeEach(() => {
    guard = new SelfOrAdminGuard(new Reflector());
  });

  const canActivate = (user: UserStrategyPayload, paramsId: string) =>
    guard.canActivate(createHttpContext({ user, params: { id: paramsId } }));

  it('allows an admin to act on another user', () => {
    expect(canActivate(admin, '7')).toBe(true);
  });

  it('allows a user to act on themselves', () => {
    expect(canActivate(editor, '7')).toBe(true);
  });

  it('forbids a non-admin acting on another user', () => {
    expect(() => canActivate(editor, '8')).toThrow(ForbiddenException);
  });
});
