// Planificador de ruta: de país, días, mes y animales a un circuito de parques con noches y traslados. Todo en el
// navegador con el índice mundial y las observaciones de cada especie (/especies.json). Las distancias son en
// línea recta corregidas (×1,3 por carretera) y las velocidades, las de pistas africanas: es una primera
// aproximación para saber si un viaje es realista, no un itinerario cerrado.
import { buenaEpoca, type FilaIndice } from "@/features/safaris/modelo";
import { distanciaKm } from "@/lib/fechas";

export type Ritmo = "tranquilo" | "normal" | "intenso";

/** noches por parque según el ritmo */
export const NOCHES_RITMO: Record<Ritmo, number> = { tranquilo: 4, normal: 3, intenso: 2 };

const FACTOR_CARRETERA = 1.3;
const KMH = 50;
/** a partir de aquí conviene volar (avioneta o vuelo interno) */
const MAX_HORAS_CARRETERA = 6;
/** parques más cerca que esto (o uno dentro del otro) se cuentan como el mismo destino */
const MIN_KM_ENTRE = 40;
const MAX_PARQUES = 6;
/** distancia al circuito a la que un parque vale la mitad */
const KM_MITAD = 800;

export interface Etapa {
  f: FilaIndice;
  noches: number;
  enEpoca: boolean | null;
  /** especies elegidas que se ven allí */
  especies: number[];
  /** traslado desde la etapa anterior */
  traslado: { km: number; horas: number; volar: boolean } | null;
}

export interface Plan {
  etapas: Etapa[];
  avisos: string[];
  sinCubrir: number[];
  horasCarretera: number;
}

export function traslado(a: FilaIndice, b: FilaIndice) {
  const km = Math.round(distanciaKm({ lat: a.la, lon: a.lo }, { lat: b.la, lon: b.lo }) * FACTOR_CARRETERA);
  const horas = Math.round((km / KMH) * 2) / 2;
  return { km, horas, volar: horas > MAX_HORAS_CARRETERA };
}

/** Recorrido más corto por vecino más próximo, probando cada parque como inicio (bastan ≤ 6 parques). */
export function ordenarRuta(parques: FilaIndice[]): FilaIndice[] {
  let mejor = parques;
  let mejorKm = Infinity;
  for (const inicio of parques) {
    const ruta = [inicio];
    const quedan = parques.filter((p) => p !== inicio);
    let km = 0;
    while (quedan.length) {
      const ult = ruta[ruta.length - 1];
      quedan.sort((a, b) => traslado(ult, a).km - traslado(ult, b).km);
      km += traslado(ult, quedan[0]).km;
      ruta.push(quedan.shift()!);
    }
    if (km < mejorKm) [mejor, mejorKm] = [ruta, km];
  }
  return mejor;
}

