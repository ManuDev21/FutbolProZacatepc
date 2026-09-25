/**
 * Genera src/data/exercises.json con +1,000 ejercicios a partir de
 * plantillas curadas × variantes de edad/dificultad/duración.
 * Ejecutar: node scripts/generate-exercises.mjs
 */
import { writeFileSync } from 'node:fs';

/** Plantillas base: [nombre, area, objetivo, tags, jugadoresMin, jugadoresMax, materiales, desc] */
const TEMPLATES = [
  ['Rondo %dv%d', 'tecnica', 'Posesión y presión tras pérdida', ['posesion', 'tecnica'], 4, 8, ['conos', 'petos'], 'Rondo en espacio reducido. Los defensores roban y cambian de rol.'],
  ['Circuito de conducción y pase', 'tecnica', 'Control orientado y primer toque', ['tecnica', 'coordinacion'], 4, 12, ['conos', 'balones'], 'Recorrido con conducción, pase al compañero y recepción en movimiento.'],
  ['Paredes en tríos', 'tecnica', 'Juego de apoyo a uno-dos toques', ['tecnica', 'posesion'], 6, 12, ['conos', 'balones'], 'Combinaciones de pared en rombos con rotación de posiciones.'],
  ['Control aéreo y remate', 'tecnica', 'Recepción de balones elevados', ['tecnica', 'finalizacion'], 4, 10, ['balones', 'conos'], 'Servicio aéreo, control con diferentes superficies y definición.'],
  ['Juego de posición %d+%d vs %d', 'tactica', 'Superioridades y transiciones', ['posesion', 'tactica'], 6, 14, ['petos', 'conos'], 'Posesión con comodines, cambio de rol tras recuperación.'],
  ['Salida de balón desde defensa', 'tactica', 'Construcción desde atrás', ['tactica', 'posesion'], 7, 11, ['petos', 'balones'], 'Patrones de salida limpia ante presión alta.'],
  ['Presión alta coordinada', 'tactica', 'Robo en campo rival', ['tactica', 'fisico'], 7, 11, ['petos'], 'Disparadores de presión: pase atrás, control malo, banda.'],
  ['Transición defensa-ataque', 'tactica', 'Contraataque en 8 segundos', ['tactica', 'velocidad'], 8, 14, ['petos', 'porterias'], 'Recuperación y ataque rápido a porterías.'],
  ['Repliegue y coberturas', 'tactica', 'Orden defensivo tras pérdida', ['tactica'], 8, 14, ['petos'], 'Timing de repliegue, cobertura y balance defensivo.'],
  ['Finalización a un toque', 'tecnica', 'Definición sin control previo', ['finalizacion', 'tecnica'], 5, 10, ['balones', 'porteria'], 'Centrales laterales y remate de primera intención.'],
  ['Duelo 1v1 a portería', 'tecnica', 'Regate y definición', ['tecnica', 'finalizacion'], 4, 12, ['porteria', 'conos'], 'Situaciones de superioridad individual con portero.'],
  ['Duelo 2v2 con comodines', 'tactica', 'Apoyos y desmarques', ['tactica', 'posesion'], 6, 10, ['petos', 'mini porterias'], 'Igualdad numérica con apoyos exteriores.'],
  ['Escalera de velocidad', 'fisico', 'Frecuencia de apoyo', ['velocidad', 'coordinacion'], 4, 16, ['escalera', 'conos'], 'Patrones de pies rápidos en escalera de coordinación.'],
  ['Sprint con cambio de dirección', 'fisico', 'Aceleración y frenado', ['velocidad', 'fisico'], 4, 16, ['conos'], 'Traslados cortos con cambios de dirección reactivos.'],
  ['Circuito de fuerza funcional', 'fisico', 'Fuerza general sin material', ['fisico'], 6, 16, ['conos'], 'Estaciones: sentadillas, zancadas, planchas, saltos.'],
  ['Juego con peso del balón', 'fisico', 'Resistencia específica', ['fisico', 'posesion'], 8, 14, ['petos'], 'Posesión continua por series con descansos controlados.'],
  ['Yo-yo intermitente corto', 'fisico', 'Resistencia intermitente', ['fisico', 'velocidad'], 6, 20, ['conos'], 'Shuttles de 10-20 m con recuperación activa.'],
  ['Reacción y persecución', 'fisico', 'Tiempo de reacción', ['velocidad', 'coordinacion'], 4, 12, ['conos'], 'Salidas reactivas a señal visual/auditiva.'],
  ['Salida del portero y blocaje', 'porteros', 'Técnica de blocaje', ['porteros', 'tecnica'], 2, 6, ['balones', 'porteria'], 'Secuencia de colocación, salida y blocaje seguro.'],
  ['Juego de pies del portero', 'porteros', 'Primer pase del portero', ['porteros', 'tecnica'], 2, 6, ['balones', 'conos'], 'Recepción y distribución corta/larga con ambos pies.'],
  ['Estiradas y desplazamientos', 'porteros', 'Desplazamiento lateral y vuelo', ['porteros', 'fisico'], 2, 6, ['porteria', 'balones'], 'Desplazamiento por arco y estirada a ambos lados.'],
  ['Balón parado: córner ofensivo', 'tactica', 'Rutinas de córner', ['tactica', 'finalizacion'], 8, 14, ['conos', 'balones'], 'Movimientos de bloqueo, desmarque y remate.'],
  ['Balón parado: tiro libre', 'tactica', 'Ejecución de tiro libre', ['tactica', 'finalizacion'], 6, 12, ['balones', 'barrera'], 'Distancias, barreras y ejecuciones directas/indirectas.'],
  ['Defensa de área: centrales', 'tactica', 'Marcaje y rechace', ['tactica'], 7, 12, ['petos', 'balones'], 'Centros laterales con marcaje zonal e individual mixto.'],
  ['Pase largo y cambio de orientación', 'tecnica', 'Conducción del juego', ['tecnica', 'tactica'], 6, 14, ['balones', 'conos'], 'Cambios de orientación a zonas objetivo.'],
  ['Recepción entre líneas', 'tactica', 'Perfilarse de espaldas', ['tactica', 'tecnica'], 6, 12, ['conos', 'petos'], 'Recepción perfilada entre líneas rivales.'],
  ['Mini juego 3v3 intenso', 'tactica', 'Toma de decisiones', ['tactica', 'tecnica'], 6, 9, ['petos', 'mini porterias'], 'Espacios reducidos, máximo 2 toques.'],
  ['Oleada de ataque %dv%d', 'tactica', 'Finalizar superioridades', ['tactica', 'finalizacion'], 6, 12, ['porteria', 'petos'], 'Oleadas de superioridad numérica hacia portería.'],
  ['Calentamiento con balón', 'fisico', 'Activación general', ['coordinacion', 'tecnica'], 6, 20, ['balones', 'conos'], 'Movilidad dinámica integrando conducción y pases.'],
  ['Vuelta a la calma', 'fisico', 'Recuperación y estiramiento', ['fisico'], 6, 20, [], 'Trote suave, respiración y estiramientos estáticos.'],
];

