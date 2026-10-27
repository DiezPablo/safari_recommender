// Planificador de ruta: de país, noches, mes, ritmo y animales a un circuito con noches, traslados y avisos, como
// lo haría un operador. Todo en el navegador con el índice mundial, las observaciones de cada especie y su
// frecuencia por mes (/especies.json) y lo que merece cada parque (estancias.ts).
//
// Cómo decide (voraz, noche a noche):
// - Cada noche en un parque vale su interés ese mes (puntuación, temporada y frecuencia de avistamientos de sus
//   especies estrella ese mes) hasta su estancia ideal; por encima de la ideal mucho menos y por encima del
//   máximo casi nada: el Ngorongoro se recorre en un día, el Serengeti pide tres noches.
// - Añadir un parque cuesta (el traslado y medio día de cambio) y obliga a sus noches mínimas.
// - En cada paso se elige lo que más aporta por noche: alargar un parque o añadir otro.
// - La ruta empieza y acaba en la ciudad de entrada (Arusha, Nairobi, Maun…) y es la más corta; los tramos de
//   más de 6 h por carretera se proponen en avioneta.
// Las distancias son en línea recta ×1,3 a 50 km/h (pistas): una primera aproximación, no un itinerario cerrado.
import { buenaEpoca, esDestino, type FilaIndice } from "@/features/safaris/modelo";
import { CIUDADES, ENTRADA_PAIS, estanciaDe, type Estancia } from "@/features/safaris/estancias";
import { distanciaKm } from "@/lib/fechas";
import { EDAD_MINIMA, SIN_MALARIA } from "@/features/safaris/familias";

export type Ritmo = "tranquilo" | "normal" | "intenso";

export const RITMOS: Ritmo[] = ["tranquilo", "normal", "intenso"];

const FACTOR_CARRETERA = 1.3;
const KMH = 50;
/** carreteras asfaltadas o pistas buenas: en el sur de África se va mucho más rápido que en el este */
const KMH_PAIS: Record<string, number> = { Sudáfrica: 90, Namibia: 85, Botsuana: 70 };
let kmhActual = KMH;
/** a partir de aquí conviene volar (avioneta o vuelo interno) */
const MAX_HORAS_CARRETERA = 6.5;
/** parques más cerca que esto (o uno dentro del otro) se cuentan como el mismo destino */
const MIN_KM_ENTRE = 40;
/** coste de cambiar de parque (en «noches de interés»): con ritmo tranquilo, menos parques */
const COSTE_CAMBIO: Record<Ritmo, number> = { tranquilo: 0.5, normal: 0.25, intenso: 0.1 };
/** horas de día perdidas que equivalen a una noche de interés */
const HORAS_POR_NOCHE = 8;
/** horas de día que se pierden en un vuelo interno (traslado al aeródromo, esperas, vuelo) */
const HORAS_VUELO = 3;
/** además del tiempo, cada vuelo interno cuesta dinero y logística (en «noches de interés») */
const COSTE_VUELO = 0.3;
/** donde el safari en avioneta entre campamentos es lo normal, volar penaliza menos */
const COSTE_VUELO_PAIS: Record<string, number> = { Botsuana: 0.1, Zambia: 0.15, Zimbabue: 0.15 };
let costeVueloActual = COSTE_VUELO;
/** horas de un traslado entre parques que no cuentan: el camino también es safari (Ngorongoro → Serengeti) */
const HORAS_LIBRES_TRASLADO = 2;
/** un parque de otro circuito (Ruaha entra por Dar es Salaam, no por Arusha): otra logística y otro vuelo */
const COSTE_OTRO_CIRCUITO = 0.5;
/** un parque no destacado vale como mucho esto frente a un destacado: los de al lado de la capital (Nairobi,
 * Arusha, Lusaka) tienen muchas observaciones por la gente que va, no por su fauna */
const PESO_NO_DESTACADO = 0.5;
/** valor de las noches por encima de la estancia ideal */
const VALOR_EXTRA: Record<Ritmo, number> = { tranquilo: 0.6, normal: 0.4, intenso: 0.25 };
const VALOR_SOBRANTE = 0.05;
const BONO_ESPECIE = 1.5;

export interface Tramo {
  km: number;
  horas: number;
  volar: boolean;
}

export interface Etapa {
  f: FilaIndice;
  noches: number;
  estancia: Estancia;
  enEpoca: boolean | null;
  /** especies elegidas que se ven allí */
  especies: number[];
  /** traslado desde la etapa anterior (o desde la ciudad de entrada en la primera) */
  traslado: Tramo | null;
}

