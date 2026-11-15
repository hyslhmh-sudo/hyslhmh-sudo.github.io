/* Planillas modelo comunes de Gestión de contingencias (evac.html) y Derivaciones y albergues (derivaciones.html) · versión 0
 * 15/11/2026 · Revisión de redundancias (Belén: «avanzar»): estas tablas y funciones estaban copiadas igual en las dos páginas.
 * Ahora están una sola vez acá, así no se desfasan: lo que se corrija en una planilla modelo vale para las dos páginas.
 * Cada página pasa lo que es propio de ella (encabezado y pie, red elegida, avisos).
 */
(function (global) {
'use strict';
const E = global.STARH.esc;

const OPC = {
  prioridad: ['Inmediata', 'Diferida', 'Menor'],
  movilidad: ['Autónomo', 'Con apoyo', 'Totalmente dependiente', 'Con soporte vital'],
  traslado: ['Caminando', 'Silla de ruedas', 'Camilla', 'Cama', 'Incubadora', 'Otro'],
  equipos: ['Oxígeno', 'Respirador', 'Monitor', 'Bombas de infusión', 'Incubadora o servocuna', 'Drenajes', 'Sonda vesical', 'Otro'],
  aislamiento: ['No', 'Contacto', 'Gotas', 'Aéreo'],
  movil: ['Alta complejidad', 'Avanzado', 'Básico', 'Utilitario o particular', 'Aéreo'],
  sino: ['Sí', 'No']
};
const MODELOS = {
  registro: { ico: 'list_alt', titulo: 'Registro de pacientes evacuados', apaisada: true, txt: 'Lo que sale del hospital. Una fila por paciente: servicio de origen, prioridad, movilidad, destino, móvil, horarios y llegada confirmada. Hoja apaisada. Adaptado de HICS 255.' },
  ficha: { ico: 'assignment_ind', titulo: 'Ficha de traslado del paciente', txt: 'Una por paciente que va a otra institución; lo acompaña y la última parte la completa quien lo recibe. Adaptado de HICS 260 y OPS EVAC-H.' },
  ingresos: { ico: 'login', titulo: 'Registro de ingresos por el evento', apaisada: true, txt: 'Lo que llega al hospital o al centro de salud: lesionados, evacuados en resguardo preventivo, embarazadas, personas derivadas desde albergues. Una fila por persona, con procedencia, clasificación y destino final. Adaptado de HICS 254.' },
  albergue: { ico: 'night_shelter', titulo: 'Ficha de derivación a albergue', txt: 'Para la persona que sale del hospital o del centro de salud hacia un albergue: cuidados y apoyos que necesita, medicación entregada, centro de salud que hace el seguimiento, y contrarreferencia si tiene que volver.' },
  censo: { ico: 'groups_3', titulo: 'Censo rápido para evacuar', apaisada: true, txt: 'Por servicio, cuántas personas hay en cada categoría de traslado (se autoevacúa, camina con ayuda, en silla, requiere atención durante el traslado, soporte vital) y qué transporte y personal hacen falta. Adaptado de Vítolo (2019) y OPS EVAC-H.' },
  autoeval: { vit: true, ico: 'fact_check', titulo: 'Autoevaluación de la conducción', txt: 'Cinco preguntas para la Dirección y el comité: comando de incidentes, ejercicios, autonomía de 96 horas, acuerdos con receptores y compromiso directivo. Un «No sé» vale lo mismo que un «No» (Vítolo, 2026).' },
  madurez: { vit: true, ico: 'speed', titulo: 'Autoevaluación de preparación por escenario', txt: 'Seis cuestionarios (incendio, corte de energía, inundación, ciberataque, pandemia y víctimas múltiples) con escala de 1 a 4: no existe, existe en papel, entrenado, verificado y vigente. Incluye tabla consolidada. Adaptado del anexo de Vítolo (2026).' },
  aar: { vit: true, ico: 'assignment_turned_in', titulo: 'Informe posterior al ejercicio y plan de mejora', txt: 'Después de cada simulacro o emergencia: qué funcionó, qué no y por qué, brechas encontradas y un plan de mejora con acción, responsable, fecha y cómo se verifica (Vítolo, 2026).' },
  parte: { ico: 'campaign', titulo: 'Informe de derivaciones al COEsp', txt: 'Parte periódico para la mesa conjunta: cuántos llegaron y de dónde, cuántos salieron y a dónde, capacidad estimada que queda, necesidades y próximos pasos. La frecuencia se acuerda con el COEsp.' }
};
const PRIOR = [
  { n: 1, c: '#C62828', t: '#FFFFFF', nombre: 'ROJA', titulo: 'PRIORIDAD 1 · INMEDIATA', txt: 'Crítico o con soporte vital. Va a una institución con terapia intensiva, en móvil de alta complejidad y con confirmación previa de cama.' },
  { n: 2, c: '#EF6C00', t: '#FFFFFF', nombre: 'NARANJA', titulo: 'PRIORIDAD 2 · URGENTE', txt: 'Necesita seguir internado y depende del personal. Va a otra institución con internación, con ficha de traslado.' },
  { n: 3, c: '#F9A825', t: '#3A2A00', nombre: 'AMARILLA', titulo: 'PRIORIDAD 3 · DIFERIDA', txt: 'Estable, se moviliza con apoyo. Puede esperar; internación general o zona segura interna.' },
  { n: 4, c: '#2E7D32', t: '#FFFFFF', nombre: 'VERDE', titulo: 'PRIORIDAD 4 · NO URGENTE', txt: 'Autónomo y estable. Alta anticipada a domicilio o albergue, con indicaciones y seguimiento.' }
];
const MADUREZ = [
  ['A', 'Incendio', [
    ['Planificación y documentación', [['Plan de respuesta ante incendios documentado y accesible', '¿Está en cada sector, no solo en la dirección?'], ['Protocolo RACE formalizado y señalizado en cada sector', '¿RACE y PASS exhibidos junto a los matafuegos?'], ['Plano actualizado de barreras pasivas, válvulas de gases y matafuegos', 'Plano por sector con puertas cortafuego, válvulas de zona y extintores.'], ['Responsables por sector para cada paso de RACE', '¿Cada trabajador sabe quién cierra las válvulas de gases?']]],
    ['Sistemas de protección (activos y pasivos)', [['Detección y alarma operativas y probadas', 'Última prueba documentada y registros.'], ['Rociadores instalados y con mantenimiento al día', 'En las áreas requeridas, sin cabezales tapados, pintados o corroídos.'], ['Matafuegos correctos por área, accesibles y vigentes', 'Vencimiento, señalización, sin obstáculos.'], ['Puertas cortafuego que cierran y sellan', '¿Alguna está trabada habitualmente? ¿Hay registros de inspección?'], ['Barreras de fuego y humo sin perforaciones sin sellar', '¿Cada obra de cableado o plomería repara las barreras?']]],
    ['Entrenamiento del personal', [['Todo el personal conoce y ejecuta RACE', 'Incluye administrativos, cocina, servicios generales y turno noche.'], ['Personal entrenado en el uso de matafuegos (PASS)', 'Práctica con extintores reales o simuladores en el último año.'], ['Personal de cocina entrenado en fuego de aceites', 'Protocolo específico y capacitación.'], ['Personal nuevo capacitado en incendio durante la inducción', 'Con registro de asistencia.']]],
    ['Evacuación ante incendio', [['Evacuación horizontal definida por sector', 'Compartimento seguro conocido y señalizado.'], ['Procedimiento para pacientes de terapia intensiva y dependientes', 'Protocolo para pacientes ventilados o en cama.'], ['Simulacro de incendio en los últimos 12 meses', 'Al menos uno con todos los turnos y con informe.']]],
    ['Coordinación externa y recuperación', [['Relación establecida con bomberos locales', '¿Conocen el plano, las válvulas y el acceso vehicular?'], ['Evaluación posterior al incendio antes de reocupar áreas', 'Lista de habilitación estructural y sanitaria.'], ['Debriefing con informe posterior y plan de mejora', 'Informe con lecciones aprendidas.']]]]],
  ['B', 'Corte de energía eléctrica', [
    ['Planificación y documentación', [['Plan ante corte eléctrico', 'Incluye falla de red, falla del grupo electrógeno y falla parcial por sector.'], ['Inventario de equipos críticos y su circuito', '¿Normal o de emergencia?'], ['Modo degradado para los sistemas de información', 'Formularios en papel, prescripción manual y registros disponibles físicamente.'], ['Orden de desconexión de cargas definido', 'Aprobado por dirección médica y mantenimiento.']]],
    ['Infraestructura de respaldo', [['Transferencia automática al grupo electrógeno en 10 segundos o menos', 'Medida y documentada.'], ['Grupo electrógeno probado bajo carga (30 % de su capacidad)', 'Con registros de los últimos 12 meses.'], ['Autonomía de combustible verificada', '96 horas o más para áreas críticas.'], ['Centro de comando con energía de emergencia propia', ''], ['Subestación y tableros fuera de zonas inundables', '']]],
    ['Cadena de frío y equipos críticos', [['Protocolo para medicamentos que requieren frío ante un corte', 'Tiempos de exposición aceptables por medicamento.'], ['Heladeras de medicamentos y hemoderivados en circuito de emergencia', 'Verificadas en 12 meses, con registro de temperatura.'], ['Equipos de soporte vital con baterías verificadas', 'Ventiladores, monitores, bombas.']]],
    ['Entrenamiento y comunicación', [['Personal entrenado en modo degradado', 'Trabajo con formularios en papel.'], ['Personal que conoce qué equipos desconectar y en qué orden', ''], ['Simulacro de corte en los últimos 12 meses', 'Con activación del modo degradado y registro.']]],
    ['Acuerdos externos y recuperación', [['Registro como infraestructura crítica ante la distribuidora', 'Con constancia y contacto directo de emergencias.'], ['Acuerdo con proveedor de combustible para reabastecimiento de emergencia', 'Con tiempo de respuesta.'], ['Verificación de equipos antes de reconectar', 'Lista de reinicio seguro.']]]]],
  ['C', 'Inundación', [
    ['Planificación y evaluación del riesgo', [['Análisis de amenazas con riesgo hídrico actualizado', 'Cursos de agua, cotas históricas.'], ['Plan ante inundación con fase preventiva y reactiva', '¿Distingue inundación pluvial (rápida) de fluvial (con preaviso)?'], ['Infraestructura vulnerable identificada', 'Subsuelos, tableros, equipos en planta baja; mapa de vulnerabilidad.'], ['Criterios escritos para evacuar o refugiarse en el lugar', '¿Quién tiene autoridad para decidir?']]],
    ['Mitigación estructural', [['Sistemas eléctricos críticos por encima del nivel de riesgo', 'Grupo electrógeno, subestación, tableros.'], ['Bombas de achique operativas y probadas', 'Con registro.'], ['Barreras en accesos vulnerables', 'Compuertas, bolsas de arena.'], ['Desagües limpiados antes de la temporada de lluvias', 'Mantenimiento preventivo documentado.']]],
    ['Preparación operativa preventiva', [['Protocolo para subir equipamiento a pisos altos', 'Qué se mueve, adónde y en qué plazo.'], ['Suscripción a alertas meteorológicas e hidrológicas', 'Servicio Meteorológico Nacional, autoridad del agua provincial.'], ['Procedimiento de altas anticipadas ante alerta', 'Criterio clínico y quién autoriza.'], ['Reserva de combustible verificada antes de la temporada de riesgo', '']]],
    ['Evacuación y continuidad', [['Plan de evacuación de pacientes críticos con destinos y transporte definidos', ''], ['Acuerdos con instituciones receptoras vigentes', 'Confirmados en 12 meses, al menos uno fuera del área de riesgo compartida.'], ['Análisis microbiológico del agua antes de volver a usarla', ''], ['Simulacro o ejercicio de mesa de inundación en los últimos 24 meses', 'Que incluya la decisión de evacuar y la coordinación con Protección Civil.']]],
    ['Coordinación externa y recuperación', [['Relación formal con Protección Civil municipal y provincial', 'Contactos actualizados y ejercicios conjuntos.'], ['Evaluación estructural certificada antes de readmitir pacientes', ''], ['Plan de recuperación económica', 'Seguro, documentación de daños, gestión de fondos.']]]]],
  ['D', 'Ciberataque y falla de sistemas', [
    ['Planificación y política', [['Plan de respuesta a incidentes informáticos', 'Incluye secuestro de datos, saturación y falla de proveedores.'], ['Responsable de seguridad informática con autoridad para aislar sistemas', 'En los primeros minutos.'], ['Inventario de sistemas críticos y sus dependencias', ''], ['Política de contraseñas y accesos privilegiados', 'Contraseñas únicas y verificación en dos pasos.']]],
    ['Respaldo y continuidad', [['Copias de seguridad fuera de línea y fuera del edificio', 'Con restauración de prueba documentada.'], ['Modo degradado clínico en papel en cada sector', 'Prescripción, administración de medicación e identificación de pacientes.'], ['Red segmentada para contener un ataque sin apagar todo', ''], ['Equipos médicos críticos que funcionan sin la red', '']]],
    ['Entrenamiento del personal', [['Capacitación en correos engañosos (phishing) en el último año', ''], ['Personal clínico entrenado en modo degradado', 'Prescribir, registrar y verificar medicación sin sistema.'], ['Coordinadores de modo degradado por turno', ''], ['Simulacro de ciberataque en los últimos 24 meses', 'Con activación del modo degradado.']]],
    ['Comunicación y notificación', [['Comunicación interna alternativa', 'Radios portátiles operativas y personal entrenado.'], ['Contactos de la Dirección Nacional de Ciberseguridad y procedimiento de aviso', ''], ['Mensajes públicos preaprobados', 'Sin detalles técnicos ni montos de rescate.']]],
    ['Recuperación y mejora', [['Preservar evidencia antes de apagar o restaurar', 'Contacto con especialistas forenses.'], ['Restauración progresiva con orden de prioridad', 'Lista de verificación antes de cada reactivación.'], ['Contrato con proveedor de ciberseguridad con tiempo de respuesta', ''], ['Debriefing con actualización del plan', '']]]]],
  ['E', 'Pandemia o brote', [
    ['Planificación y vigilancia', [['Plan pandémico por fases', 'Preparación, respuesta, meseta y recuperación.'], ['Suscripción a alertas del Ministerio de Salud y de OPS/OMS', ''], ['Vigilancia interna de brotes', 'Ausentismo por enfermedad y casos agrupados.'], ['Umbrales para activar el comando de incidentes por etapas', '']]],
    ['Control de infecciones', [['Circuitos diferenciados con acceso y triage propios', 'Diseñados, señalizados y probados.'], ['Equipos de protección personal para al menos 30 días', 'Barbijos N95, guantes, camisolines, protección ocular.'], ['Al menos dos proveedores alternativos de equipos de protección', 'Con entrega de emergencia.'], ['Entrenamiento supervisado en colocación y retiro de equipos de protección', 'En el último año.'], ['Salas de presión negativa verificadas en los últimos 12 meses', '']]],
    ['Expansión de capacidad', [['Espacios de expansión de camas y terapia identificados', 'Con sus requerimientos de gases e instalaciones.'], ['Plan de personal para la expansión', 'Reasignación y acreditación rápida.'], ['Criterios de uso de recursos escasos con comité de ética', ''], ['Plan para reactivar servicios suspendidos', '']]],
    ['Comunicación', [['Actualización diaria al personal por canal oficial', ''], ['Comunicación pública de los servicios que siguen abiertos', ''], ['Reporte periódico de camas y equipos de protección al Ministerio', '']]],
    ['Salud del personal y recuperación', [['Apoyo psicológico para el personal con mecanismo de derivación', ''], ['Testeo y seguimiento del personal', 'Criterios de regreso y rastreo de contactos.'], ['Debriefing posterior con cambios en el plan', '']]]]],
  ['F', 'Incidente con múltiples víctimas', [
    ['Planificación y umbral de activación', [['Plan con umbral de activación según la capacidad real', ''], ['Niveles de respuesta con recursos para cada uno', '¿Qué se activa ante 5, 20 o 50 víctimas?'], ['Fichas de acción del comando de incidentes para víctimas múltiples', 'Con contactos, sectores y circuitos propios.'], ['Llamado masivo de personal probado en el último año', 'Con datos actualizados.']]],
    ['Triage y área de recepción', [['Triage START adoptado y entrenado en la guardia', 'Con tarjetas disponibles.'], ['Área de triage identificada y señalizada', 'Fuera del circuito habitual.'], ['Material de triage suficiente y accesible', 'Tarjetas de colores, etiquetas, formularios de registro.'], ['Reclasificación continua con frecuencia definida', '']]],
    ['Expansión de capacidad', [['Liberación inmediata de la guardia', 'Altas y pase a sala; quién lo autoriza.'], ['Quirófanos activables en 30 minutos o menos', 'Con protocolo probado.'], ['Cirugía de control de daños adoptada y entrenada', ''], ['Áreas de expansión para víctimas leves identificadas', '']]],
    ['Comunicación y familias', [['Canal directo con el sistema de emergencias para informar capacidad', ''], ['Centro de asistencia a familias fuera del área clínica', 'Con espacio, personal y protocolo.'], ['Identificación y seguimiento de víctimas', 'Etiqueta con identificación y destino interno.'], ['Área de prensa que no interfiera con las ambulancias', 'Con mensajes preaprobados.']]],
    ['Entrenamiento y coordinación comunitaria', [['Simulacro de víctimas múltiples en los últimos 24 meses', 'Con comando, triage, expansión y asistencia a familias.'], ['Ejercicio conjunto con el sistema de emergencias y otros hospitales', ''], ['Debriefing con informe posterior y plan de mejora', ''], ['Registro de los incidentes con víctimas múltiples atendidos', 'Fechas, víctimas, lecciones.']]]]]
];

function campoHTML(c, v, dis, pref) {
  const id = pref + c.clave, val = v == null ? '' : String(v), a = `data-k="${E(c.clave)}" id="${E(id)}" ${dis}`;
  const ancho = c.tipo === 'largo' || c.tipo === 'multi' || c.campo.length > 60;
  let ctl;
  if (c.tipo === 'largo') ctl = `<textarea ${a}>${E(val)}</textarea>`;
  else if (c.tipo === 'sino') ctl = `<div class="ops" data-op="${E(c.clave)}">${['Sí', 'No', 's/d'].map(o => `<button type="button" class="op" data-v="${o}" aria-pressed="${val === o}" ${dis}>${o}</button>`).join('')}</div>`;
  else if (c.tipo === 'multi') { const sel = val.split(';').map(s => s.trim()); ctl = `<div class="ops" data-multi="${E(c.clave)}">${c.opciones.map(o => `<button type="button" class="op" data-v="${E(o)}" aria-pressed="${sel.indexOf(o) >= 0}" ${dis}>${E(o)}</button>`).join('')}</div>`; }
  else if (c.tipo === 'lista') ctl = `<select ${a}><option value="">s/d</option>${c.opciones.map(o => `<option ${o === val ? 'selected' : ''}>${E(o)}</option>`).join('')}${val && c.opciones.indexOf(val) < 0 ? `<option selected>${E(val)}</option>` : ''}</select>`;
  else if (c.tipo === 'numero' || c.tipo === 'porcentaje') ctl = `<input ${a} inputmode="decimal" value="${E(val)}" placeholder="${c.tipo === 'porcentaje' ? '0 a 100' : 's/d'}">`;
  else if (c.tipo === 'fecha') ctl = `<input ${a} value="${E(val)}" placeholder="dd/mm/aaaa">`;
  else if (c.tipo === 'telefono') ctl = `<input ${a} inputmode="tel" value="${E(val)}">`;
  else if (c.tipo === 'correo') ctl = `<input ${a} type="email" value="${E(val)}">`;
  else ctl = `<input ${a} value="${E(val)}">`;
  return `<label class="campo ${ancho ? 'ancho' : ''}" ${c.tipo === 'sino' || c.tipo === 'multi' ? 'onclick="event.preventDefault()"' : ''}><span>${E(c.campo)}</span>${ctl}${c.ayuda ? `<small>${E(c.ayuda)}</small>` : ''}</label>`;
}
function tarjetaHTML(p, r, word) {
  const cas = o => `<span class="casilla">${word ? '☐' : ''}</span>${E(o)}`;
  const ops = l => l.map(cas).join(' ');
  const lin = (l, ancho) => `<tr><td class="l">${E(l)}</td><td class="v"${ancho ? ` colspan="${ancho}"` : ''}></td></tr>`;
  const banda = (h, size) => `<div class="tj-banda" style="background:${p.c};color:${p.t};${size || ''}"><b style="font-size:${word ? '20pt' : '22px'}">${p.titulo}</b><br><span style="font-size:${word ? '8.5pt' : '11px'}">TARJETA ${p.nombre} · ${E(p.txt)}</span></div>`;
  const tw = /trelew/i.test(r.nombre);
  return `<section class="tj">
    <table class="tj-cab"><tr><td style="border:0"><b>TARJETA DE PRIORIDAD DE DERIVACIÓN</b><br><span style="font-size:7.5pt">Atar a la muñeca o a la camilla · acompaña al paciente hasta el destino</span></td><td style="border:0;text-align:right;white-space:nowrap"><b style="font-size:13pt">N.º ________</b></td></tr></table>
    ${banda()}
    <table class="tj-t">${lin('Apellido y nombre', 3)}<tr><td class="l">DNI o historia clínica</td><td class="v"></td><td class="l">Edad · sexo</td><td class="v"></td></tr>
      <tr><td class="l">Establecimiento · servicio · cama de origen</td><td class="v" colspan="3"></td></tr><tr><td class="l">Diagnóstico principal</td><td class="v" colspan="3"></td></tr>
      <tr><td class="l">Alergias</td><td class="v"></td><td class="l">Aislamiento</td><td class="v">${ops(['No', 'Contacto', 'Gotas', 'Aéreo'])}</td></tr></table>
    <table class="tj-t"><tr><td class="l" style="width:22%">Estado · hora ___:___</td><td class="v" colspan="3">${ops(['Consciente', 'Desorientado', 'No responde'])}&nbsp;&nbsp; TA ____/____ &nbsp;FC ____ &nbsp;FR ____ &nbsp;Sat O₂ ____ %</td></tr>
      <tr><td class="l">Movilidad (EVAC-H)</td><td class="v" colspan="3">${ops(['Autónomo', 'Con apoyo', 'Totalmente dependiente', 'Con soporte vital'])}</td></tr>
      <tr><td class="l">Atención que necesita</td><td class="v" colspan="3">${ops(['Terapia intensiva adultos', 'Terapia intensiva pediátrica', 'Neonatología', 'Internación general', 'Pediatría', 'Quirófano', 'Quemados', 'Salud mental', 'Maternidad', 'Diálisis', 'Aislamiento respiratorio'])}</td></tr>
      <tr><td class="l">Lleva</td><td class="v" colspan="3">${ops(['Oxígeno', 'Respirador', 'Monitor', 'Bombas de infusión', 'Incubadora', 'Historia clínica', 'Medicación'])}</td></tr>
      <tr><td class="l">Destino · móvil · hora de salida</td><td class="v" colspan="3"></td></tr>
      <tr><td class="l">Si cambia el estado, nueva prioridad</td><td class="v" colspan="3">${ops(['1 Roja', '2 Naranja', '3 Amarilla', '4 Verde'])} · hora ___:___ · firma ________</td></tr>
      <tr><td class="l">Clasificó (nombre y firma)</td><td class="v" colspan="3"></td></tr></table>
    <div class="tj-talon"><span>✂ Talón para el registro de evacuados (queda en el establecimiento)</span>
      <table class="tj-t" style="margin-top:3px"><tr><td style="background:${p.c};color:${p.t};width:18%;text-align:center"><b>${p.n} · ${p.nombre}</b></td><td>N.º ______</td><td>Paciente: ______________________</td><td>Destino: ________________</td><td>Hora ___:___</td></tr></table></div>
    <div style="font-size:6pt;color:#4B5B73;margin-top:2px">${tw ? 'Servicio de Higiene y Seguridad Laboral' : 'Referente de Higiene y Seguridad Laboral'} · ${E(r.nombre)} · Adaptado de METTAG, SMART, HICS 255 y 260 y OPS EVAC-H · Uso exclusivo para la emergencia.</div>
    <div class="tj-logo" style="text-align:center">${word ? '<p align="center"><img src="https://hyslhmh-sudo.github.io/emergencias/logo-hysl.png" width="__LOGOW__" alt="HySL"></p>' : '<img src="logo-hysl.png" alt="HySL" style="width:66.67%;height:auto;max-height:6.5mm;object-fit:contain">'}</div>
  </section>`;
}
function tarjetasHTML(cual, r, word) { return PRIOR.filter(p => !cual || String(p.n) === String(cual)).map(p => tarjetaHTML(p, r, word)).join(word ? '<br style="page-break-before:always">' : ''); }
function madurezHTML(cual, r, word, vitEncPie) {
  const { encV, pieV } = vitEncPie(r, word);
  const cas = o => `<span class="casilla">${word ? '☐' : ''}</span>${E(o)}`;
  const esc = MADUREZ.filter(e => !cual || e[0] === cual);
  const escala = `<table class="reg" style="margin:4px 0 6px"><tr><td class="l">1 · No existe</td><td class="l">2 · Existe en papel</td><td class="l">3 · Entrenado</td><td class="l">4 · Verificado y vigente</td></tr>
    <tr><td style="font-size:7.3pt">No hay plan, protocolo ni recurso.</td><td style="font-size:7.3pt">Hay un documento, pero no se entrenó ni se verificó.</td><td style="font-size:7.3pt">Existe y se entrenó, pero no se verificó en los últimos 12 meses.</td><td style="font-size:7.3pt">Entrenado y verificado o ejercitado en los últimos 12 meses.</td></tr></table>`;
  const bandas = `<p style="font-size:7.6pt;color:#4B5B73;margin:4px 0"><b>Resultado:</b> promedio = suma ÷ cantidad de ítems. <b>1,00 a 1,75</b> preparación inicial (brechas críticas: plan de acción inmediato con plazos) · <b>1,76 a 2,50</b> en desarrollo (predominan documentos no entrenados: priorizar ejercicios) · <b>2,51 a 3,25</b> consolidada (trabajar los ítems con 1 o 2) · <b>3,26 a 4,00</b> avanzada (revisión anual e integración comunitaria).</p>`;
  const hojas = esc.map(e => { let n = 0; const items = e[2].reduce((a, d) => a + d[1].length, 0);
    return `<section class="hoja">${encV}<div class="kick">AUTOEVALUACIÓN DE PREPARACIÓN · ESCENARIO ${e[0]} · ${E(e[1].toUpperCase())}</div>
      <table class="reg"><tr><td class="l">Establecimiento · fecha</td><td>______________________________ · ___/___/______</td></tr><tr><td class="l">Equipo evaluador (dirección médica, enfermería, mantenimiento, emergencias)</td><td style="height:24px"></td></tr></table>
      ${escala}
      <table class="reg"><tr><td class="l" style="width:4%">N.º</td><td class="l">Aspecto y pregunta guía</td><td class="l" style="width:20%">Puntaje</td><td class="l" style="width:22%">Evidencia que se revisó</td></tr>
      ${e[2].map(d => `<tr><td colspan="4" style="background:#F5F7FB;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact">${E(d[0])}</td></tr>` + d[1].map(it => `<tr><td>${++n}</td><td><b>${E(it[0])}</b>${it[1] ? `<br><span style="font-size:7.3pt;color:#4B5B73">${E(it[1])}</span>` : ''}</td><td style="white-space:nowrap">${['1', '2', '3', '4'].map(cas).join('')}</td><td></td></tr>`).join('')).join('')}
      <tr><td></td><td style="text-align:right"><b>Suma · promedio (${items} ítems)</b></td><td colspan="2">______ / ${items * 4} · promedio ______</td></tr></table>
      ${bandas}
      <table class="reg"><tr><td class="l">Observaciones y acciones prioritarias (pasarlas al registro de tareas con responsable y plazo)</td><td style="height:52px"></td></tr></table>
      <p style="font-size:7.3pt;color:#4B5B73">Evaluar en equipo y con evidencia (planes, registros de simulacros, contratos, inventarios): sin evidencia, el puntaje no puede ser 3 ni 4. Un plan no entrenado equivale a no tener plan. Adaptado de Vítolo, Planes de contingencia hospitalarios (NOBLE, 2026), Anexo; bandas recalculadas sobre el promedio.</p>${pieV}</section>`; }).join('');
  if (cual) return hojas;
  return hojas + `<section class="hoja">${encV}<div class="kick">AUTOEVALUACIÓN DE PREPARACIÓN · TABLA CONSOLIDADA</div>
    <table class="reg"><tr><td class="l">Establecimiento · fecha</td><td>______________________________ · ___/___/______</td></tr></table>
    <table class="reg" style="margin-top:6px"><tr><td class="l">Dimensión (por orden en cada cuestionario)</td>${MADUREZ.map(e => `<td class="l">${e[0]} · ${E(e[1])}</td>`).join('')}</tr>
    ${[1, 2, 3, 4, 5].map(i => `<tr><td><b>Dimensión ${i}</b><br><span style="font-size:7pt;color:#4B5B73">${['Planificación', 'Sistemas e infraestructura', 'Entrenamiento', 'Comunicación o evacuación', 'Coordinación y recuperación'][i - 1]}</span></td>${MADUREZ.map(() => '<td style="height:30px">____ / ____</td>').join('')}</tr>`).join('')}
    <tr><td><b>Total · promedio</b></td>${MADUREZ.map(() => '<td style="height:30px">____ / ____<br>prom. ____</td>').join('')}</tr></table>
    <ul style="font-size:8pt;color:#4B5B73;margin-top:8px"><li>Una columna con mayoría de 1 y 2: brecha crítica en ese escenario; priorizarlo.</li><li>Una fila baja en todos los escenarios: debilidad transversal; mejorarla mejora todo.</li><li>Mayoría de 2: la brecha principal es el entrenamiento, no la documentación.</li><li>Mayoría de 3: falta verificación; fijar un ciclo anual de revisión y ejercicio.</li><li>El objetivo no es sacar un puntaje alto, sino saber dónde están las brechas.</li></ul>${pieV}</section>`;
}
function vitoloHTML(id, r, word, madEsc, vitEncPie) {
  if (id === 'madurez') return madurezHTML(madEsc, r, word, vitEncPie);
  const { encV, pieV } = vitEncPie(r, word);
  const cas = o => `<span class="casilla">${word ? '☐' : ''}</span>${E(o)}`;
  const fila = (l, h) => `<tr><td class="l">${E(l)}</td><td style="height:${h || 18}px"></td></tr>`;
  const h2 = t => `<h2>${t}</h2>`;
  const grilla = (cols, n) => `<table class="reg"><tr>${cols.map(c => `<td class="l">${c}</td>`).join('')}</tr>${Array.from({ length: n }, (_, i) => `<tr>${cols.map((c, j) => `<td style="height:22px">${j === 0 ? i + 1 : ''}</td>`).join('')}</tr>`).join('')}</table>`;
  if (id === 'autoeval') {
    const P = [['Comando de incidentes', '¿Tenemos un comando de incidentes con puestos designados, fichas de acción propias y al menos dos personas entrenadas por puesto clave, incluido quien comanda (y la cadena de sucesión para decidir una evacuación)?'],
      ['Ejercicios y mejora', '¿Hicimos al menos un ejercicio (de mesa, funcional o a escala completa) en los últimos 12 meses, con informe posterior y plan de mejora implementado?'],
      ['Recursos críticos', '¿Sabemos cuántas horas funciona el establecimiento si fallan a la vez energía, agua y sistemas, y tenemos acuerdos de reabastecimiento formalizados?'],
      ['Acuerdos de derivación', '¿Tenemos acuerdos vigentes con al menos dos establecimientos receptores por tipo de paciente y con el sistema de emergencias, verificados en el último año?'],
      ['Compromiso directivo', '¿La conducción, y no solo quien coordina emergencias, conoce el plan, participó de un ejercicio y asigna recursos reales?']];
    return `<section class="hoja">${encV}<div class="kick">AUTOEVALUACIÓN DE LA CONDUCCIÓN · ¿ESTÁ PREPARADO EL ESTABLECIMIENTO?</div>
      <table class="reg">${fila('Establecimiento')}${fila('Completaron (nombres y cargos)')}<tr><td class="l">Fecha</td><td>___/___/______</td></tr></table>
      <table class="reg" style="margin-top:8px"><tr><td class="l">Tema</td><td class="l">Pregunta</td><td class="l">Sí</td><td class="l">No</td><td class="l">No sé</td><td class="l">Qué falta y quién se ocupa</td></tr>
      ${P.map(p => `<tr><td style="width:18%"><b>${E(p[0])}</b></td><td>${E(p[1])}</td><td style="width:6%">${cas('')}</td><td style="width:6%">${cas('')}</td><td style="width:7%">${cas('')}</td><td style="width:26%;height:48px"></td></tr>`).join('')}</table>
      <p style="font-size:8pt;color:#4B5B73;margin-top:6px"><b>Un «No sé» es tan grave como un «No»:</b> si la conducción no lo sabe, no está operativo. Cada «No» o «No sé» se pasa al registro de acuerdos y seguimiento de tareas con responsable y plazo. Adaptado de Vítolo, Planes de contingencia hospitalarios (NOBLE, 2026).</p>${pieV}</section>`;
  }
  if (id === 'aar') return `<section class="hoja">${encV}<div class="kick">INFORME POSTERIOR AL EJERCICIO O A LA EMERGENCIA Y PLAN DE MEJORA</div>
    <table class="reg">${fila('Ejercicio o emergencia')}<tr><td class="l">Tipo</td><td>${['De discusión', 'De mesa', 'Funcional', 'Integrado o a escala completa', 'Emergencia real'].map(cas).join(' ')}</td></tr><tr><td class="l">Fecha · duración</td><td>___/___/______ · ______</td></tr>${fila('Escenario y amenaza')}${fila('Participantes y organismos externos')}${fila('Objetivos que se querían comprobar', 30)}</table>
    ${h2('1. Qué funcionó bien')}<table class="reg"><tr><td style="height:50px"></td></tr></table>
    ${h2('2. Qué no funcionó y por qué')}<table class="reg"><tr><td style="height:60px"></td></tr></table>
    ${h2('3. Plan de mejora')}${grilla(['N.º', 'Brecha encontrada (plan, procedimiento, equipamiento, comunicaciones, personal o coordinación)', 'Acción correctiva', 'Responsable', 'Fecha compromiso', 'Cómo se verifica'], 7)}
    <table class="reg" style="margin-top:6px">${fila('Debriefing inmediato realizado (fecha y hora)')}${fila('Informe terminado el (recomendado: dentro de las 72 horas)')}${fila('Se compartió con')}${fila('Elaboró (nombre, cargo y firma)', 26)}</table>
    <p style="font-size:7.5pt;color:#4B5B73">El informe y el plan de mejora son el punto de partida del próximo ejercicio; el personal tiene que ver que las mejoras se implementan. Adaptado de Vítolo, Planes de contingencia hospitalarios (NOBLE, 2026).</p>${pieV}</section>`;  return '';
}
function bajarWord(nombre, cuerpo, apaisada, redVista, toast) {
  const r = redVista();
  const css = `@page Section1{size:${apaisada ? '841.9pt 595.3pt;mso-page-orientation:landscape' : '595.3pt 841.9pt'};margin:36pt 32pt 60pt;mso-footer:f1;mso-footer-margin:18pt}div.Section1{page:Section1}
    body{font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:9pt;color:#172B4D}h1{font-size:12pt;color:#8E1B1B;margin:2pt 0}h2{font-size:10pt;color:#8E1B1B;border-bottom:1.5pt solid #D32F2F;margin:8pt 0 3pt}
    .kick{font-size:7.5pt;color:#C62828;font-weight:bold;letter-spacing:1pt}table{width:100%;border-collapse:collapse}td{border:1pt solid #E9C9C6;padding:3pt 5pt;vertical-align:top;font-size:8.5pt}
    td.l{background:#FDECEA;color:#7F1D1D;font-weight:bold}.f260 td.l{width:42%}.f260 td{height:18pt}.reg td{height:22pt}.reg td.l{height:auto;font-size:7.5pt}`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${E(nombre)}</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>${css}</style></head><body><div class="Section1">${cuerpo.replace(/<img[^>]*__LOGOW__[^>]*>/g, '')}</div>
    <div style="mso-element:footer" id="f1"><p class="MsoFooter" align="center" style="text-align:center"><img src="https://hyslhmh-sudo.github.io/emergencias/logo-hysl.png" width="472" alt="HySL"></p></div></body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre + ' - ' + r.nombre + '.doc';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Descargado. Se abre con Word; para editarlo, tocá «Habilitar edición».');
}

global.EVAC_COMUN = { OPC, MODELOS, PRIOR, MADUREZ, campoHTML, tarjetaHTML, tarjetasHTML, madurezHTML, vitoloHTML, bajarWord };
})(window);
