// Cuántas noches merece cada parque destacado (mínimo, ideal y máximo) y la ciudad por la que se entra: lo que
// sabe cualquier operador y el planificador no sabía (con 4 noches en Tanzania proponía 4 en el Ngorongoro, que
// se recorre en un día). Escrito a mano; en el resto de parques se deduce del tamaño.

export interface Estancia {
  min: number;
  ideal: number;
  max: number;
  nota?: string;
  /** ciudad de entrada y salida (CIUDADES) */
  entrada?: string;
  /** interés de una noche frente al mejor parque del país para un primer safari (0-1, escrito a mano); más de
   * 1 si es una experiencia única que no dicen las observaciones (gorilas) */
  valor?: number;
}

export const CIUDADES: Record<string, { lat: number; lon: number }> = {
  Arusha: { lat: -3.3869, lon: 36.683 },
  "Dar es Salaam": { lat: -6.79, lon: 39.21 },
  Nairobi: { lat: -1.2864, lon: 36.8172 },
  Johannesburgo: { lat: -26.2, lon: 28.05 },
  Durban: { lat: -29.86, lon: 31.03 },
  Gqeberha: { lat: -33.96, lon: 25.6 },
  Upington: { lat: -28.45, lon: 21.25 },
  Windhoek: { lat: -22.56, lon: 17.08 },
  Maun: { lat: -19.98, lon: 23.42 },
  Kasane: { lat: -17.8, lon: 25.15 },
  "Victoria Falls": { lat: -17.93, lon: 25.84 },
  Harare: { lat: -17.83, lon: 31.05 },
  Lusaka: { lat: -15.39, lon: 28.32 },
  Entebbe: { lat: 0.05, lon: 32.46 },
  Kigali: { lat: -1.9441, lon: 30.0619 },
};

/** Por dónde entra casi todo el mundo en cada país: los parques de otro circuito obligan a volar desde aquí. */
export const ENTRADA_PAIS: Record<string, string> = {
  Tanzania: "Arusha",
  Kenia: "Nairobi",
  Sudáfrica: "Johannesburgo",
  Namibia: "Windhoek",
  Botsuana: "Maun",
  Zimbabue: "Victoria Falls",
  Zambia: "Lusaka",
  Uganda: "Entebbe",
  Ruanda: "Kigali",
};

const e = (min: number, ideal: number, max: number, entrada?: string, nota?: string): Estancia => ({
  min,
  ideal,
  max,
  entrada,
  nota,
});

/** Valor por noche de los destacados (los que no salen aquí, 0,8). */
const VALOR: Record<string, number> = {
  serengeti: 1,
  ngorongoro: 0.9,
  tarangire: 0.75,
  ruaha: 0.85,
  nyerere: 0.8,
  "masai-mara": 1,
  amboseli: 0.8,
  samburu: 0.75,
  "sabi-sand": 1,
  kruger: 0.95,
  "hluhluwe-imfolozi": 0.7,
  addo: 0.65,
  kgalagadi: 0.8,
  madikwe: 0.75,
  pilanesberg: 0.6,
  etosha: 0.9,
  moremi: 1,
  chobe: 0.85,
  "kalahari-central": 0.6,
  makgadikgadi: 0.7,
  hwange: 0.8,
  "mana-pools": 0.85,
  "luangwa-sur": 0.95,
  "bajo-zambeze": 0.8,
  kafue: 0.75,
  liuwa: 0.65,
  "reina-isabel": 0.7,
  murchison: 0.75,
  kidepo: 0.7,
  akagera: 0.7,
};