export interface Plan {
  etapas: Etapa[];
  /** ciudad de entrada y salida, y el tramo de vuelta desde el último parque */
  entrada: { nombre: string; vuelta: Tramo } | null;
  avisos: string[];
  sinCubrir: number[];
  horasCarretera: number;
}

interface Punto {
  lat: number;
  lon: number;
}

function tramo(a: Punto, b: Punto): Tramo {
  const km = Math.round(distanciaKm(a, b) * FACTOR_CARRETERA);
  const horas = Math.round((km / kmhActual) * 2) / 2;
  return { km, horas, volar: horas > MAX_HORAS_CARRETERA };
}

const punto = (f: FilaIndice): Punto => ({ lat: f.la, lon: f.lo });

export function traslado(a: FilaIndice, b: FilaIndice): Tramo {
  return tramo(punto(a), punto(b));
}

/** Traslado con la velocidad de las carreteras del país (para quien no pasa por planificar, como Mi viaje). */
export function trasladoEn(pais: string | null | undefined, a: FilaIndice, b: FilaIndice): Tramo {
  const antes = kmhActual;
  kmhActual = (pais && KMH_PAIS[pais]) || KMH;
  const t = traslado(a, b);
  kmhActual = antes;
  return t;
}

/** Coste de un tramo en «noches de interés»: las horas de día que se pierden por encima de las libres y, si es
 * un vuelo, su precio. */
const costeTramo = (t: Tramo, libres = HORAS_LIBRES_TRASLADO) =>
  t.volar ? HORAS_VUELO / HORAS_POR_NOCHE + costeVueloActual : Math.max(0, t.horas - libres) / HORAS_POR_NOCHE;

function permutaciones<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Horas de los tramos desde y hasta la ciudad de entrada que no cuentan: el día de llegada y el de salida
 * ya son de viaje (Arusha → Tarangire, 2,5 h, no cuesta; Arusha → Serengeti, 6 h, cuesta la hora de más). */
const HORAS_LIBRES_ENTRADA = 5;

const costeEntrada = (t: Tramo) => costeTramo(t, HORAS_LIBRES_ENTRADA);

/** Coste de los traslados de una ruta (en «noches de interés»), saliendo y volviendo a la entrada si la hay. */
function costeRuta(r: FilaIndice[], entrada?: Punto): number {
  if (!r.length) return 0;
  return (
    r.slice(1).reduce((a, f, i) => a + costeTramo(traslado(r[i], f)), 0) +
    (entrada ? costeEntrada(tramo(entrada, punto(r[0]))) + costeEntrada(tramo(punto(r[r.length - 1]), entrada)) : 0)
  );
}

/** Ruta más barata saliendo y volviendo a la entrada (si la hay); con ≤ 6 parques se prueban todas. */
export function ordenarRuta(parques: FilaIndice[], entrada?: Punto): FilaIndice[] {
  if (parques.length <= 1) return parques;
  return permutaciones(parques.slice(0, 6)).reduce((a, b) => (costeRuta(b, entrada) < costeRuta(a, entrada) ? b : a));
}

/** Cuánto encarece la ruta meter un parque en su mejor hueco: el Ngorongoro está en el camino de Arusha al
 * Serengeti y no cuesta casi nada; Ruaha, en el sur, obliga a volar dos veces. */
function costeInsertar(ruta: FilaIndice[], f: FilaIndice, entrada?: Punto): number {
  const antes = costeRuta(ruta, entrada);
  let mejor = Infinity;
  for (let i = 0; i <= ruta.length; i++) {
    mejor = Math.min(mejor, costeRuta([...ruta.slice(0, i), f, ...ruta.slice(i)], entrada) - antes);
  }
  return Math.max(0, mejor);
}

/** Cuánto mejor (o peor) es este mes que la media del año para las especies estrella del parque (0,7-1,3). */
function factorMes(frecuencia: Record<string, (number | null)[]> | undefined, mes: number): number {
  if (!frecuencia) return 1;
  let mesSuma = 0;
  let mediaSuma = 0;
  for (const meses of Object.values(frecuencia)) {
    const v = meses.filter((x): x is number => x !== null);
    if (!v.length || meses[mes] === null) continue;
    mesSuma += meses[mes]!;
    mediaSuma += v.reduce((a, b) => a + b, 0) / v.length;
  }
  return mediaSuma ? Math.min(1.3, Math.max(0.7, mesSuma / mediaSuma)) : 1;
}

