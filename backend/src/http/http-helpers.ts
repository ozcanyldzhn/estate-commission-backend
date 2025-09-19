import type { IncomingMessage, ServerResponse } from 'node:http';

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve(undefined);
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export function sendJson(res: ServerResponse, status: number, body: any) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

export const ok       = (body: any) => ({ status: 200, body });
export const created  = (body: any) => ({ status: 201, body });
export const badRequest = (body: any) => ({ status: 400, body });

export function notFound(res: ServerResponse) {
  return sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function methodNotAllowed(res: ServerResponse) {
  return sendJson(res, 405, { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
}
