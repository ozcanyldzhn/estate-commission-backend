import { dispatch } from './router.js';

const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'; // istersen Vercel domainini koy

export async function pipeline(req, res, container) {
  const start = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // JSON body parser
  req.body = await readJson(req);

  // Route dispatch
  await dispatch(req, res, container);

  // Basit loglama
  container.logger.info(`${req.method} ${req.url} ${Date.now() - start}ms`);
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'OPTIONS')
      return resolve(null);

    let buf = '';
    req.on('data', (c) => (buf += c));
    req.on('end', () => {
      if (!buf) return resolve(null);
      try {
        resolve(JSON.parse(buf));
      } catch {
        resolve(null);
      }
    });
  });
}
