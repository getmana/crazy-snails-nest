import { Role } from 'src/generated/prisma/client';

export type UserStrategyPayload = {
  id: number;
  email: string;
  role: Role;
};
