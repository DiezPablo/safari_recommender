// Tasas de entrada de los parques destacados para la calculadora de presupuesto: no residente adulto, en USD
// (las de rand, dólar namibio y pula, convertidas a 18 ZAR, 18 NAD y 13,5 BWP por dólar, oct. 2026). Revisado el
// 26-10-2026 con la fuente indicada; cambian a menudo, así que la web muestra la fecha y el enlace. Solo los
// parques con una cifra que coincide en varias fuentes o es oficial (Ruaha no: las fuentes no coinciden).

/** Fecha de la última revisión (la comprueba .github/scripts/revision_datos.py). */
export const REVISADO_TASAS = "26-10-2026";

export interface Tasa {
  /** por persona y día (24 h) */
  usdDia: number;
  /** si cambia con el mes (1-12): Masái Mara */
  usdDiaMes?: (mes: number) => number;
  /** precio total por número de días (1, 2, 3…; el último vale para estancias más largas): Akagera */
  tramos?: number[];
  extras?: { concepto: string; usd: number; por: "persona y noche" | "vehículo" | "persona" }[];
  nota?: string;
  fuente: string;
  vigencia: string;
}

const TANZANIA = "https://www.roadtripafrica.com/tanzania/practical-info/national-parks/";
const UGANDA = "https://www.roadtripafrica.com/uganda/practical-info/national-parks";
const KWS = "https://hapakenya.com/2025/09/30/kws-announces-new-park-fees-effective-october-1-2025";
const SANPARKS =
  "https://atta.travel/resource/sanparks-raises-international-conservation-fees-by-up-to-15-from-november.html";

export const TASAS: Record<string, Tasa> = {
  serengeti: {
    usdDia: 82.6,
    extras: [{ concepto: "Concesión por dormir dentro del parque", usd: 70.8, por: "persona y noche" }],
    fuente: TANZANIA,
    vigencia: "2026",
  },
  ngorongoro: {
    usdDia: 70.8,
    extras: [{ concepto: "Bajada al cráter (Crater Service Fee)", usd: 295, por: "vehículo" }],
    fuente: TANZANIA,
    vigencia: "2026",
  },
  tarangire: { usdDia: 59, nota: "53 USD en temporada baja", fuente: TANZANIA, vigencia: "2026" },
  nyerere: { usdDia: 82.6, fuente: TANZANIA, vigencia: "2026" },
  "masai-mara": {
    usdDia: 200,
    usdDiaMes: (mes) => (mes <= 6 ? 100 : 200),
    nota: "100 USD de enero a junio y 200 USD de julio a diciembre (condado de Narok)",
    fuente: "https://nation.africa/kenya/counties/narok/wildebeest-migration-season-kicks-maasai-mara-5564192",
    vigencia: "2026",
  },
  amboseli: { usdDia: 90, fuente: KWS, vigencia: "oct. 2025" },
  kruger: {
    usdDia: 38.4,
    nota: "692 ZAR desde el 1-11-2026, más un 1 % de tasa comunitaria",
    fuente: SANPARKS,
    vigencia: "nov. 2026 - oct. 2027",
  },
  addo: { usdDia: 31.4, nota: "565 ZAR desde el 1-11-2026", fuente: SANPARKS, vigencia: "nov. 2026 - oct. 2027" },
  etosha: {
    usdDia: 15.6,
    nota: "280 NAD (140 de entrada + 140 de conservación) desde abril de 2026",
    fuente: "https://www.tourismupdate.com/article/sharp-hike-in-namibia-park-fees",
    vigencia: "abr. 2026",
  },
  moremi: {
    usdDia: 20,
    nota: "270 BWP",
    fuente: "https://www.tourismupdate.com/article/botswana-increases-park-and-licence-fees",
    vigencia: "aprox.",
  },
  chobe: {
    usdDia: 20,
    nota: "270 BWP",
    fuente: "https://www.tourismupdate.com/article/botswana-increases-park-and-licence-fees",
    vigencia: "aprox.",
  },
  "luangwa-sur": { usdDia: 25, fuente: "https://www.zambiatourism.com/park-entry-fees/", vigencia: "2025" },
  hwange: {
    usdDia: 20,
    nota: "10 USD si duermes en un campamento del parque",
    fuente: "https://www.zimparks.org.zw/wp-content/uploads/2024/04/2023-ZIMPARKS-RATES-1.pdf",
    vigencia: "2023 (última oficial)",
  },
  "mana-pools": {
    usdDia: 20,
    fuente: "https://www.zimparks.org.zw/wp-content/uploads/2024/04/2023-ZIMPARKS-RATES-1.pdf",
    vigencia: "2023 (última oficial)",
  },
  murchison: { usdDia: 45, fuente: UGANDA, vigencia: "jul. 2024 - jun. 2026" },
  "reina-isabel": { usdDia: 40, fuente: UGANDA, vigencia: "jul. 2024 - jun. 2026" },
  kidepo: { usdDia: 40, fuente: UGANDA, vigencia: "jul. 2024 - jun. 2026" },
  bwindi: {
    usdDia: 40,
    extras: [{ concepto: "Permiso de gorilas", usd: 800, por: "persona" }],
    fuente: UGANDA,
    vigencia: "jul. 2024 - jun. 2026",
  },
  kibale: {
    usdDia: 40,
    extras: [{ concepto: "Permiso de chimpancés", usd: 250, por: "persona" }],
    fuente: UGANDA,
    vigencia: "jul. 2024 - jun. 2026",
  },
  volcanes: {
    usdDia: 0,
    extras: [{ concepto: "Permiso de gorilas", usd: 1500, por: "persona" }],
    fuente: "https://visitrwanda.com/",
    vigencia: "2024",
  },
  akagera: {
    usdDia: 100,
    tramos: [100, 150, 200],
    nota: "100 USD 1 día, 150 USD 2, 200 USD 3; no se cobra más hasta una semana",
    fuente: "https://www.africanparks.org/sites/default/files/Akagera%20NP%20Pricing%202025.pdf",
    vigencia: "2025",
  },
  galapagos: {
    usdDia: 0,
    extras: [{ concepto: "Entrada al parque nacional Galápagos", usd: 200, por: "persona" }],
    fuente: "https://www.galapagos.gob.ec/",
    vigencia: "ago. 2024",
  },
};

/** Lo que cuesta la entrada de un parque por persona para unas noches (se cobra por periodos de 24 h). */
/** mes: 1-12 */
export function tasaPorPersona(t: Tasa, noches: number, mes: number): number {
  const dias = Math.max(1, noches);
  const dia = t.usdDiaMes ? t.usdDiaMes(mes) : t.usdDia;
  let total = t.tramos ? t.tramos[Math.min(dias, t.tramos.length) - 1] : dia * dias;
  for (const e of t.extras ?? []) {
    if (e.por === "persona y noche") total += e.usd * noches;
    if (e.por === "persona") total += e.usd;
  }
  return total;
}

/** Extras que se pagan por vehículo (la bajada al cráter del Ngorongoro). */
export function tasaPorVehiculo(t: Tasa): number {
  return (t.extras ?? []).filter((e) => e.por === "vehículo").reduce((a, e) => a + e.usd, 0);
}
