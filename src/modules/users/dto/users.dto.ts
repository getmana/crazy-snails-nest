import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  email: z.email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[\W_]/, 'Password must contain a special character'),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;

export type CreateUserDto = CreateUserPayload & {
  role: Role;
  isActive: boolean;
};

export type User = Omit<CreateUserDto, 'password'> & { id: number };

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username should be at least 3 characters long if provided')
    .or(z.literal(''))
    .optional(),
  email: z
    .email({ message: 'Invalid email address' })
    .or(z.literal(''))
    .optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
