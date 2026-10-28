// Temporada verde: cuánto bajan los precios de los lodges cada mes. Precios por persona y noche en habitación
// doble, copiados a mano de las hojas de tarifas que publican los propios lodges (y, donde no hay, de la tabla
// de un agente, marcado). No buscamos el precio exacto, que cambia cada año y depende del agente, sino la
// proporción entre temporadas, que se mantiene: «en abril cobran un 40 % menos que en agosto». Consultado el
// 28-10-2026; se revisa una vez al año.
// Cada mes lleva la tarifa que cubre la mayor parte del mes; null si el lodge está cerrado.

export const CONSULTADO = "28-10-2026";

export interface TarifaLodge {
  lodge: string;
  parque: string;
  /** dónde está, si no es el parque en sí */
  zona?: string;
  moneda: "USD" | "NAD";
  /** enero…diciembre */
  precios: (number | null)[];
  incluye: string;
  fuente: string;
  /** hoja de tarifas del propio lodge (true) o de un agente (false) */
  oficial: boolean;
  temporada: string;
}

const GOVERNORS =
  "https://governorscamp.com/wp-content/uploads/2025/04/2026-governors-rate-sheet-recommened-selling-rates.pdf";
const PORINI = "https://www.porini.com/wp-content/uploads/2026/07/Reduced-Rates-for-6-nights.pdf";
const LEMALA = "https://www.lemalacamps.com/rates/";
const NS_BW = "https://naturalselection.travel/wp-content/uploads/2025/08/2026-NS-Rack-Botswana.pdf";
const NS_NA = "https://naturalselection.travel/wp-content/uploads/2025/08/2026-NS-Rack-Namibia.pdf";
const TT = "https://timeandtideafrica.com/rates";
const PC = "pensión completa";
const TODO = "todo incluido (actividades, bebidas)";
const TODO_PARQUE = "todo incluido, con la entrada al parque";

// Natural Selection 2026: verde 10 ene-31 mar, media abr y 1 nov-19 dic, media-alta may y oct, alta jun y
// sep, pico jul-ago (y 20 dic-9 ene)
const ns = (verde: number, media: number, mediaAlta: number, alta: number, pico: number) => [
  verde,
  verde,
  verde,
  media,
  mediaAlta,
  alta,
  pico,
  pico,
  alta,
  mediaAlta,
  media,
  media,
];
// Natural Selection Namibia 2026: verde 10 ene-31 mar, media abr, jun y 1 nov-19 dic, media-alta may, alta
// sep-oct, pico jul-ago
const nsNa = (verde: number, media: number, mediaAlta: number, alta: number, pico: number) => [
  verde,
  verde,
  verde,
  media,
  mediaAlta,
  media,
  pico,
  pico,
  alta,
  alta,
  media,
  media,
];
// Lemala 2026-27: el reparto de meses de cada campamento está en su página
const lemala = (meses: ("b" | "m" | "a" | null)[], b: number, m: number, a: number) =>
  meses.map((x) => (x === "b" ? b : x === "m" ? m : x === "a" ? a : null));

