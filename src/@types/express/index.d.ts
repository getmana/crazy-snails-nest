import { UserStrategyPayload } from 'src/modules/auth/strategies';

declare module 'express' {
  interface Request {
    user?: UserStrategyPayload;
  }
}