export const ESTANCIAS: Record<string, Estancia> = {
  // Tanzania
  serengeti: e(
    2,
    3,
    5,
    "Arusha",
    "Enorme: con menos de 2 noches casi todo es carretera. La zona cambia con la migración.",
  ),
  ngorongoro: e(
    1,
    1,
    2,
    "Arusha",
    "El cráter se recorre en un día: una noche en el borde basta (dos para ir sin prisa).",
  ),
  tarangire: e(1, 2, 3, "Arusha", "Elefantes y baobabs; mejor en la estación seca."),
  ruaha: e(3, 3, 5, "Dar es Salaam", "Remoto: se llega en avioneta, compensa quedarse al menos tres noches."),
  nyerere: e(2, 3, 4, "Dar es Salaam", "Safaris en barca y a pie además de en vehículo."),
  // Kenia
  "masai-mara": e(2, 3, 5, "Nairobi", "De julio a octubre, la migración y los cruces del río Mara."),
  amboseli: e(1, 2, 3, "Nairobi", "Elefantes con el Kilimanjaro detrás."),
  samburu: e(2, 2, 3, "Nairobi", "Especies del norte que no hay en el Mara (cebra de Grévy, jirafa reticulada)."),
  // Sudáfrica
  kruger: e(2, 4, 7, "Johannesburgo", "Muy grande: el sur (Skukuza, Lower Sabie) es el de más fauna."),
  "sabi-sand": e(2, 3, 4, "Johannesburgo", "Reserva privada: dos safaris al día con rastreador; leopardos."),
  "hluhluwe-imfolozi": e(1, 2, 3, "Durban", "Rinocerontes."),
  addo: e(1, 2, 3, "Gqeberha", "Elefantes y sin malaria; combina con la Ruta Jardín."),
  kgalagadi: e(2, 4, 6, "Upington", "Remoto: los traslados dentro del parque son largos."),
  madikwe: e(2, 3, 4, "Johannesburgo", "Sin malaria, solo lodges."),
  pilanesberg: e(1, 2, 3, "Johannesburgo", "A dos horas de Johannesburgo, sin malaria."),
  // Namibia
  etosha: e(2, 3, 4, "Windhoek", "Mejor repartir las noches entre dos campamentos (Okaukuejo y Namutoni)."),
  // Botsuana
  moremi: e(2, 3, 4, "Maun", "El delta del Okavango: avioneta desde Maun."),
  chobe: e(1, 2, 3, "Kasane", "Safari en barca por el río Chobe; a una hora de las cataratas Victoria."),
  "kalahari-central": e(2, 3, 4, "Maun", "Remoto; mejor en la época de lluvias (diciembre-abril)."),
  makgadikgadi: e(1, 2, 3, "Maun", "Salares y suricatas."),
  // Zimbabue y Zambia
  hwange: e(2, 3, 4, "Victoria Falls"),
  "mana-pools": e(2, 3, 4, "Harare", "Safaris a pie y en canoa."),
  "luangwa-sur": e(3, 4, 5, "Lusaka", "Cuna del safari a pie; avioneta a Mfuwe."),
  "bajo-zambeze": e(2, 3, 4, "Lusaka", "Canoa por el Zambeze."),
  kafue: e(3, 4, 5, "Lusaka"),
  liuwa: e(2, 3, 4, "Lusaka", "Migración de ñus en noviembre."),
  // Uganda y Ruanda
  bwindi: {
    ...e(1, 2, 3, "Entebbe", "El trekking de gorilas es un día; dos noches por si hay que repetir o caminar."),
    valor: 1.6,
  },
  "reina-isabel": e(1, 2, 3, "Entebbe", "Canal de Kazinga en barca; leones trepadores en Ishasha."),
  murchison: e(2, 2, 3, "Entebbe", "Las cataratas y el Nilo en barca."),
  kibale: { ...e(1, 1, 2, "Entebbe", "Chimpancés: medio día de trekking."), valor: 0.9 },
  kidepo: e(2, 3, 4, "Entebbe", "Remoto: mejor en avioneta."),
  volcanes: { ...e(1, 2, 3, "Kigali", "Gorilas: a dos horas y media de Kigali."), valor: 1.6 },
  akagera: e(1, 2, 3, "Kigali", "Los cinco grandes de Ruanda, a dos horas de Kigali."),
  // Resto de África
  gorongosa: e(2, 3, 4),
  odzala: e(3, 4, 5),
  simien: e(2, 3, 4, undefined, "Geladas y walias; caminatas."),
  bale: e(2, 3, 4, undefined, "Lobo etíope."),
  // Asia
  ranthambore: e(2, 3, 4, undefined, "Dos safaris al día en jeep oficial; tigre."),
  kanha: e(2, 3, 4),
  bandhavgarh: e(2, 3, 4),
  tadoba: e(2, 3, 4),
  corbett: e(2, 3, 4),
  kaziranga: e(1, 2, 3, undefined, "Rinoceronte indio."),
  sundarbans: e(1, 2, 3),
  chitwan: e(2, 3, 4),
  yala: e(1, 2, 3, undefined, "Leopardo; safaris de medio día."),
  wilpattu: e(1, 2, 3),
  minneriya: e(1, 1, 2, undefined, "La concentración de elefantes se ve en una tarde."),
  "tanjung-puting": e(2, 3, 4, undefined, "Orangutanes desde un barco (klotok)."),
  kinabatangan: e(2, 3, 4),
  komodo: e(1, 2, 3),
  // América
  pantanal: e(3, 4, 6, undefined, "Jaguares en Porto Jofre de julio a octubre."),
  yellowstone: e(2, 4, 6),
  denali: e(2, 3, 4),
  katmai: e(1, 1, 2, undefined, "Osos pescando: excursión de un día en hidroavión."),
  churchill: e(2, 4, 6),
  galapagos: e(4, 7, 10, undefined, "Mejor en crucero o saltando entre islas."),
  manu: e(3, 5, 7),
  tambopata: e(2, 3, 4),
  corcovado: e(2, 3, 4),
  tortuguero: e(1, 2, 3),
  "torres-del-paine": e(2, 4, 6),
  valdes: e(2, 3, 4),
  // Oceanía
  kakadu: e(2, 3, 4),
  "isla-canguro": e(2, 3, 4),
};

/** Estancia de cualquier parque: la escrita a mano o, si no, según su tamaño. */
export function estanciaDe(id: string, radioKm: number): Estancia {
  const x = ESTANCIAS[id];
  // los grandes, al menos dos noches: una sola en un parque secundario es casi todo traslado
  if (!x) return radioKm < 15 ? e(1, 1, 2) : e(2, 2, 3);
  return { ...x, valor: x.valor ?? VALOR[id] ?? 0.8 };
}