export function planificar({
  indice,
  observaciones,
  frecuencia = {},
  pais,
  noches,
  mes,
  especies,
  ritmo,
  conNinos = false,
}: {
  indice: FilaIndice[];
  /** clave de especie → id del parque → facilidad 0-1 */
  observaciones: Map<number, Map<string, number>>;
  /** frecuencia de avistamientos por mes en los destacados: id → clave de GBIF → ‰ por mes */
  frecuencia?: Record<string, Record<string, (number | null)[]>>;
  pais: string;
  noches: number;
  /** 0-11 */
  mes: number;
  especies: number[];
  ritmo: Ritmo;
  /** fuera los parques con edad mínima (gorilas, chimpancés) y más peso a los que no tienen malaria */
  conNinos?: boolean;
}): Plan {
  noches = Math.max(1, noches);
  kmhActual = KMH_PAIS[pais] ?? KMH;
  costeVueloActual = COSTE_VUELO_PAIS[pais] ?? COSTE_VUELO;
  const delPais = indice.filter(
    (f) => f.p === pais && f.s > 0 && esDestino(f) && !(conNinos && EDAD_MINIMA[f.id] && EDAD_MINIMA[f.id].edad > 6),
  );
  // fuera los contenedores (reservas de la biosfera, áreas de conservación que engloban parques): si dentro hay
  // un parque más pequeño con interés parecido, el destino real es ese. Los destacados del catálogo nunca: el
  // Masái Mara o Kruger contienen reservas privadas pequeñas (Olare Orok, Sabi Sand) y son el destino
  const candidatos = delPais.filter(
    (g) =>
      g.d ||
      !delPais.some((f) => f !== g && f.r * 2 < g.r && f.s >= g.s * 0.3 && distanciaKm(punto(g), punto(f)) < g.r),
  );
  const maxS = Math.max(1, ...candidatos.map((f) => f.s));
  const epoca = (f: FilaIndice) => {
    const e = buenaEpoca(f);
    return e ? e.includes(mes + 1) : null;
  };
  // fuera de los 80 mejores parques del mundo de la especie, si el índice dice que se ve, algo cuenta
  const facil = (k: number, f: FilaIndice) => observaciones.get(k)?.get(f.id) ?? (f.e.includes(k) ? 0.1 : 0);
  // interés de una noche: el valor de experto de cada destacado (estancias.ts), por su temporada y sus especies
  // ese mes; el resto, como mucho la mitad según su puntuación
  const interes = new Map(
    candidatos.map((f) => [
      f.id,
      (f.d ? (estanciaDe(f.id, f.r).valor ?? 0.8) : PESO_NO_DESTACADO * Math.sqrt(f.s / maxS)) *
        (epoca(f) === false ? 0.6 : 1) *
        (conNinos && SIN_MALARIA.has(f.id) ? 1.5 : 1) *
        factorMes(frecuencia[f.id], mes),
    ]),
  );
  const estancias = new Map(candidatos.map((f) => [f.id, estanciaDe(f.id, f.r)]));
  const valorNoche = (f: FilaIndice, k: number) => {
    const e = estancias.get(f.id)!;
    const peso = k <= e.ideal ? 1 : k <= e.max ? VALOR_EXTRA[ritmo] : VALOR_SOBRANTE;
    return interes.get(f.id)! * peso;
  };

  // reparto voraz de las noches; la entrada, la del país (o, si no la hay, la del primer parque elegido)
  let nombreEntrada: string | undefined = ENTRADA_PAIS[pais];
  let ciudad: Punto | undefined = nombreEntrada ? CIUDADES[nombreEntrada] : undefined;
  let ruta: FilaIndice[] = [];
  const elegidos: FilaIndice[] = [];
  const reparto = new Map<string, number>();
  const cubiertas = new Set<number>();
  let quedan = noches;
  while (quedan > 0) {
    let mejor: { f: FilaIndice; n: number; valor: number } | null = null;
    // alargar un parque elegido
    for (const f of elegidos) {
      const v = valorNoche(f, reparto.get(f.id)! + 1);
      if (!mejor || v > mejor.valor) mejor = { f, n: 1, valor: v };
    }
    // o añadir otro con sus noches mínimas
    for (const f of candidatos) {
      if (reparto.has(f.id)) continue;
      const solapa = elegidos.some((e) => {
        const d = distanciaKm(punto(e), punto(f));
        return d < MIN_KM_ENTRE || d < Math.max(e.r, f.r) * 0.7;
      });
      if (solapa) continue;
      const est = estancias.get(f.id)!;
      // se valora con sus noches ideales (o las que queden): el coste del cambio se reparte entre todas, como
      // haría un operador; con solo las mínimas, Chobe (1 noche) nunca compensaba el traslado
      const n = Math.min(Math.max(est.min, est.ideal), quedan);
      let valor = 0;
      for (let k = 1; k <= n; k++) valor += valorNoche(f, k);
      if (n < est.min) valor *= 0.5; // menos noches de las que pide: medio parque
      for (const k of especies) if (!cubiertas.has(k)) valor += BONO_ESPECIE * facil(k, f);
      // el traslado que añade (en el primero, la ida y vuelta desde la ciudad de entrada) y el cambio de parque
      valor -=
        costeInsertar(ruta, f, ciudad) +
        (elegidos.length ? COSTE_CAMBIO[ritmo] : 0) +
        (nombreEntrada && est.entrada && est.entrada !== nombreEntrada ? COSTE_OTRO_CIRCUITO : 0);
      if (!mejor || valor / n > mejor.valor) mejor = { f, n, valor: valor / n };
    }
    if (!mejor) break;
    if (!reparto.has(mejor.f.id)) {
      elegidos.push(mejor.f);
      for (const k of especies) if (facil(k, mejor.f) > 0) cubiertas.add(k);
      if (elegidos.length === 1 && !ciudad) {
        nombreEntrada = estancias.get(mejor.f.id)!.entrada;
        ciudad = nombreEntrada ? CIUDADES[nombreEntrada] : undefined;
      }
      ruta = ordenarRuta(elegidos, ciudad);
    }
    reparto.set(mejor.f.id, (reparto.get(mejor.f.id) ?? 0) + mejor.n);
    quedan -= mejor.n;
  }

  const etapas: Etapa[] = ruta.map((f, i) => ({
    f,
    noches: reparto.get(f.id)!,
    estancia: estancias.get(f.id)!,
    enEpoca: epoca(f),
    especies: especies.filter((k) => facil(k, f) > 0),
    traslado: i ? traslado(ruta[i - 1], f) : ciudad ? tramo(ciudad, punto(f)) : null,
  }));
  const entrada =
    ciudad && nombreEntrada && ruta.length
      ? { nombre: nombreEntrada, vuelta: tramo(punto(ruta[ruta.length - 1]), ciudad) }
      : null;

  const avisos: string[] = [];
  const tramos = [...etapas.map((e) => e.traslado), entrada?.vuelta].filter((t): t is Tramo => !!t);
  const horasCarretera = tramos.reduce((a, t) => a + (t.volar ? 0 : t.horas), 0);
  // ida o vuelta de más de 5 h y media por carretera desde la ciudad de entrada
  const largo = [etapas[0]?.traslado, entrada?.vuelta].some((t) => t && !t.volar && t.horas >= 5.5);
  if (!candidatos.length) avisos.push("No hay parques con fauna registrada en ese país.");
  for (const e of etapas) {
    if (e.noches < e.estancia.min)
      avisos.push(
        `${e.f.n}: ${e.noches} ${e.noches === 1 ? "noche es poco" : "noches son pocas"}; lo normal son ${e.estancia.ideal}.`,
      );
    if (e.noches > e.estancia.max)
      avisos.push(
        `${e.f.n}: ${e.noches} noches son más de las que suele merecer (${e.estancia.max}); añade otro parque o una ciudad.`,
      );
  }
  if (!largo && horasCarretera > noches * 3)
    avisos.push(
      `Unas ${horasCarretera} h de carretera en ${noches} noches: mucho tiempo en el coche. Mejor menos parques o algún vuelo.`,
    );
  if (tramos.some((t) => t.volar))
    avisos.push("Los tramos de más de 6 h y media por carretera se suelen hacer en avioneta o vuelo interno.");
  if (largo && nombreEntrada)
    avisos.push(
      `Hay ${Math.round(horasCarretera)} h de carretera desde y hasta ${nombreEntrada}: volar en avioneta la ida o la vuelta ahorra casi un día (y cuesta más).`,
    );
  if (conNinos) {
    const conMalaria = etapas.filter((e) => !SIN_MALARIA.has(e.f.id));
    avisos.push(
      `Con niños: sin actividades con edad mínima (gorilas desde 15 años, chimpancés desde 12-13) y antes los parques sin malaria${
        conMalaria.length
          ? `; ${conMalaria.map((e) => e.f.n).join(", ")} sí tiene${conMalaria.length > 1 ? "n" : ""} riesgo: consúltalo en un centro de vacunación internacional`
          : ""
      }. Muchos lodges solo aceptan niños desde los 6-12 años: pregúntalo al reservar.`,
    );
  }
  const fuera = etapas.filter((e) => e.enEpoca === false);
  if (fuera.length) avisos.push(`${fuera.map((e) => e.f.n).join(", ")}: no es su mejor época ese mes.`);
  return { etapas, entrada, avisos, sinCubrir: especies.filter((k) => !cubiertas.has(k)), horasCarretera };
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
