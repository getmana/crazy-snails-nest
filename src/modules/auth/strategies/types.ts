import { Role } from '@prisma/client';

export type UserStrategyPayload = {
  id: number;
  email: string;
  role: Role;
};
