const routes = [];

export function addRoute(method, path, handler) {
  routes.push({ method, path, handler });
}

function match(method, path) {
  return routes.find(r => r.method === method && r.path === path);
}

export async function dispatch(req, res, container) {
  const url = new URL(req.url, 'http://localhost');
  const r = match(req.method, url.pathname);
  if (!r) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }
  await r.handler(req, res, container);
}
