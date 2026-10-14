import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export const createHttpContext = (request: object) =>
  new ExecutionContextHost([request]);
