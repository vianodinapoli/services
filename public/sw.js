// Service worker do SGL - Descargas.
// - Os dados das descargas têm de ser sempre os mais recentes: as páginas vão sempre à rede primeiro.
//   A cópia guardada só é usada se a rede falhar ou o servidor responder com erro (ex.: Laravel em baixo).
// - Nunca toca em /api/. Os lançamentos pendentes vivem em IndexedDB (lib/offline.ts).
// - O handler de fetch também é exigido pelo Chrome para oferecer a instalação.
const V = 'fem-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.tipo === 'cachear') event.waitUntil(cachear(d.urls || []));
  if (d.tipo === 'limpar') event.waitUntil(caches.delete(V)); // chamar ao terminar sessão
});

async function cachear(urls) {
  const c = await caches.open(V);
  for (const u of urls) {
    try {
      const r = await fetch(u, { credentials: 'same-origin' });
      if (r.ok && !r.redirected) await c.put(u, r);
    } catch { /* sem rede */ }
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Ficheiros com hash no nome (nunca mudam): cache primeiro
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.open(V).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    }));
    return;
  }

  // Páginas: rede primeiro; se falhar ou o servidor responder erro, usa a última cópia
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) {
          if (!r.redirected) { const c = await caches.open(V); c.put(req, r.clone()); }
          return r;
        }
        return (await caches.match(req)) || r;
      } catch {
        return (await caches.match(req)) || new Response(
          'Sem ligação e esta página ainda não foi guardada. Abra-a uma vez com rede.',
          { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
        );
      }
    })());
  }
});