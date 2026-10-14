import { jest } from '@jest/globals';

export type AsyncFn = (...args: unknown[]) => Promise<unknown>;

export const asyncMock = () => jest.fn<AsyncFn>();
