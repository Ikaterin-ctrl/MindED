/* MindED service worker. Change VERSION on every release that edits this list. */
const VERSION = 'minded-v3';

const SHELL = [
  'index.html',
  'workspace.html',
  'preferencias.html',
  'login.html',
  'termos.html',
  'privacidade.html',
  'src/css/base.css',
  'src/js/demo-data.js',
  'src/js/pwa.js',
  'src/js/account.js',
  'src/js/theme.js',
  'img/favicon.svg',
  'img/icon-192.png',
  'manifest.webmanifest',
];

// Versioned files the pages need to open without a connection.
const CACHED_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(VERSION);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(networkFirst(request));
  } else if (CACHED_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else, including the API and sign-in, goes straight to the network.
});
