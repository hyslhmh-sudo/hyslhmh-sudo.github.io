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
  async function api(accion, datos) {
    const cuerpo = Object.assign({ accion: accion, token: store.get(DEMO ? 'demo.token' : 'token', '') }, datos || {});
    if (DEMO) return Demo.atender(cuerpo);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
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
  const sesion = {
    token() { return store.get(DEMO ? 'demo.token' : 'token', ''); },
    usuario() { return store.get(DEMO ? 'demo.usuario' : 'usuario', null); },
    guardar(token, usuario) { store.set(DEMO ? 'demo.token' : 'token', token); store.set(DEMO ? 'demo.usuario' : 'usuario', usuario); },
    cerrar() { store.del(DEMO ? 'demo.token' : 'token'); store.del(DEMO ? 'demo.usuario' : 'usuario'); }
  };

  /* ---------- cálculo STAR-H (mismas fórmulas que la hoja EVALUACIÓN) ---------- */
  function valorDe(lista, etiqueta) {
    const x = (lista || []).find(o => o.etiqueta === etiqueta);
    return x ? Number(x.valor) : null;
  }
  function redondear(n, d) { const f = Math.pow(10, d || 0); return Math.sign(n) * Math.round(Math.abs(n) * f) / f; }
  function calcular(esc, ev) {
    const vacio = { grav: '', imp: '', riesgo: '', nivel: '' };
    if (!esc || !ev || ev.aplica === 'No aplica') return vacio;
    const b1 = valorDe(esc.B, ev.B1), b2 = valorDe(esc.B, ev.B2), b3 = valorDe(esc.B, ev.B3);
    if (b1 == null || b2 == null || b3 == null) return vacio;
    const p = esc.pesos && esc.pesos.length === 3 ? esc.pesos : [2, 1, 1];
    const grav = redondear((p[0] * b1 + p[1] * b2 + p[2] * b3) / (p[0] + p[1] + p[2]), 2);
    const c = valorDe(esc.C, ev.C), d = valorDe(esc.D, ev.D);
    if (c == null || d == null) return Object.assign({}, vacio, { grav: grav });
    const imp = redondear((grav + c + d) / 3, 0);
    const a = valorDe(esc.A, ev.A);
    if (a == null) return Object.assign({}, vacio, { grav: grav, imp: imp });
    const riesgo = imp * a;
    return { grav: grav, imp: imp, riesgo: riesgo, nivel: nivelDe(esc, riesgo) };
  }
  function nivelDe(esc, riesgo) {
    let n = '';
    (esc.niveles || []).forEach(x => { if (riesgo >= x.desde) n = x.nivel; });
    return n;
  }
  const NIVELES = ['Muy alto', 'Alto', 'Moderado', 'Bajo', 'Muy bajo'];
  const COLOR_NIVEL = { 'Muy alto': '#F4B4B4', 'Alto': '#FFD3A6', 'Moderado': '#FFF2B3', 'Bajo': '#E6F2C2', 'Muy bajo': '#C8E6C9' };
  const TINTA_NIVEL = { 'Muy alto': '#7A1F1F', 'Alto': '#7A3E06', 'Moderado': '#5E4B00', 'Bajo': '#3D5214', 'Muy bajo': '#1E5223' };

  /* Trelew (HZT/HMH) usa los azules institucionales; el resto, la paleta de la Secretaría de Salud */
  function temaRed(nombre) {
    return /trelew/i.test(nombre || '')
      ? { fuerte: '#0D313F', medio: '#5894A7', claro: '#E6EFF2', borde: '#C9DCE3' }
      : { fuerte: '#B8441A', medio: '#E8602A', claro: '#FDEDE4', borde: '#F3D3C2' };
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
      niveles: [{ desde: 1, nivel: 'Muy bajo', rango: '1 a 3' }, { desde: 4, nivel: 'Bajo', rango: '4 a 6' }, { desde: 7, nivel: 'Moderado', rango: '7 a 11' }, { desde: 12, nivel: 'Alto', rango: '12 a 16' }, { desde: 17, nivel: 'Muy alto', rango: '17 a 25' }],
      pesos: [2, 1, 1]
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
        : { dni: dni, nombre: 'Belén Pellegrini (demo)', rol: 'Administración', redes: Object.keys(ESTAB) };
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

  global.STARH = { DEMO, API, api, store, sesion, calcular, nivelDe, NIVELES, COLOR_NIVEL, TINTA_NIVEL, temaRed, hoy, uid, esc, Demo };
})(window);
