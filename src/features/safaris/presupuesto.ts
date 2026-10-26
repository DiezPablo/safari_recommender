// Calculadora de presupuesto de un safari: tasas oficiales de los parques (tasas.ts, con fuente) y el resto con
// valores de partida que el usuario cambia por los suyos. Todo por persona y en USD, que es como cotizan los
// operadores y los lodges.
import { TASAS, tasaPorPersona, tasaPorVehiculo } from "@/features/safaris/tasas";

export interface EtapaPresupuesto {
  id: string;
  nombre: string;
  noches: number;
}

export interface Supuestos {
  /** USD por persona y noche (alojamiento con pensión completa) */
  alojamiento: number;
  /** USD por vehículo y día (4×4 con guía-conductor y combustible); 0 si los safaris van incluidos en el lodge */
  vehiculo: number;
  /** personas que caben en un vehículo de safari */
  plazas: number;
  /** vuelos internos o en avioneta y precio por persona y trayecto */
  vuelos: number;
  precioVuelo: number;
  /** vuelo internacional, visado y seguro, por persona */
  internacional: number;
  visado: number;
  seguro: number;
  /** propinas por persona y día */
  propinas: number;
  /** colchón para imprevistos, % */
  imprevistos: number;
}

export const SUPUESTOS_INICIALES: Supuestos = {
  alojamiento: 350,
  vehiculo: 250,
  plazas: 6,
  vuelos: 0,
  precioVuelo: 250,
  internacional: 0,
  visado: 0,
  seguro: 0,
  propinas: 20,
  imprevistos: 10,
};

/** Niveles de alojamiento: valores de partida por persona y noche con pensión completa. */
export const NIVELES: [string, number][] = [
  ["Camping o lodge sencillo", 120],
  ["Lodge o campamento de tienda de gama media", 350],
  ["Campamento de lujo o concesión privada", 1000],
];

export type Origen = "oficial" | "estimación";

export interface Linea {
  concepto: string;
  porPersona: number;
  origen: Origen;
  detalle?: string;
}

export interface Resultado {
  lineas: Linea[];
  porPersona: number;
  total: number;
  dias: number;
  sinTasa: string[];
}

export function calcular(etapas: EtapaPresupuesto[], personas: number, mes: number, s: Supuestos): Resultado {
  const noches = etapas.reduce((a, e) => a + e.noches, 0);
  const dias = noches + 1;
  const vehiculos = Math.max(1, Math.ceil(personas / Math.max(1, s.plazas)));
  const lineas: Linea[] = [];
  const sinTasa: string[] = [];
  for (const e of etapas) {
    const t = TASAS[e.id];
    if (!t) {
      sinTasa.push(e.nombre);
      continue;
    }
    const porVehiculo = tasaPorVehiculo(t);
    lineas.push({
      concepto: `Tasas: ${e.nombre}`,
      porPersona: tasaPorPersona(t, e.noches, mes) + (porVehiculo * vehiculos) / personas,
      origen: "oficial",
      detalle: [
        t.nota,
        ...(t.extras ?? []).map((x) => `${x.concepto}: ${x.usd.toLocaleString("es-ES")} USD por ${x.por}`),
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  lineas.push({
    concepto: `Alojamiento (${noches} noches)`,
    porPersona: s.alojamiento * noches,
    origen: "estimación",
  });
  if (s.vehiculo > 0)
    lineas.push({
      concepto: `Vehículo con guía (${noches} días, ${vehiculos} ${vehiculos === 1 ? "vehículo" : "vehículos"})`,
      porPersona: (s.vehiculo * noches * vehiculos) / personas,
      origen: "estimación",
    });
  if (s.vuelos > 0)
    lineas.push({
      concepto: `Vuelos internos (${s.vuelos})`,
      porPersona: s.vuelos * s.precioVuelo,
      origen: "estimación",
    });
  if (s.internacional > 0)
    lineas.push({ concepto: "Vuelo internacional", porPersona: s.internacional, origen: "estimación" });
  if (s.visado > 0) lineas.push({ concepto: "Visado", porPersona: s.visado, origen: "estimación" });
  if (s.seguro > 0) lineas.push({ concepto: "Seguro de viaje", porPersona: s.seguro, origen: "estimación" });
  lineas.push({ concepto: "Propinas (guía y personal)", porPersona: s.propinas * dias, origen: "estimación" });
  const subtotal = lineas.reduce((a, l) => a + l.porPersona, 0);
  if (s.imprevistos > 0)
    lineas.push({
      concepto: `Imprevistos (${s.imprevistos} %)`,
      porPersona: (subtotal * s.imprevistos) / 100,
      origen: "estimación",
    });
  const porPersona = lineas.reduce((a, l) => a + l.porPersona, 0);
  return { lineas, porPersona, total: porPersona * personas, dias, sinTasa };
}

/** «serengeti:3,ngorongoro:1» ↔ etapas (los nombres los pone quien lo lee, con el índice). */
export function leerEtapas(texto: string | null): { id: string; noches: number }[] {
  return (texto ?? "")
    .split(",")
    .filter(Boolean)
    .map((t) => {
      const [id, n] = t.split(":");
      return { id, noches: Math.min(30, Math.max(1, Number(n) || 2)) };
    });
}

export function escribirEtapas(etapas: { id: string; noches: number }[]): string | null {
  return etapas.map((e) => `${e.id}:${e.noches}`).join(",") || null;
}

// ---- Ofertas de operadores: lo que no incluyen se suma con los supuestos para compararlas

export const INCLUYE = [
  ["tasas", "Tasas de los parques"],
  ["alojamiento", "Alojamiento y comidas"],
  ["vehiculo", "Vehículo y guía"],
  ["vuelos", "Vuelos internos"],
  ["traslados", "Traslados al aeropuerto"],
  ["bebidas", "Bebidas"],
] as const;

export type ClaveIncluye = (typeof INCLUYE)[number][0];

export interface Oferta {
  operador: string;
  /** precio por persona en USD */
  precio: number;
  incluye: ClaveIncluye[];
  privado: boolean;
}

/** Lo que habría que sumar a una oferta por lo que no incluye, por persona (con el plan y los supuestos). */
export function faltaEnOferta(o: Oferta, r: Resultado): { concepto: string; usd: number }[] {
  const falta: { concepto: string; usd: number }[] = [];
  const suma = (pred: (l: Linea) => boolean) => r.lineas.filter(pred).reduce((a, l) => a + l.porPersona, 0);
  if (!o.incluye.includes("tasas")) falta.push({ concepto: "Tasas", usd: suma((l) => l.origen === "oficial") });
  if (!o.incluye.includes("alojamiento"))
    falta.push({ concepto: "Alojamiento", usd: suma((l) => l.concepto.startsWith("Alojamiento")) });
  if (!o.incluye.includes("vehiculo"))
    falta.push({ concepto: "Vehículo y guía", usd: suma((l) => l.concepto.startsWith("Vehículo")) });
  if (!o.incluye.includes("vuelos"))
    falta.push({ concepto: "Vuelos internos", usd: suma((l) => l.concepto.startsWith("Vuelos internos")) });
  return falta.filter((f) => f.usd > 0);
}
