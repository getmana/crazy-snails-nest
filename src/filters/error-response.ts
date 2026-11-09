import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ErrorCodes } from 'src/constants/error-codes';
import {
  ActiveUserNotFoundException,
  CountryCodesNotFoundException,
  FileWriteException,
  InvalidCredentialsException,
  NoteNotFoundException,
  StoryPhotoDuplicatedException,
  TokenGenerationFailedException,
  UserAlreadyExistsException,
} from 'src/exceptions';
import { AlbumNotFoundException } from 'src/exceptions/album-not-found.exception';
import { DomainException } from 'src/exceptions/domain.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { PhotoNotOwnedException } from 'src/exceptions/photo-not-owned.exception';
import { PreviewPhotoInvalidException } from 'src/exceptions/preview-photo-invalid.exception';
import { StoryNotFoundException } from 'src/exceptions/story-not-found.exception';

export type ErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
};

const MESSAGE_SEPARATOR = '. ';

export const INTERNAL_ERROR_RESPONSE: ErrorResponse = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: ErrorCodes.INTERNAL_SERVER_ERROR,
  message: 'Internal server error',
};

type DomainExceptionClass = abstract new (...args: never[]) => DomainException;

const DOMAIN_EXCEPTION_STATUS: [DomainExceptionClass, HttpStatus][] = [
  [AlbumNotFoundException, HttpStatus.NOT_FOUND],
  [StoryNotFoundException, HttpStatus.NOT_FOUND],
  [NoteNotFoundException, HttpStatus.NOT_FOUND],
  [ActiveUserNotFoundException, HttpStatus.NOT_FOUND],
  [EntityNotPublished, HttpStatus.NOT_FOUND],
  [PhotoNotOwnedException, HttpStatus.FORBIDDEN],
  [PreviewPhotoInvalidException, HttpStatus.UNPROCESSABLE_ENTITY],
  [StoryPhotoDuplicatedException, HttpStatus.UNPROCESSABLE_ENTITY],
  [CountryCodesNotFoundException, HttpStatus.UNPROCESSABLE_ENTITY],
  [UserAlreadyExistsException, HttpStatus.CONFLICT],
  [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
  [TokenGenerationFailedException, HttpStatus.INTERNAL_SERVER_ERROR],
];

const PRISMA_ERROR_RESPONSES: Record<string, ErrorResponse> = {
  P2025: {
    statusCode: HttpStatus.NOT_FOUND,
    code: ErrorCodes.RECORD_NOT_FOUND,
    message: 'Record not found',
  },
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    code: ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION,
    message: 'Unique constraint violation',
  },
};

const joinMessages = (message: unknown, fallback: string): string => {
  if (Array.isArray(message))
    return message.map(String).join(MESSAGE_SEPARATOR);
  return typeof message === 'string' ? message : fallback;
};

const fromDomainException = (exception: DomainException): ErrorResponse => {
  const match = DOMAIN_EXCEPTION_STATUS.find(
    ([ExceptionClass]) => exception instanceof ExceptionClass,
  );
  if (!match) return INTERNAL_ERROR_RESPONSE;

  return {
    statusCode: match[1],
    code: exception.code,
    message: exception.message,
  };
};

const fromHttpException = (exception: HttpException): ErrorResponse => {
  const statusCode = exception.getStatus();
  const fallbackCode =
    HttpStatus[statusCode] ?? ErrorCodes.INTERNAL_SERVER_ERROR;
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { statusCode, code: fallbackCode, message: response };
  }

  const { message, code } = response as { message?: unknown; code?: unknown };
  return {
    statusCode,
    code: typeof code === 'string' ? code : fallbackCode,
    message: joinMessages(message, exception.message),
  };
};

export const toErrorResponse = (exception: unknown): ErrorResponse => {
  if (exception instanceof ZodError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCodes.VALIDATION_FAILED,
      message: joinMessages(
        exception.issues.map(({ message }) => message),
        exception.message,
      ),
    };
  }

  if (exception instanceof DomainException) {
    return fromDomainException(exception);
  }

  if (exception instanceof FileWriteException) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: FileWriteException.code,
      message: exception.message,
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_ERROR_RESPONSES[exception.code] ?? INTERNAL_ERROR_RESPONSE;
  }

  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }

  return INTERNAL_ERROR_RESPONSE;
};
