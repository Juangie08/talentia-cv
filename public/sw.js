/* Talentia — service worker mínimo para uso offline.
 *
 * Filosofía acorde al plan gratuito: todo vive en el navegador del usuario.
 * Solo se cachean assets estáticos (JS/CSS compilados, imágenes, fuentes) y
 * siempre gana la red: un despliegue nuevo nunca deja código viejo atrapado en
 * el dispositivo; la caché queda solo como respaldo cuando no hay conexión.
 */

const STATIC_CACHE = 'talentia-static-v2';
const STATIC_PREFIXES = ['/_next/static/', '/img/', '/fonts/'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const isStatic = STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (!isStatic) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const hit = await cache.match(request);
        if (hit) return hit;
        throw new Error('Sin conexión y sin copia en caché');
      }
    }),
  );
});