export function planificar({
  indice,
  observaciones,
  pais,
  dias,
  mes,
  especies,
  ritmo,
}: {
  indice: FilaIndice[];
  /** clave de especie → id del parque → facilidad 0-1 */
  observaciones: Map<number, Map<string, number>>;
  pais: string;
  dias: number;
  /** 0-11 */
  mes: number;
  especies: number[];
  ritmo: Ritmo;
}): Plan {
  const noches = Math.max(1, dias - 1);
  const n = Math.max(1, Math.min(MAX_PARQUES, Math.round(noches / NOCHES_RITMO[ritmo])));
  const delPais = indice.filter((f) => f.p === pais && f.s > 0);
  // fuera los contenedores (reservas de la biosfera, áreas de conservación que engloban parques): si dentro hay
  // un parque más pequeño con interés parecido, el destino real es ese. Los destacados del catálogo nunca: el
  // Masái Mara o Kruger contienen reservas privadas pequeñas (Olare Orok, Sabi Sand) y son el destino
  const candidatos = delPais.filter(
    (g) =>
      g.d ||
      !delPais.some(
        (f) =>
          f !== g &&
          f.r * 2 < g.r &&
          f.s >= g.s * 0.3 &&
          distanciaKm({ lat: g.la, lon: g.lo }, { lat: f.la, lon: f.lo }) < g.r,
      ),
  );
  const maxS = Math.max(1, ...candidatos.map((f) => f.s));
  const epoca = (f: FilaIndice) => {
    const e = buenaEpoca(f);
    return e ? e.includes(mes + 1) : null;
  };
  // fuera de los 80 mejores parques del mundo de la especie, si el índice dice que se ve, algo cuenta
  const facil = (k: number, f: FilaIndice) => observaciones.get(k)?.get(f.id) ?? (f.e.includes(k) ? 0.1 : 0);
  // los destacados (elegidos a mano por ser destinos de safari de verdad) pesan algo más
  const base = (f: FilaIndice) =>
    (Math.log1p(f.s) / Math.log1p(maxS)) * (epoca(f) === false ? 0.6 : 1) * (f.d ? 1.15 : 1);

  // voraz: en cada paso, el parque que más aporta (su interés + las especies elegidas que aún faltan)
  const elegidos: FilaIndice[] = [];
  const cubiertas = new Set<number>();
  while (elegidos.length < n) {
    let mejor: FilaIndice | null = null;
    let mejorValor = 0;
    for (const f of candidatos) {
      if (elegidos.includes(f)) continue;
      const solapa = elegidos.some((e) => {
        const d = distanciaKm({ lat: e.la, lon: e.lo }, { lat: f.la, lon: f.lo });
        return d < MIN_KM_ENTRE || d < Math.max(e.r, f.r) * 0.7;
      });
      if (solapa) continue;
      let valor = base(f);
      for (const k of especies) if (!cubiertas.has(k)) valor += 2 * facil(k, f);
      // circuitos compactos: cuanto más lejos del parque elegido más cercano, menos vale (a 800 km, la mitad)
      if (elegidos.length) {
        const cerca = Math.min(...elegidos.map((e) => distanciaKm({ lat: e.la, lon: e.lo }, { lat: f.la, lon: f.lo })));
        valor /= 1 + cerca / KM_MITAD;
      }
      if (valor > mejorValor) [mejor, mejorValor] = [f, valor];
    }
    if (!mejor) break;
    elegidos.push(mejor);
    for (const k of especies) if (facil(k, mejor) > 0) cubiertas.add(k);
  }

  const ruta = ordenarRuta(elegidos);
  // noches: el mínimo del ritmo a cada uno y el resto a los de más interés
  const minimo = Math.min(NOCHES_RITMO[ritmo] - 1, Math.floor(noches / Math.max(1, ruta.length)));
  const reparto = ruta.map(() => Math.max(1, minimo));
  let sobran = noches - reparto.reduce((a, b) => a + b, 0);
  const porInteres = ruta.map((f, i) => [i, base(f)] as const).sort((a, b) => b[1] - a[1]);
  for (let i = 0; sobran > 0; i = (i + 1) % ruta.length, sobran--) reparto[porInteres[i][0]]++;

  const etapas: Etapa[] = ruta.map((f, i) => ({
    f,
    noches: reparto[i],
    enEpoca: epoca(f),
    especies: especies.filter((k) => facil(k, f) > 0),
    traslado: i ? traslado(ruta[i - 1], f) : null,
  }));

  const avisos: string[] = [];
  const horasCarretera = etapas.reduce((a, e) => a + (e.traslado && !e.traslado.volar ? e.traslado.horas : 0), 0);
  if (!candidatos.length) avisos.push("No hay parques con fauna registrada en ese país.");
  if (etapas.some((e) => e.noches < 2))
    avisos.push(
      "Alguna parada tiene una sola noche: con los traslados apenas queda un safari. Quita un parque o añade días.",
    );
  if (horasCarretera > noches * 2.5)
    avisos.push(
      `Unas ${horasCarretera} h de carretera en ${dias} días: es mucho tiempo en el coche. Mejor menos parques o vuelos internos.`,
    );
  if (etapas.some((e) => e.traslado?.volar))
    avisos.push("Hay traslados de más de 6 h por carretera: en safari se suelen hacer en avioneta o vuelo interno.");
  const fuera = etapas.filter((e) => e.enEpoca === false);
  if (fuera.length) avisos.push(`${fuera.map((e) => e.f.n).join(", ")}: no es su mejor época ese mes.`);
  return { etapas, avisos, sinCubrir: especies.filter((k) => !cubiertas.has(k)), horasCarretera };
}

/** Facilidad 0-1 de cada especie en cada parque (raíz de las observaciones frente al mejor parque). */
export function facilidades(parques: Record<string, [string, number][]>): Map<number, Map<string, number>> {
  const salida = new Map<number, Map<string, number>>();
  for (const [clave, lista] of Object.entries(parques)) {
    const max = lista[0]?.[1] ?? 1;
    salida.set(Number(clave), new Map(lista.map(([id, n]) => [id, Math.sqrt(n / max)])));
  }
  return salida;
}
