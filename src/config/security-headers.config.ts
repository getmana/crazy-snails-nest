import type { ServerResponse } from 'http';
import { contentSecurityPolicy } from 'helmet';

export const API_DOCS_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/@scalar/api-reference';

export const apiDocsContentSecurityPolicy = () =>
  contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", API_DOCS_SCRIPT_URL],
    },
  });

export const allowCrossOriginEmbedding = (res: ServerResponse) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
};
