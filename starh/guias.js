/* Guías de llenado (versión 0) · las usan phr.html, ish.html e imprimir.html
 * PHR: OPS. Instructivo para elaborar un plan hospitalario de respuesta a emergencias de salud y desastres (OPS/PHE/CPI/23-0015), 2023.
 * ISH: OPS/OMS. Índice de seguridad hospitalaria. Guía para evaluadores, 2.ª ed., 2018.
 */
(function (global) {
  'use strict';

  /* ---------- PHR: recordatorio por sección ---------- */
  const PHR_GUIA = {
    A: { que: 'Si el establecimiento tiene una organización estable para la gestión de emergencias: programa, comité, evaluación del riesgo, sistema de gestión de incidentes y brigadas (instructivo, punto 1).',
         pedir: 'Disposición de creación del comité con nómina, términos de referencia, actas de los últimos meses, informes STAR-H e ISH, nómina y capacitación de brigadas.',
         c: 'Hay acto formal de la Dirección, está vigente y las actas o registros muestran que funciona.',
         p: 'Existe pero sin acto formal, sin reuniones regulares, con nómina desactualizada o sin capacitación registrada.',
         nc: 'No hay comité, programa ni brigadas, o nadie puede mostrar un documento.' },
    B: { que: 'Si existe el plan de respuesta multiamenaza y su ciclo de vida: aprobación, difusión, prueba y actualización, más los planes específicos, de continuidad y de recuperación (punto 1.4).',
         pedir: 'El plan firmado, fecha de la última versión, control de cambios, registros de difusión, informe del último simulacro, planes específicos de las amenazas altas de STAR-H.',
         c: 'El plan está escrito, aprobado, difundido, probado en el último año y actualizado.',
         p: 'Hay un plan pero falta alguno de esos pasos (sin firma, sin difundir, sin simulacro o con más de un año sin revisar).',
         nc: 'No hay plan escrito, o el que hay no corresponde al establecimiento.' },
    C: { que: 'Si el centro de operaciones de emergencia (COE) está previsto y equipado: procedimiento, lugar seguro, sala, alternativo y equipamiento (punto 1.5).',
         pedir: 'Procedimiento del COE con titular y alterno, recorrer el lugar previsto y el alternativo, inventario de comunicaciones, planos, formularios y suministros.',
         c: 'El lugar está definido, se puede habilitar ya y tiene el equipamiento verificado.',
         p: 'Hay un lugar pensado pero sin procedimiento, sin alterno o con equipamiento incompleto.',
         nc: 'No hay COE previsto.' },
    D: { que: 'Si el plan tiene los componentes generales: información del establecimiento, normativa, propósito, alcance, situación (amenazas, vulnerabilidades, capacidades), escenarios y objetivos (punto 2.1 a 2.6).',
         pedir: 'El índice del plan y cada capítulo. Comparar la situación descripta con los resultados de STAR-H y del ISH.',
         c: 'El capítulo está y su contenido es actual y propio del establecimiento.',
         p: 'El capítulo está pero incompleto, genérico (copiado de otro plan) o desactualizado.',
         nc: 'El capítulo no está en el plan, o no hay plan.' },
    E: { que: 'Cómo se organiza la respuesta: estructura de comando con titulares y alternos, responsables por horario, notificación y verificación, niveles de alerta, escalamiento, activación y desactivación, y línea de tiempo (punto 2.7).',
         pedir: 'Organigrama de comando, cuadro de guardias pasivas, tarjetas de acción, procedimiento de notificación, criterios de niveles 1-2-3 y de activación, códigos de emergencia.',
         c: 'Está escrito, con nombres o cargos concretos y vigentes, y el personal clave lo conoce.',
         p: 'Está escrito pero sin alternos, sin cubrir días no hábiles, sin criterios claros o desactualizado.',
         nc: 'No está definido o depende de una persona sin respaldo escrito.' },
    F: { que: 'Si hay acuerdos con la red de servicios de salud (referencia y contrarreferencia) y con organismos externos (Protección Civil, bomberos, policía, emergencias, proveedores) y si se probaron (punto 2.8).',
         pedir: 'Convenios, protocolos o notas firmadas, cartera de servicios difundida, registros de ejercicios con la red o con otros organismos.',
         c: 'El acuerdo está formalizado, vigente y se probó en el último año.',
         p: 'Hay acuerdo informal o sin firma, o formal pero nunca probado o vencido.',
         nc: 'No hay acuerdo.' },
    G: { que: 'Si existen los procedimientos operativos que el plan necesita para responder: COE, comunicación, seguridad, información de pacientes, triaje, traslados, infecciones, apoyo psicosocial, post mórtem, evacuación, expansión, transporte, alimentos y agua, personal (punto 2.9).',
         pedir: 'Cada procedimiento por escrito, con fecha y aprobación. Para evacuación, los planos y el último simulacro.',
         c: 'El procedimiento está escrito, aprobado, vigente y se conoce en el servicio que lo aplica.',
         p: 'Está en borrador, desactualizado, sin aprobar o solo lo conoce una persona.',
         nc: 'No existe por escrito.' },
    H: { que: 'Si están los documentos de apoyo: tarjetas de instrucciones, directorio del personal, directorio de partes externas y cadena de llamadas (punto 2.10).',
         pedir: 'Las tarjetas y el registro de entrega, los directorios con fecha de actualización, la cadena de llamadas vigente.',
         c: 'Existen, están actualizados en los últimos 6 meses y están disponibles donde se usan.',
         p: 'Existen pero con datos viejos, incompletos o guardados donde no se encuentran rápido.',
         nc: 'No existen.' },
    I: { que: 'Qué tan listo está el establecimiento ante una emergencia inminente (temporada El Niño): revisión rápida del plan, difusión, disponibilidad del comando, pruebas de comunicaciones y recursos (punto 3, cuadro 1).',
         pedir: 'Registros de lo hecho en las últimas semanas: reunión de revisión, difusión, prueba de cadena de llamadas, verificación del COE y de recursos, comunicaciones con la red.',
         c: 'La acción se hizo y hay registro (acta, planilla, mensaje con fecha).',
         p: 'Se hizo en parte o sin registro.',
         nc: 'No se hizo.' }
  };
  const PHR_GENERAL = [
    'Lo que no se puede mostrar se registra como si no existiera: pedir siempre el documento o el registro.',
    'Ante la duda entre dos estados, elegir el más bajo y anotar el motivo en «Brecha».',
    '«No aplica» solo si el ítem no corresponde por el tipo o la complejidad del establecimiento; no cuenta para el cálculo.',
    'En «Evidencia» anotar nombre del documento, fecha y quién lo aprobó; en «Brecha», qué falta para cumplir.'
  ];

  /* ---------- ISH: recordatorio por módulo y cómo calificar ---------- */
  const ISH_GUIA = {
    general: [
      'Cada ítem se califica en tres niveles de seguridad: Bajo, Medio o Alto, según la descripción que da la Guía para evaluadores (OPS/OMS, 2018) para ese ítem.',
      'Ante la duda entre dos niveles, asignar el más bajo (lo indica la guía) y anotar el motivo.',
      'Si un ítem no se puede evaluar o no corresponde, dejarlo «No evaluado»: no entra en el cálculo y se ajusta el denominador.',
      'Recorrer el edificio con el equipo del hospital (mantenimiento, ingeniería, Enfermería, comité de emergencias). Lo que no se puede ver o documentar no se califica como Alto.',
      'El módulo 1 (amenazas y suelo) no suma puntaje: sirve para saber frente a qué tiene que estar preparado el hospital y orienta la evaluación de los otros módulos.'
    ],
    niveles: {
      'Bajo': 'El elemento no existe, está muy dañado o en mal estado, o no funcionaría durante o después de una emergencia. Seguridad insuficiente.',
      'Medio': 'Existe y funciona en condiciones normales pero con fallas o deterioro que pueden comprometer su funcionamiento en una emergencia, o no está completo.',
      'Alto': 'Existe, está en buen estado, cumple su función y es probable que siga funcionando durante y después de una emergencia o desastre.'
    },
    modulos: {
      '1': 'Amenazas que pueden afectar al hospital y propiedades geotécnicas del suelo. Para cada amenaza: nivel (no existe, bajo, medio, alto) y si el hospital debe prepararse. No suma puntaje.',
      '2': 'Seguridad estructural: antecedentes de daños, normas de construcción, remodelaciones, diseño, estado y materiales, redundancia, conexiones, cimientos, regularidad y techos. Conviene que lo evalúe un profesional de ingeniería o arquitectura.',
      '3': 'Seguridad no estructural: elementos arquitectónicos, accesos y seguridad física, sistemas críticos (electricidad, telecomunicaciones, agua, incendio, residuos, combustible, gases medicinales, climatización) y equipamiento médico y de oficina. Mirar fijaciones, anclajes, respaldo y mantenimiento.',
      '4': 'Gestión de emergencias y desastres: comité, plan de respuesta, comunicaciones, recursos humanos, logística, continuidad de la atención y evacuación. Se apoya en el relevamiento PHR del mismo hospital.'
    },
    // Categorías de seguridad del hospital (Guía para evaluadores, 2018)
    categorias: [
      { cat: 'A', min: 0.66, max: 1, texto: 'Es probable que el hospital siga funcionando durante y después de emergencias y desastres. Se recomienda seguir mejorando la capacidad de respuesta y aplicar medidas de seguridad a corto y mediano plazo.' },
      { cat: 'B', min: 0.36, max: 0.65, texto: 'Se necesitan intervenciones a corto plazo: los niveles actuales de seguridad ponen en riesgo a pacientes y personal y el funcionamiento durante y después de una emergencia.' },
      { cat: 'C', min: 0, max: 0.35, texto: 'Se necesitan intervenciones urgentes: es improbable que el hospital funcione durante y después de una emergencia y la seguridad actual no alcanza para proteger la vida de pacientes y personal.' }
    ]
  };
  function ishCategoria(v) {
    if (v == null || isNaN(v)) return null;
    return v >= 0.655 ? ISH_GUIA.categorias[0] : v >= 0.355 ? ISH_GUIA.categorias[1] : ISH_GUIA.categorias[2];
  }

  global.GUIAS = { PHR_GUIA, PHR_GENERAL, ISH_GUIA, ishCategoria };
})(window);

