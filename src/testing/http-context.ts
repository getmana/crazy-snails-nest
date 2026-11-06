import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export const createHttpContext = (request: object, response?: object) =>
  new ExecutionContextHost([request, response]);
