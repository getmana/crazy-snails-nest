import { describe, expect, it } from '@jest/globals';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { toErrorResponse } from './error-response';
import { ErrorCodes } from 'src/constants';
import {
  ActiveUserNotFoundException,
  CountryCodesNotFoundException,
  FileWriteException,
  InfrastructureException,
  InvalidCredentialsException,
  NoteNotFoundException,
  StoryPhotoDuplicatedException,
  TokenGenerationFailedException,
  UserAlreadyExistsException,
  AlbumNotFoundException,
  StoryNotFoundException,
  EntityNotPublished,
  PhotoNotOwnedException,
  PreviewPhotoInvalidException,
  DomainException,
} from 'src/exceptions';

const INTERNAL = {
  statusCode: 500,
  code: ErrorCodes.INTERNAL_SERVER_ERROR,
  message: 'Internal server error',
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('db failure details', {
    code,
    clientVersion: 'test',
  });

const zodError = () => {
  const result = z
    .object({ email: z.email('Invalid email'), age: z.number('Age required') })
    .safeParse({ email: 'nope' });
  if (result.success) throw new Error('expected a validation failure');
  return result.error;
};

describe('toErrorResponse', () => {
  it('maps a Zod error to 400 VALIDATION_FAILED with joined messages', () => {
    expect(toErrorResponse(zodError())).toStrictEqual({
      statusCode: 400,
      code: ErrorCodes.VALIDATION_FAILED,
      message: 'Invalid email. Age required',
    });
  });

  it.each([
    [new AlbumNotFoundException('Album with id 1 not found'), 404],
    [new StoryNotFoundException('Story with id 1 not found'), 404],
    [new NoteNotFoundException('Note not found'), 404],
    [new ActiveUserNotFoundException('User with ID 1 not found'), 404],
    [
      new EntityNotPublished(
        'Album with id 1 not found',
        ErrorCodes.ALBUM_NOT_FOUND,
      ),
      404,
    ],
    [new PhotoNotOwnedException("Some photos don't belong to the user"), 403],
    [new PreviewPhotoInvalidException('Preview photo invalid'), 422],
    [new CountryCodesNotFoundException('Unknown country codes: XX'), 422],
    [
      new StoryPhotoDuplicatedException(
        'Photos with IDs 5 are used in more than one story section',
      ),
      422,
    ],
    [
      new UserAlreadyExistsException('A user with this email already exists'),
      409,
    ],
    [new InvalidCredentialsException('Invalid credentials'), 401],
  ])(
    'maps %p to its status with its own code and message',
    (exception, status) => {
      expect(toErrorResponse(exception)).toStrictEqual({
        statusCode: status,
        code: exception.code,
        message: exception.message,
      });
    },
  );

  it('maps an unregistered domain exception to a generic 500', () => {
    class UnmappedException extends DomainException {
      readonly code = 'UNMAPPED';
    }

    expect(
      toErrorResponse(new UnmappedException('secret detail')),
    ).toStrictEqual(INTERNAL);
  });

  it.each([
    [
      new FileWriteException('Failed to save file'),
      ErrorCodes.FILE_WRITE_TO_STORAGE_ERROR,
    ],
    [
      new TokenGenerationFailedException('Token generation failed'),
      ErrorCodes.TOKEN_GENERATION_FAILED,
    ],
  ])(
    'maps infrastructure failure %p to 500 with its code',
    (exception, code) => {
      expect(toErrorResponse(exception)).toStrictEqual({
        statusCode: 500,
        code,
        message: exception.message,
      });
    },
  );

  it('maps any infrastructure exception to 500 without registration', () => {
    class MailSendFailedException extends InfrastructureException {
      readonly code = 'MAIL_SEND_FAILED';
    }

    expect(
      toErrorResponse(new MailSendFailedException('Failed to send mail')),
    ).toStrictEqual({
      statusCode: 500,
      code: 'MAIL_SEND_FAILED',
      message: 'Failed to send mail',
    });
  });

  it.each([
    ['P2025', 404, ErrorCodes.RECORD_NOT_FOUND, 'Record not found'],
    [
      'P2002',
      409,
      ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION,
      'Unique constraint violation',
    ],
  ])('maps Prisma %s to %d', (prismaCode, status, code, message) => {
    expect(toErrorResponse(prismaError(prismaCode))).toStrictEqual({
      statusCode: status,
      code,
      message,
    });
  });

  it('hides the details of other Prisma errors behind a generic 500', () => {
    expect(toErrorResponse(prismaError('P2003'))).toStrictEqual(INTERNAL);
  });

  it('keeps the code an HTTP exception carries', () => {
    const exception = new ForbiddenException({
      message: 'Insufficient role permissions',
      code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
    });

    expect(toErrorResponse(exception)).toStrictEqual({
      statusCode: 403,
      code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
      message: 'Insufficient role permissions',
    });
  });

  it.each([
    [new UnauthorizedException(), 401, 'UNAUTHORIZED', 'Unauthorized'],
    [
      new NotFoundException('Cannot GET /nope'),
      404,
      'NOT_FOUND',
      'Cannot GET /nope',
    ],
    [
      new PayloadTooLargeException('File too large'),
      413,
      'PAYLOAD_TOO_LARGE',
      'File too large',
    ],
    [
      new HttpException('Plain text', HttpStatus.BAD_REQUEST),
      400,
      'BAD_REQUEST',
      'Plain text',
    ],
  ])(
    'derives the code from the status for %p',
    (exception, status, code, message) => {
      expect(toErrorResponse(exception)).toStrictEqual({
        statusCode: status,
        code,
        message,
      });
    },
  );

  it('joins an array of HTTP exception messages', () => {
    const exception = new HttpException(
      { message: ['first problem', 'second problem'] },
      HttpStatus.BAD_REQUEST,
    );

    expect(toErrorResponse(exception)).toStrictEqual({
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'first problem. second problem',
    });
  });

  it.each([
    [new Error('connection string with password')],
    ['a thrown string'],
    [undefined],
  ])('hides unexpected errors behind a generic 500 (%p)', (exception) => {
    expect(toErrorResponse(exception)).toStrictEqual(INTERNAL);
  });
});
