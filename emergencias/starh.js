/* STAR-H · funciones comunes de la app y del tablero (versión 0)
 * - Conexión con el Apps Script (o modo demostración si no hay dirección configurada)
 * - Sesión, almacenamiento local seguro y cálculo del riesgo (igual que la planilla)
 */
(function (global) {
  'use strict';

  const PREF = 'starh.';
  const qs = new URLSearchParams(location.search);
  const API = (global.STARH_API || '').trim();
  const DEMO = qs.get('demo') === '1' || !/^https:\/\/script\.google\.com\//.test(API);

  /* ---------- almacenamiento local (nunca rompe la app si el navegador lo bloquea) ---------- */
  const mem = {};
  const store = {
    get(k, def) {
      try { const v = localStorage.getItem(PREF + k); return v == null ? def : JSON.parse(v); }
      catch (e) { return k in mem ? mem[k] : def; }
    },
    set(k, v) {
      mem[k] = v;
      try { localStorage.setItem(PREF + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    del(k) { delete mem[k]; try { localStorage.removeItem(PREF + k); } catch (e) {} }
  };

  /* ---------- llamada al servidor ---------- */
  async function api(accion, datos, ms) {
    const cuerpo = Object.assign({ accion: accion, token: store.get(DEMO ? 'demo.token' : 'token', '') }, datos || {});
    if (DEMO) return Demo.atender(cuerpo);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 45000);
    try {
      const r = await fetch(API, {
        method: 'POST', body: JSON.stringify(cuerpo), redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl.signal
      });
      if (!r.ok) throw new Error('El servidor respondió ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  /* ---------- sesión ---------- */
  /* 08/11/2026 · Revisión de seguridad: las copias guardadas en el navegador (catálogos del COEsp, red, derivaciones,
   * evacuación, plan, tableros) son de quien ingresó. Al salir se borran; al ingresar otra persona en el mismo
   * equipo se borra todo, incluidos los cambios pendientes de envío y «Mis datos» de la anterior.
   * Al salir quedan solo los cambios pendientes (colas) de esa misma persona, por si vuelve a ingresar. */
  const QUEDA_AL_SALIR = /^(token|usuario|dueno)$|(^|\.)cola$|^datos(Pend|Ok)\./;
  function limpiarCopias(todo) {
    const borrar = k => !/^demo\./.test(k) && (todo ? !/^(token|usuario)$/.test(k) : !QUEDA_AL_SALIR.test(k));
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.indexOf(PREF) === 0 && borrar(k.slice(PREF.length))) localStorage.removeItem(k);
      }
    } catch (e) {}
    Object.keys(mem).forEach(k => { if (borrar(k)) delete mem[k]; });
  }
  const idUsuario = u => u ? String(u.persona || u.nombre || '').trim() : '';
  const sesion = {
    token() { return store.get(DEMO ? 'demo.token' : 'token', ''); },
    usuario() { return store.get(DEMO ? 'demo.usuario' : 'usuario', null); },
    guardar(token, usuario) {
      if (!DEMO) { const id = idUsuario(usuario); if (store.get('dueno', '') !== id) limpiarCopias(true); store.set('dueno', id); }
      store.set(DEMO ? 'demo.token' : 'token', token); store.set(DEMO ? 'demo.usuario' : 'usuario', usuario);
    },
    cerrar() { store.del(DEMO ? 'demo.token' : 'token'); store.del(DEMO ? 'demo.usuario' : 'usuario'); if (!DEMO) limpiarCopias(false); }
  };
  // Sin sesión abierta no queda ninguna copia de datos: se borra antes de que la página las lea.
  if (!DEMO && !sesion.token()) limpiarCopias(false);
  // Quien ya tenía la sesión abierta antes de este cambio queda como dueño de sus copias (no pierde cambios pendientes).
  else if (!DEMO && !store.get('dueno', '')) store.set('dueno', idUsuario(sesion.usuario()));

  /* ---------- cálculo STAR-H (mismas fórmulas que la hoja EVALUACIÓN) ---------- */
  function valorDe(lista, etiqueta) {
    const x = (lista || []).find(o => o.etiqueta === etiqueta);
    return x ? Number(x.valor) : null;
  }
  function redondear(n, d) { const f = Math.pow(10, d || 0); return Math.sign(n) * Math.round(Math.abs(n) * f) / f; }
  /* Cálculo de la planilla oficial OPS STAR-H v1.25 (05/11/2026):
   *  gravedad = 0,4·B1 + 0,3·B2 + 0,3·B3 · impacto = (gravedad + C + D) / 3 sin redondear · riesgo = A × impacto
   *  nivel: riesgo por encima de 0, 4, 7, 12 o 17 (el valor justo en el límite queda en el nivel de abajo) */
  function num(v) {
    if (v === '' || v == null) return '';
    if (typeof v === 'number') return v;
    let s = String(v).trim(); if (!s) return '';
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s); return isNaN(n) ? '' : n;
  }
  function fmt(v, d) {
    const n = num(v); if (n === '') return '';
    return n.toFixed(d == null ? 2 : d).replace('.', ',');
  }
  function calcular(esc, ev) {
    const vacio = { grav: '', imp: '', riesgo: '', nivel: '' };
    if (!esc || !ev || ev.aplica === 'No aplica') return vacio;
    const b1 = valorDe(esc.B, ev.B1), b2 = valorDe(esc.B, ev.B2), b3 = valorDe(esc.B, ev.B3);
    if (b1 == null || b2 == null || b3 == null) return vacio;
    const p = esc.pesos && esc.pesos.length === 3 && esc.pesos.every(x => typeof x === 'number' && !isNaN(x)) ? esc.pesos : [0.4, 0.3, 0.3];
    const grav = b1 * p[0] + b2 * p[1] + b3 * p[2];
    const c = valorDe(esc.C, ev.C), d = valorDe(esc.D, ev.D);
    if (c == null || d == null) return Object.assign({}, vacio, { grav: redondear(grav, 2) });
    const imp = (grav + c + d) / 3;
    const a = valorDe(esc.A, ev.A);
    if (a == null) return Object.assign({}, vacio, { grav: redondear(grav, 2), imp: redondear(imp, 2) });
    const riesgo = a * imp;
    return { grav: redondear(grav, 2), imp: redondear(imp, 2), riesgo: redondear(riesgo, 2), nivel: nivelDe(esc, riesgo) };
  }
  function nivelDe(esc, riesgo) {
    const r = num(riesgo); if (r === '') return '';
    const v = redondear(r, 9);
    const nv = (esc && esc.niveles && esc.niveles.length ? esc.niveles : NIVELES_OPS).slice().sort((x, y) => x.desde - y.desde);
    let n = '';
    nv.forEach(x => { if (v > Number(x.desde)) n = x.nivel; });
    return n;
  }
  const NIVELES_OPS = [{ desde: 0, nivel: 'Muy bajo', rango: 'más de 0 hasta 4' }, { desde: 4, nivel: 'Bajo', rango: 'más de 4 hasta 7' }, { desde: 7, nivel: 'Moderado', rango: 'más de 7 hasta 12' }, { desde: 12, nivel: 'Alto', rango: 'más de 12 hasta 17' }, { desde: 17, nivel: 'Muy alto', rango: 'más de 17 hasta 25' }];
  /* amenazas oficiales vinculadas a El Niño en el VIRCH (lluvias, crecidas, tormentas, viento, cortes de energía y agua, brotes hídricos y por vectores) */
  const ELNINO = [['H2', 'Inundación repentina'], ['H1', 'Inundación fluvial'], ['M3', 'Tormentas (depresión tropical)'], ['M6', 'Viento fuerte'], ['T1', 'Falla eléctrica'], ['T6', 'Corte de agua'], ['B2', 'Enfermedades por agua'], ['B4', 'Brotes por alimentos'], ['B3', 'Enfermedades por vectores']];
  const NIVELES = ['Muy alto', 'Alto', 'Moderado', 'Bajo', 'Muy bajo'];
  const COLOR_NIVEL = { 'Muy alto': '#D32F2F', 'Alto': '#FB8C00', 'Moderado': '#FDD835', 'Bajo': '#A5D6A7', 'Muy bajo': '#2E7D32' };
  const TINTA_NIVEL = { 'Muy alto': '#FFFFFF', 'Alto': '#1F2937', 'Moderado': '#1F2937', 'Bajo': '#1F2937', 'Muy bajo': '#FFFFFF' };

  /* Trelew (HZT/HMH) usa los azules institucionales; el resto, la paleta de la Secretaría de Salud */
  function temaRed(nombre) {
    return /trelew/i.test(nombre || '')
      ? { fuerte: '#172B4D', medio: '#2F5BEA', claro: '#E4EAFB', borde: '#C5D1F2' }
      : { fuerte: '#172B4D', medio: '#2F5BEA', claro: '#E4EAFB', borde: '#C5D1F2' };
  }

  function hoy() {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* =========================================================
   *  MODO DEMOSTRACIÓN: simula el Apps Script dentro del navegador
   *  Se activa con ?demo=1 o si config.js no tiene la dirección del Apps Script.
   * ========================================================= */
  const Demo = (function () {
    const ESCALAS = {
      A: [
        { valor: 1, etiqueta: '1 · Muy improbable', desc: 'Menos de 5 % de probabilidad en los próximos 12 meses. Por ejemplo, ocurrió una vez o ninguna en los últimos 20 años.' },
        { valor: 2, etiqueta: '2 · Improbable', desc: 'Entre 5 % y 29 %. Por ejemplo, ocurrió entre una y tres veces en los últimos 20 años.' },
        { valor: 3, etiqueta: '3 · Probable', desc: 'Entre 30 % y 69 %. Por ejemplo, dos o tres veces en los últimos 10 años, o una o dos en los últimos 5.' },
        { valor: 4, etiqueta: '4 · Muy probable', desc: 'Entre 70 % y 94 %. Por ejemplo, cada dos o tres años, o dos veces en los últimos 5.' },
        { valor: 5, etiqueta: '5 · Casi seguro', desc: '95 % o más. Por ejemplo, tres o más veces en los últimos 5 años, o cinco o más en los últimos 10.' }],
      B: [
        { valor: 1, etiqueta: '1 · Sin impacto', b1: 'Sin lesionados ni víctimas.', b2: 'Sin daños.', b3: 'Sin interrupción de servicios.' },
        { valor: 2, etiqueta: '2 · Menor', b1: 'Puede causar lesiones leves.', b2: 'Daño no estructural menor que no afecta la operación normal.', b3: 'Interrupción de uno o más servicios por 4 horas o menos.' },
        { valor: 3, etiqueta: '3 · Moderado', b1: 'Puede causar lesiones graves, sin víctimas fatales.', b2: 'Daño no estructural que afecta temporalmente la operación normal.', b3: 'Interrupción de uno o más servicios por 24 horas o menos.' },
        { valor: 4, etiqueta: '4 · Grave', b1: 'Puede causar lesiones graves y muertes en un área o servicio.', b2: 'Daño no estructural que puede requerir una evacuación temporal o selectiva.', b3: 'Interrupción de uno o más servicios por 72 horas o menos.' },
        { valor: 5, etiqueta: '5 · Crítico', b1: 'Riesgo de lesiones graves o muerte para todos los ocupantes.', b2: 'Posible daño estructural que requiere evacuación y cierre.', b3: 'Pérdida importante (2 semanas o más) o irreparable de la función del establecimiento.' }],
      C: [
        { etiqueta: 'Alta', valor: 5, desc: 'Vulnerable estructural y no estructuralmente frente a la amenaza, con gestión del riesgo deficiente; o Índice de Seguridad Hospitalaria menor de 0,36.' },
        { etiqueta: 'Media', valor: 3, desc: 'Vulnerable frente a la amenaza, pero con buena gestión del riesgo; o Índice de Seguridad Hospitalaria entre 0,37 y 0,65.' },
        { etiqueta: 'Baja', valor: 1, desc: 'Sin vulnerabilidades estructurales ni no estructurales frente a la amenaza y con gestión óptima; o Índice de Seguridad Hospitalaria mayor de 0,66.' }],
      D: [
        { etiqueta: 'Alta', valor: 1, desc: 'Están disponibles todas las capacidades necesarias para manejar la amenaza y son sostenibles.' },
        { etiqueta: 'Media', valor: 3, desc: 'Hay algunas capacidades, pero nunca se pusieron a prueba en una respuesta real ni en un simulacro; su funcionamiento y sostenibilidad no están asegurados.' },
        { etiqueta: 'Baja', valor: 5, desc: 'Faltan, en su mayoría o por completo, las capacidades básicas (humanas, materiales, estratégicas y financieras).' }],
      niveles: NIVELES_OPS,
      pesos: [0.4, 0.3, 0.3]
    };
    const ESTAB = {
      'Red Trelew': [
        ['TW-01', 'Hospital', 'Hospital Zonal Trelew «Dr. Adolfo Margara» (HZT)'], ['TW-02', 'Hospital', 'Hospital María Humphreys (HMH)'],
        ['TW-03', 'Sede ex ADOS', 'Sede ex ADOS'], ['TW-04', 'CAPS', 'CAPS Amaya «Ramón Carrillo»'], ['TW-05', 'CAPS', 'CAPS Constitución «Jorge Morado»'],
        ['TW-06', 'CAPS', 'CAPS Corradi'], ['TW-07', 'CAPS', 'CAPS Don Bosco «Gwenda Williams»'], ['TW-08', 'CAPS', 'CAPS Etchepare'],
        ['TW-09', 'CAPS', 'CAPS La Loma'], ['TW-10', 'CAPS', 'CAPS Planta de Gas'], ['TW-11', 'CAPS', 'CAPS San Martín «Ing. Franzzetti»'],
        ['TW-12', 'CAPS', 'CAPS Sarmiento'], ['TW-13', 'CAPS', 'CAPS Tiro Federal'], ['TW-14', 'CAPS', 'CAPS Villa Italia'],
        ['TW-15', 'Salud Mental', 'CIT · Centro Integral de Tratamiento de las Problemáticas de Consumo'], ['TW-16', 'Salud Mental', 'Centro de Día'],
        ['TW-17', 'Salud Mental', 'Rehabilitación Psicomotora Pichi Anai'], ['TW-18', 'Salud Mental', 'Viviendas Asistidas'], ['TW-19', 'Salud Mental', 'Hilando Caminos']],
      'Red Rawson': [
        ['RW-01', 'Hospital', 'Hospital Subzonal Santa Teresita (HSST)'], ['RW-02', 'CAPS', 'CAPS Área 12'], ['RW-03', 'CAPS', 'CAPS Área 16 (Malvinas Argentinas)'],
        ['RW-04', 'CAPS', 'CAPS Gregorio Pablo Fermín'], ['RW-05', 'CAPS', 'CAPS San Ramón'], ['RW-06', 'CAPS', 'CAPS Río Chubut'],
        ['RW-07', 'CAPS', 'CAPS Playa Unión'], ['RW-08', 'CAPS', 'CAPS Carmelo Berruhet']]
    };
    const PRECARGA = { 'TW-01': 1, 'TW-02': 1, 'TW-04': 1, 'TW-05': 1, 'TW-06': 0.6, 'TW-15': 1, 'RW-01': 1, 'RW-02': 1, 'RW-03': 0.5 };

    function sembrar() {
      let s = 7;
      const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      const pick = (arr, pesos) => { let r = rnd() * pesos.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { r -= pesos[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
      const amen = (global.STARH_DEMO_AMENAZAS || []).map(x => ({ id: x[0], origen: x[1], grupo: x[2], subgrupo: x[3], amenaza: x[4], escenario: x[5], aplicaA: x[6], fuentes: x[7] }));
      const db = { redes: {} };
      Object.keys(ESTAB).forEach(red => {
        const est = ESTAB[red].map(e => ({ codigo: e[0], tipo: e[1], nombre: e[2], dependencia: 's/d', referente: 's/d', fechaReunion: 's/d', estado: PRECARGA[e[0]] ? (PRECARGA[e[0]] === 1 ? 'Evaluado' : 'En curso') : 'Pendiente', ish: 's/d' }));
        const ev = [];
        est.forEach(e => {
          amen.forEach(a => {
            const hosp = e.tipo === 'Hospital';
            const aplicaBase = /^Hospitales$/.test(a.aplicaA) ? hosp : true;
            const fila = { codigo: e.codigo, id: a.id, estab: e.nombre, red: red, origen: a.origen, grupo: a.grupo, amenaza: a.amenaza,
              aplica: aplicaBase ? 'Sí' : 'No aplica', A: '', B1: '', B2: '', B3: '', C: '', D: '', grav: '', imp: '', riesgo: '', nivel: '',
              fuente: '', antec: '', medidas: '', accion: '', area: '', fecha: '', evaluador: '' };
            const frac = PRECARGA[e.codigo] || 0;
            if (aplicaBase && rnd() < frac) {
              const elNino = ['E01', 'E02', 'E03', 'E04', 'E17', 'E19'].indexOf(a.id) >= 0;
              fila.A = ESCALAS.A[pick([0, 1, 2, 3, 4], elNino ? [0, 1, 3, 4, 2] : [3, 4, 3, 1, 1])].etiqueta;
              ['B1', 'B2', 'B3'].forEach(k => fila[k] = ESCALAS.B[pick([0, 1, 2, 3, 4], hosp ? [1, 3, 4, 3, 1] : [2, 4, 3, 1, 0.5])].etiqueta);
              fila.C = ['Alta', 'Media', 'Baja'][pick([0, 1, 2], red === 'Red Rawson' ? [3, 4, 1] : [2, 4, 2])];
              fila.D = ['Alta', 'Media', 'Baja'][pick([0, 1, 2], [1, 4, 2])];
              fila.fecha = '2' + Math.floor(rnd() * 8) + '/10/2026'; fila.evaluador = 'Equipo evaluador (demo)';
              Object.assign(fila, calcular(ESCALAS, fila));
            } else if (aplicaBase && frac === 1 && rnd() < 0.12) {
              fila.aplica = 'No aplica';
            }
            ev.push(fila);
          });
        });
        db.redes[red] = { est: est, amen: amen, ev: ev };
      });
      return db;
    }
    function db() { let d = store.get('demo.db', null); if (!d) { d = sembrar(); store.set('demo.db', d); } return d; }
    function usuarioDemo(dni) {
      return dni === '22222222'
        ? { dni: dni, nombre: 'Referente Rawson (demo)', rol: 'Referente', redes: ['Red Rawson'] }
        : { dni: dni, nombre: 'Administración (demo)', rol: 'Administración', redes: Object.keys(ESTAB) };
    }
    function publico(u) { return { nombre: u.nombre, rol: u.rol, comparativo: u.rol === 'Administración', puedeCargar: u.rol !== 'Consulta' }; }
    function quien(token) { const u = store.get('demo.quien', null); if (!token || !u) { const e = { ok: false, error: 'La sesión venció. Volvé a ingresar.', sesion: true }; throw e; } return u; }

    function atender(req) {
      return new Promise(res => setTimeout(() => {
        try { res(resolver(req)); } catch (e) { res(e && e.ok === false ? e : { ok: false, error: String(e.message || e) }); }
      }, 250));
    }
    function resolver(req) {
      const d = db();
      if (req.accion === 'login') {
        if (!/^\d{7,9}$/.test(String(req.dni || '').replace(/\D/g, '')) || String(req.clave || '').length < 6) return { ok: false, error: 'Revisá el DNI y la clave.' };
        if (req.clave !== '123456') return { ok: false, error: 'DNI o clave incorrectos, o acceso inactivo. (En la demostración la clave es 123456.)' };
        const u = usuarioDemo(String(req.dni).replace(/\D/g, ''));
        store.set('demo.quien', u);
        return { ok: true, token: 'demo-' + u.dni, usuario: publico(u) };
      }
      const u = quien(req.token);
      const redes = Object.keys(d.redes).filter(r => u.redes.indexOf(r) >= 0);
      if (req.accion === 'catalogo') {
        return { ok: true, usuario: publico(u), generado: new Date().toISOString(), redes: redes.map(r => ({
          nombre: r, escalas: ESCALAS, amenazas: d.redes[r].amen,
          establecimientos: d.redes[r].est.map(e => Object.assign({}, e, { puedeCargar: u.rol !== 'Consulta' })),
          evaluaciones: d.redes[r].ev })) };
      }
      if (req.accion === 'guardar') {
        const resultados = (req.items || []).map(it => {
          const R = d.redes[it.red];
          if (!R) return { uid: it.uid, ok: false, error: 'Red no activa' };
          let f = R.ev.find(x => x.codigo === it.codigo && x.id === it.id);
          if (!f) {
            if (!it.nueva) return { uid: it.uid, ok: false, error: 'No existe la amenaza ' + it.id };
            const e = R.est.find(x => x.codigo === it.codigo);
            f = { codigo: it.codigo, id: it.id, estab: e ? e.nombre : '', red: it.red, origen: it.origen || 's/d', grupo: it.grupo || 'Agregada en la reunión', amenaza: it.amenaza || 's/d' };
            R.ev.push(f);
          }
          f.aplica = it.aplica === 'No aplica' ? 'No aplica' : 'Sí';
          ['A', 'B1', 'B2', 'B3', 'C', 'D'].forEach(k => f[k] = f.aplica === 'No aplica' ? '' : (it[k] || ''));
          ['fuente', 'antec', 'medidas', 'accion', 'area'].forEach(k => f[k] = it[k] || '');
          f.fecha = it.fecha || hoy(); f.evaluador = it.evaluador || u.nombre;
          Object.assign(f, calcular(ESCALAS, f));
          return { uid: it.uid, ok: true, fila: Object.assign({}, f) };
        });
        store.set('demo.db', d);
        return { ok: true, resultados: resultados };
      }
      if (req.accion === 'estado') {
        const e = d.redes[req.red] && d.redes[req.red].est.find(x => x.codigo === req.codigo);
        if (!e) return { ok: false, error: 'Establecimiento inexistente' };
        ['referente', 'fechaReunion', 'estado', 'ish'].forEach(k => { if (req[k] != null && req[k] !== '') e[k] = req[k]; });
        store.set('demo.db', d);
        return { ok: true };
      }
      if (req.accion === 'tablero') {
        return { ok: true, usuario: publico(u), generado: new Date().toISOString(), redes: redes.map(r => ({
          nombre: r, establecimientos: d.redes[r].est,
          filas: d.redes[r].ev.map(x => [x.codigo, x.id, x.origen, x.grupo, x.amenaza, x.aplica, x.A ? Number(String(x.A).charAt(0)) : '', x.grav, x.imp, x.riesgo === '' ? '' : Number(x.riesgo), x.nivel, (x.aplica === 'No aplica' || x.riesgo !== '') ? 1 : 0]) })) };
      }
      return { ok: false, error: 'Acción desconocida' };
    }
    return { atender: atender, reiniciar() { store.del('demo.db'); } };
  })();

  global.STARH = { DEMO, API, api, store, sesion, calcular, nivelDe, num, fmt, ELNINO, NIVELES_OPS, NIVELES, COLOR_NIVEL, TINTA_NIVEL, temaRed, hoy, uid, esc, Demo };
})(window);

/* ---------- Navegación visible en todas las pantallas ----------
 * Botón «Inicio» claro y grande en la barra de arriba, y botones «Volver» con forma de botón.
 * Se agrega desde acá para que todas las páginas queden iguales. */
(function () {
  'use strict';
  function aplicar() {
    if (/(^|\/)(index\.html)?$/.test(location.pathname)) return; // pantalla de inicio
    const st = document.createElement('style');
    st.textContent = `
      .nav-inicio{display:inline-flex!important;align-items:center;gap:5px;flex:0 0 auto;background:#fff!important;color:#172B4D!important;text-decoration:none;
        border-radius:999px;padding:8px 14px 8px 10px!important;font:700 14px 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.28);margin-right:10px;white-space:nowrap}
      .nav-inicio .ms{font-size:20px!important;color:#2F5BEA}
      .nav-inicio:hover{background:#E4EAFB!important}
      .volver{display:inline-flex!important;align-items:center;gap:6px;background:#fff!important;border:2px solid #2F5BEA!important;color:#172B4D!important;
        border-radius:999px!important;padding:9px 16px 9px 11px!important;font-weight:700!important;font-size:14.5px!important;margin:2px 0 12px!important;
        box-shadow:0 1px 3px rgba(23,43,77,.18);cursor:pointer;text-decoration:none}
      .volver .ms{font-size:20px!important;color:#2F5BEA}
      .volver:hover{background:#E4EAFB!important}
      #volver{display:inline-flex;align-items:center;gap:4px;background:#fff;color:#172B4D!important;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700;text-decoration:none;margin-left:10px;vertical-align:middle}
      @media (max-width:420px){.nav-inicio{padding:8px 10px!important;font-size:13px}.nav-inicio .txt{display:none}}
      footer img{width:66.67%!important;max-width:740px!important;height:auto!important;max-height:56px!important;object-fit:contain}
      @media print{.nav-inicio,.volver{display:none!important}}`;
    document.head.appendChild(st);
    const barra = document.querySelector('header.barra, .barra');
    if (!barra) return;
    let a = barra.querySelector('a[href="index.html"]');
    if (!a) { a = document.createElement('a'); a.href = 'index.html'; barra.insertBefore(a, barra.firstChild); }
    a.className = 'nav-inicio'; a.removeAttribute('title');
    a.setAttribute('aria-label', 'Volver al inicio');
    a.innerHTML = '<span class="ms">home</span><span class="txt">Inicio</span>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar); else aplicar();
})();


/* ---------- Pie con el logo de HySL en cada hoja impresa ----------
 * Cada hoja de impresión (section.hoja o section.r-hoja) se envuelve en una tabla cuyo pie (tfoot)
 * contiene el pie de la hoja; el navegador lo repite al final de cada página impresa. */
(function () {
  'use strict';
  const st = document.createElement('style');
  st.textContent = `table.pag{width:100%;border-collapse:collapse;margin:0}table.pag>tbody>tr>td,table.pag>tfoot>tr>td{border:0!important;padding:0!important;background:none!important;width:auto!important;height:auto!important}
    @media print{html,body{background:#fff!important}}
    table.pag>tfoot{display:table-footer-group}table.pag>tfoot>tr>td{padding-top:3px!important}`;
  document.head.appendChild(st);
  function envolver(raiz) {
    raiz.querySelectorAll('section.hoja:not([data-pag]), section.r-hoja:not([data-pag])').forEach(h => {
      h.setAttribute('data-pag', '1');
      const pies = h.querySelectorAll('.pieimp, .pie, .r-pie'); const pie = pies[pies.length - 1];
      if (!pie || pie.closest('table.pag')) return;
      pie.remove();
      const t = document.createElement('table'); t.className = 'pag';
      t.innerHTML = '<tbody><tr><td></td></tr></tbody><tfoot><tr><td></td></tr></tfoot>';
      const cuerpo = t.querySelector('tbody td'); while (h.firstChild) cuerpo.appendChild(h.firstChild);
      t.querySelector('tfoot td').appendChild(pie); h.appendChild(t);
    });
  }
  function vigilar() {
    ['imp', 'hojas'].forEach(id => { const el = document.getElementById(id); if (!el) return; envolver(el); new MutationObserver(() => envolver(el)).observe(el, { childList: true }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilar); else vigilar();
})();

/* 05/11/2026 · Mis datos: quien no es Administración y todavía no completó su ficha vuelve al inicio, donde se le pide. */
(function () {
  try {
    const S = window.STARH; if (!S || S.DEMO) return;
    if (/(^|\/)(index\.html)?$/.test(location.pathname)) return;
    const u = S.sesion.token() ? S.sesion.usuario() : null;
    if (!u || u.rol === 'Administración') return;
    const n = String(u.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    // Solo si el servidor ya confirmó que la ficha está incompleta (así, sin servidor publicado o sin conexión, no bloquea).
    if (S.store.get('datosPend.' + n, false) === true) location.replace('index.html');
  } catch (e) { /* sin bloqueo si algo falla */ }
})();

/* 12/11/2026 · Tablas en pantalla: encabezado fijo y primera columna fija.
 * Cada tabla que está dentro de un recuadro con desplazamiento (overflow) se muestra con alto máximo:
 * al bajar, la fila de títulos queda arriba; al correr de costado, la primera columna (hospital, tipo, nombre) queda a la vista.
 * No toca las hojas para imprimir (#imp, #hojas, .imp) ni cambia al imprimir. */
(function () {
  const css = `@media screen{
.tfija{max-height:75vh;overflow:auto!important;overscroll-behavior:contain}
.tfija>table>thead>tr:first-child>th,.tfija>table>tbody>tr:first-child>th{position:sticky;top:0;z-index:3;box-shadow:0 1px 0 rgba(0,0,0,.12)}
.tfija.tfija-x>table>*>tr>:first-child{position:sticky;left:0;z-index:2;box-shadow:1px 0 0 rgba(0,0,0,.12)}
.tfija.tfija-x>table>thead>tr:first-child>th:first-child,.tfija.tfija-x>table>tbody>tr:first-child>th:first-child{z-index:4}
.tfija.tfija-x>table>*>tr>:first-child:not([colspan]){min-width:120px;max-width:44vw}
.tfija.tfija-x>table>*>tr>td[colspan]:first-child{position:static;box-shadow:none}
.tfija.tfija-x .tfija-txt{position:sticky;left:8px;display:inline-block;max-width:calc(100vw - 60px)}}
@media print{.tfija{max-height:none!important;overflow:visible!important}.tfija th,.tfija td{position:static!important;box-shadow:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const opaco = c => c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c);
  function fondo(el) { // color de fondo visible de la celda (las celdas fijas necesitan fondo para tapar lo que pasa por debajo)
    for (let n = el; n && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (opaco(c)) return c; }
    return '#fff';
  }
  function preparar() {
    document.querySelectorAll('table').forEach(t => {
      const w = t.parentElement; if (!w || t.closest('#imp,#hojas,.imp')) return;
      if (!w.classList.contains('tfija')) { const ox = getComputedStyle(w).overflowX; if (ox !== 'auto' && ox !== 'scroll') return; w.classList.add('tfija'); }
      w.classList.toggle('tfija-x', w.scrollWidth > w.clientWidth + 2);
      if (t.dataset.tfija) return; t.dataset.tfija = '1';
      const cab = t.rows[0] && t.rows[0].querySelector('th') ? [...t.rows[0].cells] : [];
      // Filas que ocupan todo el ancho (escalón, subtotal, total): la celda no queda fija (taparía las columnas al correr de costado);
      // solo su texto queda a la vista a la izquierda.
      [...t.rows].forEach(r => { const c = r.cells[0]; if (c && c.colSpan > 1 && !c.querySelector(':scope > .tfija-txt')) { const s = document.createElement('span'); s.className = 'tfija-txt'; while (c.firstChild) s.appendChild(c.firstChild); c.appendChild(s); } });
      const pri = [...t.rows].map(r => r.cells[0]).filter(c => c && c.colSpan === 1);
      cab.concat(pri).forEach(c => { if (!opaco(getComputedStyle(c).backgroundColor)) c.style.backgroundColor = fondo(c.parentElement); });
    });
  }
  let pend = false; const pedir = () => { if (pend) return; pend = true; setTimeout(() => { pend = false; try { preparar(); } catch (e) { /* nunca rompe la app */ } }, 60); };
  function iniciar() { pedir(); new MutationObserver(pedir).observe(document.body, { childList: true, subtree: true }); addEventListener('resize', () => { document.querySelectorAll('.tfija').forEach(w => w.classList.toggle('tfija-x', w.scrollWidth > w.clientWidth + 2)); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

/* 13/11/2026 · Fechas y horarios estandarizados en toda la app (pedido de Belén):
 * todo campo de fecha se elige con calendario y se guarda dd/mm/aaaa, solo años 2026 y 2027 (salvo fechas de nacimiento);
 * todo campo de horario se elige con reloj y se guarda HH:MM (o «HH:MM a HH:MM h» si se carga el fin).
 * El campo original queda oculto con su nombre y su valor: los formularios y el servidor no cambian. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const MIN = '2026-01-01', MAX = '2027-12-31';
  const css = `.fx-wrap{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.fx-wrap input{flex:1 1 140px;min-width:0}
.fx-wrap .fx-a{flex:0 0 auto;font-size:12px;color:#4B5B73}.fx-prev{display:block;font-size:11.5px;color:#6B7A90;margin-top:3px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const etiqueta = i => { const l = i.closest('label'); if (l) { const s = l.querySelector('span'); return (s ? s.textContent : l.textContent) || ''; } if (i.id) { const l2 = document.querySelector('label[for="' + i.id + '"]'); if (l2) return l2.textContent; } return ''; };
  const esTexto = i => i.tagName === 'INPUT' && (!i.getAttribute('type') || i.type === 'text') && !i.dataset.fx && !i.readOnly && !i.closest('[data-sinfx]');
  const esFecha = (i, t) => /dd\/mm\/aaaa/i.test(i.placeholder || '') || /\bfecha\b|\(dd\/mm|vencim|fecha comprometida/i.test(t) || /^(fecha|desde|hasta)$/i.test(i.name || '') || /fecha/i.test(i.name || '');
  const esHora = (i, t) => /^\s*(horario|hora)\b/i.test(t) || /^(horario|hora)$/i.test(i.name || '');
  const aISO = v => { const m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : ''; };
  const deISO = v => { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
  const aviso = (orig, w, ok) => { const v = (orig.value || '').trim(); if (v && !ok) { const p = document.createElement('span'); p.className = 'fx-prev'; p.textContent = 'Valor cargado: ' + v + ' (elegí uno nuevo para reemplazarlo)'; w.appendChild(p); } };
  const avisar = el => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  function fecha(i, t) {
    const libre = /nacim/i.test(t) || i.dataset.fechaLibre;
    const w = document.createElement('span'); w.className = 'fx-wrap';
    const d = document.createElement('input'); d.type = 'date'; d.dataset.fx = '1'; if (!libre) { d.min = MIN; d.max = MAX; }
    d.value = aISO(i.value); d.required = i.required; d.disabled = i.disabled; d.title = libre ? 'Elegí la fecha' : 'Elegí la fecha (años 2026 o 2027)';
    i.dataset.fx = '1'; i.required = false; i.style.display = 'none'; i.parentNode.insertBefore(w, i); w.appendChild(d); w.appendChild(i);
    aviso(i, w, !!d.value);
    d.addEventListener('change', () => { i.value = deISO(d.value); const p = w.querySelector('.fx-prev'); if (p) p.remove(); avisar(i); });
    new MutationObserver(() => { d.disabled = i.disabled; }).observe(i, { attributes: true, attributeFilter: ['disabled'] });
  }
  function hora(i) {
    const m = String(i.value || '').trim().match(/^(\d{1,2})[:.](\d{2})(?:\s*(?:a|-|–)\s*(\d{1,2})[:.](\d{2}))?\s*(?:h|hs)?\.?$/i) || String(i.value || '').trim().match(/^(\d{1,2})\s*(?:h|hs)\.?$/i);
    const w = document.createElement('span'); w.className = 'fx-wrap';
    const a = document.createElement('input'); a.type = 'time'; a.dataset.fx = '1'; a.title = 'Hora de inicio';
    const sep = document.createElement('span'); sep.className = 'fx-a'; sep.textContent = 'a';
    const b = document.createElement('input'); b.type = 'time'; b.dataset.fx = '1'; b.title = 'Hora de fin (optativa)';
    const dd = n => ('0' + n).slice(-2);
    if (m) { a.value = dd(m[1]) + ':' + (m[2] && /^\d{2}$/.test(m[2]) ? m[2] : '00'); if (m[3]) b.value = dd(m[3]) + ':' + m[4]; }
    a.required = i.required; a.disabled = b.disabled = i.disabled;
    i.dataset.fx = '1'; i.required = false; i.style.display = 'none'; i.parentNode.insertBefore(w, i); w.appendChild(a); w.appendChild(sep); w.appendChild(b); w.appendChild(i);
    aviso(i, w, !!m);
    const sync = () => { i.value = a.value ? (b.value ? a.value + ' a ' + b.value + ' h' : a.value) : ''; const p = w.querySelector('.fx-prev'); if (p) p.remove(); avisar(i); };
    a.addEventListener('change', sync); b.addEventListener('change', sync);
  }
  function revisar() {
    document.querySelectorAll('input').forEach(i => {
      if (!esTexto(i) || !i.parentNode || i.offsetParent === null && i.style.display === 'none') return;
      const t = etiqueta(i);
      try { if (esHora(i, t)) hora(i); else if (esFecha(i, t)) fecha(i, t); } catch (e) { /* nunca rompe la app */ }
    });
  }
  let pend = false; const pedir = () => { if (pend) return; pend = true; setTimeout(() => { pend = false; revisar(); }, 50); };
  function iniciar() { pedir(); new MutationObserver(pedir).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
