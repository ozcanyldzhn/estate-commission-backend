import 'dotenv/config';
import './container.js';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { router } from './routes/index.js';
import { sendJson, parseJsonBody, notFound, methodNotAllowed } from './http/http-helpers.js';

export function createServer() {
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') return res.writeHead(204).end();

      const { pathname, query } = parseUrl(req.url ?? '/', true);
      if (!pathname) return notFound(res);

      if (req.method === 'GET' && pathname === '/health') {
        return sendJson(res, 200, { success: true, data: { status: 'ok' } });
      }
      if (req.method === 'GET' && pathname === '/healt') {
        return sendJson(res, 200, { success: true, data: { status: 'ok' } });
      }
      if (req.method === 'GET' && pathname === '/') {
        return sendJson(res, 200, { success: true, data: { name: 'estate-commission-backend', status: 'ok' } });
      }
      //context routing ve yanıt yönlendirme
      const ctx = {
        method: req.method ?? 'GET',
        path: pathname,
        query: (query ?? {}) as Record<string, unknown>,
        headers: req.headers,
        body: await parseJsonBody(req),
      } as const;

      const match = router.match(ctx.method, ctx.path);
      if (!match) return notFound(res);
      if (!match.handlers[ctx.method]) return methodNotAllowed(res);

      const result = await match.handlers[ctx.method]({ ...ctx, params: match.params });
      return sendJson(res, result.status, result.body);
    } catch (e) {
      console.error('[unhandled]', e);
      return sendJson(res, 500, { success: false, error: { code: 'INTERNAL', message: 'Unexpected error' } });
    }
  });
  return server;
}


