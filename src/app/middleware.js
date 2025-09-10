import { dispatch } from './router.js';

export async function pipeline(req, res, container) {
  const start = Date.now();

  // JSON body parser
  req.body = await readJson(req);

  // Route dispatch
  await dispatch(req, res, container);

  // Basit loglama
  container.logger.info(`${req.method} ${req.url} ${Date.now() - start}ms`);
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE') return resolve(null);

    let buf = '';
    req.on('data', c => buf += c);
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
