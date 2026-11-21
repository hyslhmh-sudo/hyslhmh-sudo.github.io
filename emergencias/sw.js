/* Emergencias HySL (migrada desde /starh) · trabajo sin señal: guarda la app en el dispositivo.
 * Al publicar una versión nueva, cambiar el número de VERSION para que todos la reciban. */
const VERSION = 'emergencias-v2.39';
const ARCHIVOS = ['./', 'index.html', 'starh.html', 'coe.html', 'control.html', 'fuentes.html', 'ficha.html', 'establecimientos.html', 'anexos.html', 'transportes.html', 'roles-llamada.html', 'cartografia.html', 'vulnerabilidad.html', 'notas.html', 'red.html', 'evac.html', 'derivaciones.html', 'plan.html', 'contingencias.html', 'gc-nav.js', 'tablero.html', 'phr.html', 'phr-tablero.html', 'imprimir.html', 'ish.html', 'ish-tablero.html', 'guias.js', 'starh.js', 'modelos-comun.js', 'config.js',
  'logo-hysl.png', 'banda-sst.jpg', 'enc-trelew.png', 'enc-secretaria.png', 'enc-hsst.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== VERSION + '-fuentes').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 15/11/2026 · Revisión de lentitud y errores:
// - Solo se guardan respuestas correctas (antes se guardaban también los errores, p. ej. un 404, y quedaban como «la app sin señal»).
// - Páginas y código: primero la red, pero si la red no contesta en 4 segundos (señal débil) se abre lo guardado y la red sigue
//   actualizando la copia por detrás. Antes, con señal débil, la pantalla quedaba en blanco hasta que la red fallaba del todo.
// - Imágenes e íconos: primero lo guardado (no cambian entre versiones) y se actualizan por detrás.
const ESPERA_RED = 4000;
function guardar(req, res) { if (res && res.ok && res.type !== 'opaque') { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return res; }
function guardado(req) { return caches.match(req, { ignoreSearch: true }); }
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // las cargas (POST) van siempre al servidor
  const url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {   // tipografías e íconos: primero lo guardado
    e.respondWith(caches.open(VERSION + '-fuentes').then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (/\.(png|jpe?g|svg|ico|webp)$/i.test(url.pathname)) {   // imágenes: primero lo guardado
    const red = fetch(req).then(res => guardar(req, res));
    e.respondWith(guardado(req).then(r => r || red));
    e.waitUntil(red.catch(() => {}));
    return;
  }
  // la app: primero la red (para tener lo último); si tarda más de 4 s o no hay señal, lo guardado
  const red = fetch(req, { cache: 'no-cache' }).then(res => guardar(req, res));
  e.waitUntil(red.catch(() => {}));
  e.respondWith(new Promise(resolve => {
    let listo = false;
    const usarGuardado = () => guardado(req).then(r => { if (r && !listo) { listo = true; resolve(r); } return r; });
    const t = setTimeout(usarGuardado, ESPERA_RED);
    red.then(res => { clearTimeout(t); if (!listo) { listo = true; resolve(res); } })
      .catch(() => { clearTimeout(t); usarGuardado().then(r => { if (!listo) { listo = true; resolve(r || caches.match('index.html').then(x => x || Response.error())); } }); });
  }));
});
