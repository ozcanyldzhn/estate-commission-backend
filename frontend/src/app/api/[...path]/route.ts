import { NextRequest } from "next/server";

export const runtime = 'nodejs';
// Sadece BACKEND_URL kullan
const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; return proxy(req, path.join("/"));
}
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; return proxy(req, path.join("/"));
}
export async function PUT(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; return proxy(req, path.join("/"));
}
export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; return proxy(req, path.join("/"));
}
export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; return proxy(req, path.join("/"));
}

async function proxy(req: Request, path: string) {
  if (!BACKEND_URL) return new Response("BACKEND_URL not configured", { status: 500 });

  const url = new URL(req.url);
  const search = url.search;
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await (req as any).blob();
  const headers = rewriteHeaders(req.headers as Headers);

  const base = BACKEND_URL.replace(/\/$/, "");

  // Try path as given (for health, healt, root children)
  let finalUrl = `${base}/${path}${search}`;
  let res = await fetch(finalUrl, { method: req.method, headers, body, cache: 'no-store' });
  if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 501)) {
    // Fallback to /api prefix for backend API routes
    finalUrl = `${base}/api/${path}${search}`;
    const res2 = await fetch(finalUrl, { method: req.method, headers, body, cache: 'no-store' });
    if (res2.ok) res = res2;
  }

  const out = new Headers(res.headers);
  out.delete('content-encoding'); out.delete('transfer-encoding'); out.delete('connection');
  out.set('x-upstream-url', finalUrl);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}

function rewriteHeaders(incoming: Headers) {
  const out = new Headers(incoming);
  out.set('x-forwarded-host', incoming.get('host') ?? '');
  out.set('x-forwarded-proto', 'https');
  return out;
}


