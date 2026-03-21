const CACHE_NAME = 'africabased-v5';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/home',
  '/products',
  '/deposit',
  '/withdraw',
  '/My-products',
  '/referrals',
  '/statistics',
  '/profile',
  '/Services',
  '/exchange',
  '/offline',
  '/manifest.json',
  '/public/logo.png',
  '/js/token.js',
  '/js/auth.js',
  '/js/api-auth.js',
  '/js/register.js',
  '/js/ai-assistant.js',
  '/js/impersonation-guard.js',
  '/js/sessionUtils.js',
  '/js/biometric.js',
  '/css/ai-assistant.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  if (
    url.hostname !== self.location.hostname &&
    !url.hostname.includes('cdnjs.cloudflare.com') &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('fonts.gstatic.com')
  ) {
    return;
  }

  const isPage = request.mode === 'navigate' ||
    (request.destination === 'document') ||
    (url.pathname.endsWith('.html') || (!url.pathname.includes('.') && url.pathname !== '/manifest.json'));

  if (isPage) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  event.respondWith(cacheFirstWithNetwork(request));
});

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('You are offline. Please reconnect.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'You are offline. Cached data unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
