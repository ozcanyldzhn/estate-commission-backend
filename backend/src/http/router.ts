//handler'A verilen istek bağlamıdır Gİrdi kısacası
export type HandlerCtx = {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
};
//handler'ın döndüğü yanıt çıktı kısacası
export type HandlerResult = { status: number; body: any };
export type Handler = (ctx: HandlerCtx) => Promise<HandlerResult> | HandlerResult;

type Route = {
  path: string;
  handlers: Record<string, Handler>; // method -> handler
  paramNames: string[];
  regex: RegExp;
};
// parametleri regex grubuna çevirir ve paramNames'e ekler
function pathToRegex(path: string) {
  const paramNames: string[] = [];
  const regex = new RegExp('^' + path.replace(/\/$/, '').replace(/:[^/]+/g, (m) => {
    paramNames.push(m.slice(1));
    return '([^/]+)';
  }) + '/?$');
  return { regex, paramNames };
}

export type RouterApi = {
  get: (p: string, h: Handler) => void;
  post: (p: string, h: Handler) => void;
  put: (p: string, h: Handler) => void;
  patch: (p: string, h: Handler) => void;
  delete: (p: string, h: Handler) => void;
  use: (mountPath: string, child: RouterApi) => void;
  match: (method: string, path: string) => { handlers: Record<string, Handler>; params: Record<string, string> } | null;
  _routes: Route[];
};

export function createRouter(base = ''): RouterApi {
  const routes: Route[] = [];

  function add(method: string, path: string, handler: Handler) {
    const fullPath = (base + path).replace(/\/$/, '') || '/';
    const existing = routes.find(r => r.path === fullPath);
    if (existing) {
      existing.handlers[method] = handler;
    } else {
      const { regex, paramNames } = pathToRegex(fullPath);
      routes.push({ path: fullPath, handlers: { [method]: handler }, paramNames, regex });
    }
  }

  const api: RouterApi = {
    get:    (p: string, h: Handler) => add('GET', p, h),
    post:   (p: string, h: Handler) => add('POST', p, h),
    put:    (p: string, h: Handler) => add('PUT', p, h),
    patch:  (p: string, h: Handler) => add('PATCH', p, h),
    delete: (p: string, h: Handler) => add('DELETE', p, h),
    // child routerdaki dönen tüm rotaları mountpath altına
    use: (mountPath: string, child: RouterApi) => {
      // child’ın internal routes’ına erişmek için any hack:
      const childRoutes = (child as any)._routes as Route[];
      for (const r of childRoutes) {
        const childPath = r.path.replace(/^\//, '');
        const combined = (mountPath.replace(/\/$/, '') + '/' + childPath).replace(/\/$/, '');
        for (const [m, h] of Object.entries(r.handlers)) add(m, '/' + combined.replace(/^\//, ''), h);
      }
    },
    //istek path'ini regex ile deneriyakalarsa params ve metot->handler tablosunu döner
    match: (method: string, path: string): { handlers: Record<string, Handler>; params: Record<string, string> } | null => {
      for (const r of routes) {
        const m = r.regex.exec(path.replace(/\/$/, ''));
        if (m) {
          const params: Record<string, string> = {};
          r.paramNames.forEach((name, i) => (params[name] = m[i + 1]));
          return { handlers: r.handlers, params };
        }
      }
      return null;
    },

    _routes: routes,
  } as const;

  return api;
}
