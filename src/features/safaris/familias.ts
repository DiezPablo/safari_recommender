// Safari con niños: parques sin malaria (lo que más pesa al elegir con niños pequeños) y edades mínimas de las
// actividades estrella. Escrito a mano para los destacados el 27-10-2026 (ver docs/decisiones.md); confírmalo con
// el parque o el operador, y la malaria con un centro de vacunación internacional.

/** Destacados sin malaria: el sur de Sudáfrica y los que están fuera de los trópicos. */
export const SIN_MALARIA = new Set([
  "addo",
  "pilanesberg",
  "madikwe",
  "kgalagadi",
  "simien",
  "bale",
  "galapagos",
  "yellowstone",
  "denali",
  "katmai",
  "churchill",
  "torres-del-paine",
  "valdes",
  "isla-canguro",
]);

/** Edad mínima de la actividad principal del parque. */
export const EDAD_MINIMA: Record<string, { edad: number; actividad: string }> = {
  bwindi: { edad: 15, actividad: "trekking de gorilas" },
  volcanes: { edad: 15, actividad: "trekking de gorilas" },
  kibale: { edad: 12, actividad: "trekking de chimpancés (12-13 años según la fuente: confírmalo)" },
};

export function textoFamilias(id: string): string | null {
  const edad = EDAD_MINIMA[id];
  if (edad) return `Edad mínima ${edad.edad} años para el ${edad.actividad}`;
  if (SIN_MALARIA.has(id)) return "Sin malaria: buena opción con niños pequeños";
  return null;
}
