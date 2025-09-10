import { startServer } from './app/server.js';
import { createContainer } from './app/di.js';

const port = process.env.PORT || 3000;
const container = createContainer();

startServer({ port, container });
console.log(`HTTP server listening on :${port}`);
