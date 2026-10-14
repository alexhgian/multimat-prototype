// Offline cache for the scoring table and the mat scoreboard: if the tablet reloads with no connection,
// the page still opens from cache. Pages are fetched fresh when online (network first), cached for later.
const CACHE = 'ww-scoring-v1';
const PAGES = ['score.html', 'display.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PAGES.map(p => c.add(new Request(p, { cache: 'reload' })).catch(() => {})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const save = res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; };
  if (u.origin === location.origin && r.mode === 'navigate') {
    e.respondWith(fetch(r).then(save).catch(() => caches.match(r, { ignoreSearch: true })));
  } else if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(save)));
  }
});