/* ---------- ISH: cálculo (mismo criterio que la hoja TABLERO de la planilla) ---------- */
(function (global) {
  function ishCalcular(r, codigo) {
    const est = r.establecimientos.find(e => e.codigo === codigo) || {};
    const P = r.pesos || { valores: { Bajo: 0, Medio: 0.5, Alto: 1 }, modelos: {}, sub: {} };
    const val = P.valores || { Bajo: 0, Medio: 0.5, Alto: 1 };
    const l = r.relevamiento.filter(x => x.codigo === codigo);
    const acc = {}; let evaluados = 0;
    l.forEach(x => {
      if (!x.nivel || x.nivel === 'No evaluado' || !(x.nivel in val)) return;
      evaluados++;
      const w = r.pesoItem && r.pesoItem[x.n] != null ? Number(r.pesoItem[x.n]) : 1;
      const a = acc[x.sub] || (acc[x.sub] = [0, 0]); a[0] += val[x.nivel] * w; a[1] += w;
    });
    const sub = {}; Object.keys(acc).forEach(k => sub[k] = acc[k][1] ? acc[k][0] / acc[k][1] : null);
    const mod = {};
    ['2', '3', '4'].forEach(m => {
      let s = 0, w = 0;
      Object.keys(sub).filter(k => k.charAt(0) === m && sub[k] != null).forEach(k => { const pw = P.sub && P.sub[k] != null ? Number(P.sub[k]) : 1; s += sub[k] * pw; w += pw; });
      mod[m] = w ? s / w : null;
    });
    const mw = (P.modelos && (P.modelos[est.modelo] || P.modelos['Modelo 1'])) || { '2': 0.5, '3': 0.3, '4': 0.2 };
    const completo = mod['2'] != null && mod['3'] != null && mod['4'] != null;
    const indice = completo ? mod['2'] * mw['2'] + mod['3'] * mw['3'] + mod['4'] * mw['4'] : null;
    return { sub, mod, indice, categoria: global.GUIAS.ishCategoria(indice), evaluados, total: l.length, pesosModelo: mw };
  }
  global.GUIAS.ishCalcular = ishCalcular;
  global.GUIAS.fmt2 = v => v == null || isNaN(v) ? 's/d' : (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
  global.GUIAS.colorValor = v => v == null ? '#EEF2F7' : v >= 0.655 ? '#C8E6C9' : v >= 0.355 ? '#FFF3C4' : '#FFD8B0';
})(window);