export const TARIFAS: TarifaLodge[] = [
  // ---- Kenia
  {
    lodge: "Governors' Camp",
    parque: "masai-mara",
    moneda: "USD",
    precios: [623, 623, 623, 453, 453, 623, 998, 998, 998, 998, 623, 623],
    incluye: "pensión completa con actividades (FB+)",
    fuente: GOVERNORS,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Porini Mara Camp",
    parque: "masai-mara",
    zona: "conservancy de Ol Kinyei",
    moneda: "USD",
    precios: [596, 596, 596, 541, null, 584, 836, 836, 836, 595, 584, 584],
    incluye: "tarifa para estancias de 6 noches en dos campamentos Porini",
    fuente: PORINI,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Porini Amboseli Camp",
    parque: "amboseli",
    zona: "conservancy de Selenkay",
    moneda: "USD",
    precios: [578, 578, 578, 508, null, 551, 748, 748, 748, 575, 551, 551],
    incluye: "tarifa para estancias de 6 noches en dos campamentos Porini",
    fuente: PORINI,
    oficial: true,
    temporada: "2026-2027",
  },
  // ---- Tanzania
  {
    lodge: "Nanyukie Lodge",
    parque: "serengeti",
    zona: "este del Serengeti",
    moneda: "USD",
    precios: lemala(["m", "m", "b", "b", "b", "a", "a", "a", "a", "m", "m", "m"], 585, 853, 1480),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Kuria Hills Lodge",
    parque: "serengeti",
    zona: "norte del Serengeti (río Mara)",
    moneda: "USD",
    precios: lemala(["b", "b", null, null, null, "m", "a", "a", "a", "m", "b", "b"], 520, 902, 1496),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Lemala Ewanjan",
    parque: "serengeti",
    zona: "centro del Serengeti (Seronera)",
    moneda: "USD",
    precios: lemala(["m", "m", "b", "b", "b", "m", "a", "a", "a", "m", "b", "b"], 305, 427, 595),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Lemala Osonjoi",
    parque: "ngorongoro",
    moneda: "USD",
    precios: lemala(["a", "a", "b", "b", "b", "a", "a", "a", "a", "m", "m", "m"], 691, 1051, 1886),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Lemala Ngorongoro Tented Camp",
    parque: "ngorongoro",
    moneda: "USD",
    precios: lemala(["a", "a", "b", null, null, "a", "a", "a", "a", "m", "m", "m"], 370, 480, 720),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  {
    lodge: "Mpingo Ridge Lodge",
    parque: "tarangire",
    moneda: "USD",
    precios: lemala(["m", "m", "b", "b", "b", "a", "a", "a", "a", "m", "m", "m"], 585, 869, 1458),
    incluye: PC,
    fuente: LEMALA,
    oficial: true,
    temporada: "2026-2027",
  },
  // ---- Botsuana
  {
    lodge: "Mbamba",
    parque: "moremi",
    zona: "norte del delta del Okavango",
    moneda: "USD",
    precios: ns(995, 1325, 1575, 1795, 1995),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Duke's Camp",
    parque: "moremi",
    zona: "norte del delta del Okavango",
    moneda: "USD",
    precios: ns(1195, 1495, 1745, 2045, 2295),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Little Sable",
    parque: "moremi",
    zona: "reserva privada de Khwai, junto a Moremi",
    moneda: "USD",
    precios: ns(660, 925, 1045, 1295, 1445),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Sable Alley",
    parque: "moremi",
    zona: "reserva privada de Khwai, junto a Moremi",
    moneda: "USD",
    precios: ns(995, 1325, 1575, 1795, 1995),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Camp Kalahari",
    parque: "makgadikgadi",
    moneda: "USD",
    precios: ns(795, 995, 1085, 1125, 1325),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Meno a Kwena",
    parque: "makgadikgadi",
    zona: "río Boteti",
    moneda: "USD",
    precios: ns(625, 875, 995, 1080, 1275),
    incluye: TODO_PARQUE,
    fuente: NS_BW,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Chobe Game Lodge",
    parque: "chobe",
    moneda: "USD",
    precios: [1010, 1010, 1010, 1410, 1570, 1570, 1570, 1570, 1570, 1570, 1410, 1410],
    incluye: TODO,
    fuente: "https://www.safari.co.za/Chobe_National_Park_Lodge-travel/pricing_chobe-game-lodge-botswana.html",
    oficial: false,
    temporada: "2026",
  },
  {
    lodge: "Chobe Mopani Forest Lodge",
    parque: "chobe",
    zona: "Kasane",
    moneda: "USD",
    precios: Array(12).fill(273),
    incluye: "pensión completa y dos actividades",
    fuente:
      "https://sundestinations.co.za/wp-content/uploads/2026/04/Chobe-Mopani-Forest-Lodge-RACK-Rate-2026-UPDATE.pdf",
    oficial: true,
    temporada: "abril 2026 - marzo 2027",
  },
  // ---- Namibia
  {
    lodge: "Etosha Mountain Lodge",
    parque: "etosha",
    zona: "Etosha Heights, junto al parque",
    moneda: "NAD",
    precios: nsNa(7325, 8585, 9375, 9745, 10795),
    incluye: "todo incluido",
    fuente: NS_NA,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Safarihoek",
    parque: "etosha",
    zona: "Etosha Heights, junto al parque",
    moneda: "NAD",
    precios: nsNa(7265, 8635, 9155, 9295, 10395),
    incluye: "todo incluido",
    fuente: NS_NA,
    oficial: true,
    temporada: "2026",
  },
  // ---- Zambia
  {
    lodge: "Time + Tide Chinzombo",
    parque: "luangwa-sur",
    moneda: "USD",
    precios: [1330, 1330, 1330, 1330, 1330, 1330, 1840, 1840, 1840, 1840, 1330, 1330],
    incluye: TODO,
    fuente: TT,
    oficial: true,
    temporada: "2026",
  },
  {
    lodge: "Time + Tide Mchenja",
    parque: "luangwa-sur",
    moneda: "USD",
    precios: [null, null, null, null, null, 880, 1200, 1200, 1200, 1200, 880, null],
    incluye: TODO,
    fuente: TT,
    oficial: true,
    temporada: "2026",
  },
  // ---- Zimbabue
  {
    lodge: "Camelthorn Lodge",
    parque: "hwange",
    moneda: "USD",
    precios: [500, 500, 500, 500, 755, 755, 755, 755, 755, 755, 500, 500],
    incluye: TODO,
    fuente: "https://www.go2africa.com/accommodation/camelthorn-lodge",
    oficial: false,
    temporada: "2026",
  },
  // ---- Sudáfrica: las reservas privadas apenas cambian de precio (solo Navidad)
  {
    lodge: "Sabi Sabi Bush Lodge",
    parque: "sabi-sand",
    moneda: "USD",
    precios: Array(12).fill(1594),
    incluye: "todo incluido (sin la tasa de conservación)",
    fuente: "https://www.sabisabi.com/rates",
    oficial: true,
    temporada: "marzo 2026 - febrero 2027",
  },
];

export interface IndicePrecios {
  /** por mes, el precio medio de sus lodges respecto a su mes más caro (0-1); null si todos cierran */
  meses: (number | null)[];
  lodges: TarifaLodge[];
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function indicePrecios(parque: string): IndicePrecios | null {
  const lodges = TARIFAS.filter((t) => t.parque === parque);
  if (!lodges.length) return null;
  const meses = Array.from({ length: 12 }, (_, i) => {
    const r = lodges
      .map((t) => {
        const max = Math.max(...t.precios.filter((x): x is number => x !== null));
        const p = t.precios[i];
        return p === null ? null : p / max;
      })
      .filter((x): x is number => x !== null);
    return r.length ? mediana(r) : null;
  });
  return { meses, lodges };
}

/** Ahorro (0-1) del mes más barato abierto frente al más caro, y qué meses son los más baratos. */
export function ahorro(ix: IndicePrecios): { ahorro: number; baratos: number[]; caros: number[] } {
  const v = ix.meses.filter((x): x is number => x !== null);
  const min = Math.min(...v);
  const max = Math.max(...v);
  const cerca = (x: number | null, y: number) => x !== null && Math.abs(x - y) < 0.08;
  return {
    ahorro: 1 - min / max,
    baratos: ix.meses.flatMap((x, i) => (cerca(x, min) ? [i] : [])),
    caros: ix.meses.flatMap((x, i) => (cerca(x, max) ? [i] : [])),
  };
}
