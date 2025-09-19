import { createServer } from './app.js';
const port = Number(process.env.PORT || 3000);
createServer().listen(port, '0.0.0.0', () => {
  console.log('[server] listening on :', port);
});
