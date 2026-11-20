/* Gestión de contingencias · navegación común (19/11/2026)
 * Un solo hospital elegido para todas las pestañas (se guarda en el navegador)
 * y la misma barra de pestañas en contingencias.html, plan.html y evac.html:
 *   1 · Planes  ·  2 · Datos del hospital  ·  3 · Planillas para imprimir  ·  4 · Derivación y albergues (otro módulo)
 * La red de las fichas EVAC se deduce del hospital: HMH y HZT → Red Trelew; HSST → Red Rawson.
 */
(function (global) {
  'use strict';
  const HOSP = [
    { c: 'HMH', n: 'Hospital María Humphreys', red: 'Red Trelew' },
    { c: 'HZT', n: 'Hospital Zonal Trelew «Dr. Adolfo Margara»', red: 'Red Trelew' },
    { c: 'HSST', n: 'Hospital Subzonal Santa Teresita (Rawson)', red: 'Red Rawson' }
  ];
  const CLAVE = 'starh.gc.hosp';
  function leer() { try { const v = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (HOSP.some(h => h.c === v)) return v; } catch (e) {} return 'HMH'; }
  function guardar(c) { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch (e) {} }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const TABS = [
    ['planes', 'contingencias.html#/', 'assignment', '1 · Planes'],
    ['datos', 'contingencias.html#/datos', 'domain', '2 · Datos del hospital'],
    ['imprimir', 'evac.html#/modelos', 'print', '3 · Planillas para imprimir'],
    ['deriv', 'derivaciones.html', 'night_shelter', '4 · Derivación y albergues ↗']
  ];
  const CSS = `.gc-nav{display:grid;gap:8px;margin:0 0 12px}
.gc-hosp{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gc-hosp label{font-size:12.5px;font-weight:800;color:#8E1B1B}
.gc-hosp select{border:1px solid #E9C9C6;border-radius:10px;padding:8px 10px;background:#fff;min-height:42px;font-weight:700;font-size:14.5px;max-width:100%}
.gc-hosp small{color:#4B5B73;font-size:12px}
.gc-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.gc-tab{border:1px solid #F3DADA;background:#fff;border-radius:12px;padding:9px 13px;font-weight:700;font-size:13.5px;white-space:nowrap;display:inline-flex;gap:6px;align-items:center;color:#8E1B1B;text-decoration:none}
.gc-tab[aria-current="page"]{background:#8E1B1B;color:#fff;border-color:#8E1B1B}
.gc-tab.otro{border-style:dashed}`;
  function estilo() { if (document.getElementById('gc-css')) return; const s = document.createElement('style'); s.id = 'gc-css'; s.textContent = CSS; document.head.appendChild(s); }
  /* act: 'planes' | 'datos' | 'imprimir'. conHospital: false oculta el selector (planillas para imprimir son comunes). */
  function barra(act, conHospital) {
    estilo();
    const h = leer();
    return `<nav class="gc-nav" aria-label="Gestión de contingencias">
      ${conHospital === false ? '' : `<div class="gc-hosp"><label for="gcHosp">Hospital</label><select id="gcHosp">${HOSP.map(x => `<option value="${x.c}" ${x.c === h ? 'selected' : ''}>${x.c} · ${esc(x.n)}</option>`).join('')}</select><small>Vale para todas las pestañas. Cada hospital incluye sus dependencias.</small></div>`}
      <div class="gc-tabs">${TABS.map(t => `<a class="gc-tab${t[0] === 'deriv' ? ' otro' : ''}" href="${t[1]}" ${t[0] === act ? 'aria-current="page"' : ''}${t[0] === 'deriv' ? ' title="Módulo del COEsp: toda la red, por localidad"' : ''}><span class="ms" style="font-size:18px">${t[2]}</span>${t[3]}</a>`).join('')}</div></nav>`;
  }
  /* Llamar después de pintar la barra. Al cambiar de hospital, guarda y avisa. */
  function enlazar(alCambiar) {
    const s = document.getElementById('gcHosp'); if (!s) return;
    s.addEventListener('change', () => { guardar(s.value); if (alCambiar) alCambiar(s.value); });
  }
  global.GC = { HOSP: HOSP, hosp: leer, setHosp: guardar, info: c => HOSP.find(h => h.c === (c || leer())), barra: barra, enlazar: enlazar,
    REGLA: '<div class="regla"><b>REGLA DE EDICIÓN:</b> los datos y los textos se cargan y se corrigen en la app, nunca en el Doc generado; lo que se corrige en el Doc no vuelve a la app. El texto común va en TEXTOS de «PLAN · Texto común» y vale para todos; lo propio de un hospital va en sus datos o en Textos propios. El Doc se toca a mano solo en la revisión final.</div>' };
})(window);
