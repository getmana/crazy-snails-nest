import { describe, expect, it } from '@jest/globals';
import { Locale, Role } from '@prisma/client';
import { DefaultUserFieldsPipe } from './default-user-fields.pipe';

describe('DefaultUserFieldsPipe', () => {
  const pipe = new DefaultUserFieldsPipe();
  const signup = {
    email: 'new@example.com',
    username: 'newbie',
    password: 'Correct-Horse-1',
    locale: Locale.en,
  };

  it('registers new users as editors', () => {
    expect(pipe.transform(signup)).toEqual({ ...signup, role: Role.editor });
  });

  it('ignores a role sent by the client', () => {
    const withAdminRole = { ...signup, role: Role.admin };

    expect(pipe.transform(withAdminRole)).toMatchObject({ role: Role.editor });
  });
});
