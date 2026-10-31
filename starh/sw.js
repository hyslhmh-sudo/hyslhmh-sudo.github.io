/* STAR-H · trabajo sin señal: guarda la app en el dispositivo.
 * Al publicar una versión nueva, cambiar el número de VERSION para que todos la reciban. */
const VERSION = 'starh-v0.25';
const ARCHIVOS = ['./', 'index.html', 'starh.html', 'coe.html', 'fuentes.html', 'evac.html', 'tablero.html', 'phr.html', 'phr-tablero.html', 'imprimir.html', 'ish.html', 'ish-tablero.html', 'guias.js', 'starh.js', 'config.js', 'demo-amenazas.js',
  'logo-hysl.png', 'enc-trelew.png', 'enc-secretaria.png', 'enc-hsst.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // las cargas (POST) van siempre al servidor
  const url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {   // tipografías e íconos: primero lo guardado
    e.respondWith(caches.open(VERSION + '-fuentes').then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin === location.origin) {                   // la app: primero la red (para tener lo último), si no hay señal, lo guardado
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  }
});
