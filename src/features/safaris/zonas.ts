// Zonas, campamentos y concesiones que la gente busca por su nombre pero que no son un espacio protegido propio
// en Wikidata (Ndutu, Seronera, Mara Triangle, Savuti…): cada una lleva al parque donde está. Servidor y navegador.

export interface Zona {
  nombre: string;
  /** otros nombres con que se busca */
  alias?: string[];
  /** id del parque en el índice */
  parque: string;
  nota: string;
}

export const ZONAS: Zona[] = [
  {
    nombre: "Ndutu",
    parque: "ngorongoro",
    nota: "Llanuras del sur del área de conservación del Ngorongoro, junto al Serengeti: los partos de la migración (diciembre-marzo, pico en febrero).",
  },
  {
    nombre: "Seronera",
    parque: "serengeti",
    nota: "Centro del Serengeti: el valle del río Seronera, leones y leopardos todo el año.",
  },
  { nombre: "Moru", alias: ["Moru Kopjes"], parque: "serengeti", nota: "Kopjes del centro-sur del Serengeti." },
  {
    nombre: "Grumeti",
    alias: ["corredor occidental", "Western Corridor"],
    parque: "serengeti",
    nota: "Corredor occidental del Serengeti: cruces del río Grumeti (junio-julio).",
  },
  {
    nombre: "Kogatende",
    parque: "serengeti",
    nota: "Norte del Serengeti, a orillas del río Mara: cruces de la migración (julio-octubre).",
  },
  { nombre: "Lobo", parque: "serengeti", nota: "Noreste del Serengeti: paso de la migración en noviembre y en julio." },
  {
    nombre: "Mara Triangle",
    alias: ["Triángulo del Mara"],
    parque: "masai-mara",
    nota: "Oeste de la reserva del Masái Mara, entre el río Mara y el escarpe de Oloololo: cruces y menos vehículos.",
  },
  {
    nombre: "Musiara",
    parque: "masai-mara",
    nota: "Pantano de Musiara, en el norte del Masái Mara (territorio de los leones de «Big Cat Diary»).",
  },
  {
    nombre: "Talek",
    parque: "masai-mara",
    nota: "Río Talek, en el centro-este del Masái Mara; puerta y campamentos.",
  },
  {
    nombre: "Sabi Sands",
    alias: ["Sabi Sabi", "Londolozi", "MalaMala", "Mala Mala"],
    parque: "sabi-sand",
    nota: "Reserva privada sin vallas con Kruger, famosa por los leopardos.",
  },
  {
    nombre: "Skukuza",
    alias: ["Satara", "Lower Sabie", "Olifants", "Letaba", "Pretoriuskop", "Punda Maria"],
    parque: "kruger",
    nota: "Campamentos (rest camps) del parque nacional Kruger.",
  },
  {
    nombre: "Klaserie",
    alias: ["Manyeleti", "Balule", "Greater Kruger"],
    parque: "kruger",
    nota: "Reservas privadas del Greater Kruger, sin vallas con el parque nacional.",
  },
  {
    nombre: "Delta del Okavango",
    alias: ["Okavango", "Khwai", "Xakanaxa", "Chief's Island"],
    parque: "moremi",
    nota: "El delta del Okavango; Moremi es su parte protegida y Khwai, la concesión vecina.",
  },
  {
    nombre: "Savuti",
    alias: ["Savute", "Linyanti"],
    parque: "chobe",
    nota: "Savuti, en el interior de Chobe (leones cazadores de elefantes); Linyanti, al noroeste.",
  },
  { nombre: "Chobe Riverfront", alias: ["Kasane"], parque: "chobe", nota: "Orilla del río Chobe, junto a Kasane." },
  {
    nombre: "Mfuwe",
    parque: "luangwa-sur",
    nota: "Puerta y aeropuerto de South Luangwa (Zambia), cuna del safari a pie.",
  },
  {
    nombre: "Okaukuejo",
    alias: ["Halali", "Namutoni"],
    parque: "etosha",
    nota: "Campamentos de Etosha, con charcas iluminadas de noche.",
  },
  {
    nombre: "Porto Jofre",
    alias: ["Transpantaneira"],
    parque: "pantanal",
    nota: "Final de la Transpantaneira, en el norte del Pantanal: la base para ver jaguares (julio-octubre).",
  },
];

function normal(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Zonas cuyo nombre o alias contiene el texto buscado (al menos 3 letras). */
export function buscarZonas(texto: string): Zona[] {
  const q = normal(texto.trim());
  if (q.length < 3) return [];
  return ZONAS.filter((z) => [z.nombre, ...(z.alias ?? [])].some((n) => normal(n).includes(q)));
}