const VARIANTS = [
  { suffix: 'Iniciación', minAge: 4, maxAge: 8, difficulty: 1, mul: 0.8 },
  { suffix: 'Básico', minAge: 6, maxAge: 10, difficulty: 2, mul: 0.9 },
  { suffix: 'Base', minAge: 8, maxAge: 13, difficulty: 3, mul: 1 },
  { suffix: 'Intermedio', minAge: 10, maxAge: 15, difficulty: 3, mul: 1 },
  { suffix: 'Avanzado', minAge: 12, maxAge: 17, difficulty: 4, mul: 1.15 },
  { suffix: 'Competitivo', minAge: 14, maxAge: 19, difficulty: 5, mul: 1.25 },
];

const INTENSITIES = [
  { name: 'Espacio reducido', note: 'Se juega en espacio reducido para forzar velocidad de ejecución.', mul: 0.8 },
  { name: 'Espacio amplio', note: 'Espacio amplio para favorecer desplazamientos largos.', mul: 1.1 },
  { name: 'A 2 toques', note: 'Máximo dos toques por jugador.', mul: 1 },
  { name: 'Toque libre', note: 'Toques libres según la situación.', mul: 1 },
  { name: 'Con marcaje', note: 'Presión defensiva activa en todo momento.', mul: 1 },
  { name: 'Serie corta', note: 'Series cortas de alta intensidad con rotación rápida.', mul: 0.7 },
  { name: 'Serie larga', note: 'Serie larga orientada a continuidad y volumen.', mul: 1.3 },
];

const rnd = (() => {
  let s = 42;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
})();

const exercises = [];
let n = 0;
const nextCode = () => `EX-${String(++n).padStart(4, '0')}`;

for (const [name, area, objective, tags, pMin, pMax, materials, desc] of TEMPLATES) {
  for (const v of VARIANTS) {
    for (const it of INTENSITIES) {
      const resolved = name
        .replace('%dv%d', `${pMin % 5 || 4}v${(pMin % 5 || 4) - 2}`)
        .replace('%d+%d vs %d', '4+2 vs 2');
      const duration = Math.max(5, Math.round((10 + rnd() * 15) * v.mul * it.mul));
      exercises.push({
        code: nextCode(),
        name: `${resolved}`,
        variant: `${v.suffix} · ${it.name}`,
        description: `${desc} Variante ${v.suffix.toLowerCase()}. ${it.note}`,
        area,
        minAge: v.minAge,
        maxAge: v.maxAge,
        difficulty: v.difficulty,
        objective,
        durationMin: duration,
        playersMin: pMin,
        playersMax: pMax,
        materials,
        tags,
      });
    }
  }
}

writeFileSync(
  new URL('../src/data/exercises.json', import.meta.url),
  JSON.stringify(exercises, null, 0),
);
console.log(`Generados ${exercises.length} ejercicios en src/data/exercises.json`);
