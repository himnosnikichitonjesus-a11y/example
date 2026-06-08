// sw.js - Balta Media PWA
// Estrategias:
// - Navegaciones (páginas): network first + offline fallback
// - episodios.js: network only (siempre desde servidor)
// - Demás assets estáticos: cache first (stale-while-revalidate)
// - Soporte para actualización con botón

const CACHE_NAME = 'pod-nchj-v0';  // Incrementar al actualizar assets estáticos
const OFFLINE_URL = '/offline.html';

// Recursos estáticos a precachear (se instalan al principio)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/show.js',
  '/episodios.js',
  '/player.js',
  '/buscar.js',
  '/biblioteca.js',
  '/explorar.js',
  '/404.js',
  ./manifest.json,
  '/styles.css',
  OFFLINE_URL,
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap'
  // NO incluir https://media.baltaanay.org/lib/episodios.js porque es dinámico
];

// INSTALACIÓN
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: intercepción de peticiones
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // ---- 1. episodios.js: SIEMPRE DESDE LA RED (sin caché) ----
  if (url.href === 'https://media.baltaanay.org/lib/episodios.js') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(error => {
          console.error('[SW] Error al obtener episodios.js:', error);
          // Respuesta de fallback para evitar que la app se rompa
          return new Response(
            JSON.stringify({ error: 'Sin conexión', episodios: [] }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // ---- 2. Navegaciones (páginas HTML): network first + offline.html ----
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Guardar en caché para futuras visitas offline (opcional)
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedOffline = await caches.match(OFFLINE_URL);
          if (cachedOffline) return cachedOffline;
          return new Response('No hay conexión a internet', { status: 503 });
        })
    );
    return;
  }

  // ---- 3. Otros recursos estáticos (CSS, JS propio, imágenes, fuentes): cache first ----
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Actualizar en segundo plano (stale-while-revalidate)
          fetch(request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        }).catch(error => {
          console.error('[SW] Error en fetch de asset:', request.url, error);
          if (request.destination === 'image') {
            return new Response('', { status: 404 });
          }
          throw error;
        });
      })
  );
});

// ---- MENSAJES DESDE LA PÁGINA (para forzar actualización) ----
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
