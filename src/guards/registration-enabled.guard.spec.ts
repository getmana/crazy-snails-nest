import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegistrationEnabledGuard } from './registration-enabled.guard';
import { ErrorCodes } from 'src/constants';

const FLAG = 'REGISTRATION_ENABLED';

// ConfigService reads process.env first, so the tests set the flag there.
describe('RegistrationEnabledGuard', () => {
  const originalFlag = process.env[FLAG];
  let guard: RegistrationEnabledGuard;

  const setFlag = (value: string | undefined) => {
    if (value === undefined) delete process.env[FLAG];
    else process.env[FLAG] = value;
  };

  beforeEach(() => {
    guard = new RegistrationEnabledGuard(new ConfigService());
  });

  afterEach(() => {
    setFlag(originalFlag);
  });

  it('allows registration when the flag is "true"', () => {
    setFlag('true');

    expect(guard.canActivate()).toBe(true);
  });

  it.each([[undefined], ['false'], ['TRUE'], ['1'], ['']])(
    'closes registration when the flag is %p',
    (flag) => {
      setFlag(flag);

      expect(() => guard.canActivate()).toThrow(ForbiddenException);
      expect(() => guard.canActivate()).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCodes.REGISTRATION_CLOSED,
          }),
        }),
      );
    },
  );
});
