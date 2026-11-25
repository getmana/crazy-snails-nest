import { describe, expect, it, jest } from '@jest/globals';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  allowCrossOriginEmbedding,
  API_DOCS_SCRIPT_URL,
  apiDocsContentSecurityPolicy,
} from './security-headers.config';

const createResponse = () => {
  const headers = new Map<string, string>();
  const res = {
    setHeader: (name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
    },
  } as unknown as ServerResponse;
  return { res, headers };
};

const readScriptSources = (policy: string | undefined) =>
  policy
    ?.split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('script-src '))
    ?.split(' ')
    .slice(1);

describe('apiDocsContentSecurityPolicy', () => {
  it('allows the Scalar bundle and its inline start-up script', () => {
    const { res, headers } = createResponse();
    const next = jest.fn();

    apiDocsContentSecurityPolicy()({} as IncomingMessage, res, next);

    expect(next).toHaveBeenCalled();
    expect(
      readScriptSources(headers.get('content-security-policy')),
    ).toStrictEqual(["'self'", "'unsafe-inline'", API_DOCS_SCRIPT_URL]);
  });

  it("keeps helmet's other defaults", () => {
    const { res, headers } = createResponse();

    apiDocsContentSecurityPolicy()({} as IncomingMessage, res, jest.fn());

    expect(headers.get('content-security-policy')).toContain(
      "frame-ancestors 'self'",
    );
    expect(headers.get('content-security-policy')).toContain(
      "object-src 'none'",
    );
  });
});

describe('allowCrossOriginEmbedding', () => {
  it('lets other origins embed the file', () => {
    const { res, headers } = createResponse();

    allowCrossOriginEmbedding(res);

    expect(headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });
});
