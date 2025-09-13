import http from 'node:http';
import { pipeline } from './middleware.js';
import { registerTransactionRoutes } from '../api/transactions.controller.js';
import { addRoute } from './router.js';

export function startServer({ port, container }) {
  // Route kayıtlarını burada yapıyoruz
  registerTransactionRoutes({ addRoute, container });

  const server = http.createServer(async (req, res) => {
    try {
      await pipeline(req, res, container);
    } catch (e) {
      const code = e.statusCode || 500;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message || 'Internal Error' }));
    }
  });

  server.listen(port);
  return server;
}
