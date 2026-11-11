import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ErrorCodes } from 'src/constants';
import { AlbumNotFoundException } from 'src/exceptions';
import { createHttpContext } from 'src/testing/http-context';

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the mapped body with a matching HTTP status', () => {
    const response = createResponse();

    filter.catch(
      new AlbumNotFoundException('Album with id 1 not found'),
      createHttpContext({}, response),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      code: ErrorCodes.ALBUM_NOT_FOUND,
      message: 'Album with id 1 not found',
    });
  });

  it('logs unexpected errors', () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(new Error('boom'), createHttpContext({}, createResponse()));

    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('does not log expected domain errors', () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(
      new AlbumNotFoundException('Album with id 1 not found'),
      createHttpContext({}, createResponse()),
    );

    expect(logError).not.toHaveBeenCalled();
  });
});
