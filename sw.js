/* Offline-Speicher für Kevins Life OS: App-Dateien liegen im Gerät, neue Versionen kommen automatisch. */
const V = 'los-v13';
const SHELL = ['./', 'index.html', 'app.js', 'sync.js', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(Promise.race([
      fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)) } return res }),
      new Promise((_, rej) => setTimeout(rej, 4000))
    ]).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r, { cache: 'no-cache' }).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res })));
  }
});
