import { z } from 'zod';

export const MIN_SECRET_LENGTH = 32;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const NODE_ENVS = ['development', 'production', 'test'] as const;
const PRODUCTION = 'production';
const FORBIDDEN_TRUST_PROXY = 'true';
const POSTGRES_PROTOCOL = /^postgres(ql)?$/;
const DIGITS = /^\d+$/;
const REQUIRED = 'is required';
const ALWAYS = () => true;

const emptyAsUnset = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const secret = emptyAsUnset(
  z
    .string({ error: REQUIRED })
    .min(MIN_SECRET_LENGTH, `must be at least ${MIN_SECRET_LENGTH} characters`),
);

const isPortInRange = (value: number) => value >= MIN_PORT && value <= MAX_PORT;

const port = z
  .string()
  .regex(DIGITS, 'must be an integer')
  .refine(
    (value) => !DIGITS.test(value) || isPortInRange(Number(value)),
    `must be between ${MIN_PORT} and ${MAX_PORT}`,
  );

const envSchema = z
  .looseObject({
    DATABASE_URL: emptyAsUnset(
      z.string({ error: REQUIRED }).pipe(
        z.url({
          protocol: POSTGRES_PROTOCOL,
          error: 'must be a postgres:// or postgresql:// URL',
        }),
      ),
    ),
    JWT_SECRET: secret,
    REFRESH_SECRET: secret,
    PORT: emptyAsUnset(port.optional()),
    NODE_ENV: emptyAsUnset(
      z
        .enum(NODE_ENVS, { error: `must be one of: ${NODE_ENVS.join(', ')}` })
        .optional(),
    ),
    REGISTRATION_ENABLED: emptyAsUnset(
      z
        .enum(['true', 'false'], { error: 'must be "true" or "false"' })
        .optional(),
    ),
    TRUST_PROXY: emptyAsUnset(
      z
        .string()
        .refine(
          (value) => value !== FORBIDDEN_TRUST_PROXY,
          'must not be "true": it trusts any client\'s X-Forwarded-For, so rate limits can be bypassed',
        )
        .optional(),
    ),
    FRONTEND_API_SECRET: emptyAsUnset(z.string().optional()),
  })
  .superRefine(
    (env, ctx) => {
      if (env.JWT_SECRET && env.JWT_SECRET === env.REFRESH_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['REFRESH_SECRET'],
          message: 'must differ from JWT_SECRET',
        });
      }
      if (env.NODE_ENV === PRODUCTION && !env.FRONTEND_API_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['FRONTEND_API_SECRET'],
          message: `is required when NODE_ENV is ${PRODUCTION}`,
        });
      }
    },
    { when: ALWAYS },
  );

const formatIssues = (issues: z.core.$ZodIssue[]) =>
  issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

export const validateEnv = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatIssues(result.error.issues)}`,
    );
  }
  return config;
};
