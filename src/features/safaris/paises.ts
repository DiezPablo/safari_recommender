// Lo práctico de cada país de safari para un viajero con pasaporte español: visado, salud, enchufes, dinero,
// conducción y propinas. Revisado el 27-10-2026 con fuentes que se citan en docs/decisiones.md; los visados y los
// requisitos sanitarios cambian a menudo, así que la web siempre enlaza la web oficial y Exteriores para
// confirmarlo. Solo lo que coincidía en varias fuentes: si no, se dice que hay que comprobarlo.

export interface PracticoPais {
  visado: { texto: string; url: string };
  fiebreAmarilla: string;
  malaria: string;
  /** tipos de enchufe (IEC); en España se usan C y F */
  enchufes: string[];
  dinero: string;
  conduce: "izquierda" | "derecha";
  /** zona horaria (IANA) para las horas de sol */
  zona: string;
  propinas: string;
}

export const REVISADO = "27-10-2026";
export const EXTERIORES = "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Recomendaciones-de-viaje.aspx";
export const SANIDAD = "https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/home.htm";

const PROPINAS_ESTE =
  "Guía-conductor: unos 10-20 USD por persona y día; personal del campamento, una caja común. En dólares.";
const PROPINAS_SUR = "Guía: unos 10-15 USD (o su equivalente) por persona y día; rastreador y personal, aparte.";
const FA_DESDE_RIESGO =
  "Solo te piden el certificado si llegas desde un país con riesgo (p. ej. después de Kenia o Uganda) o con escala de más de 12 h en uno.";
const MALARIA_TODO = "Riesgo en casi todo el país por debajo de unos 1800 m: consulta la profilaxis.";

export const PRACTICO: Record<string, PracticoPais> = {
  Kenia: {
    visado: {
      texto: "eTA (autorización electrónica) antes de viajar, unos 30 USD.",
      url: "https://www.etakenya.go.ke/",
    },
    fiebreAmarilla: "Vacuna recomendada en buena parte del país; certificado si llegas desde un país con riesgo.",
    malaria: `${MALARIA_TODO} Nairobi y las tierras altas, bajo.`,
    enchufes: ["G"],
    dinero: "Chelín keniano; tasas de parques con tarjeta o pago móvil (sin efectivo en las puertas).",
    conduce: "izquierda",
    zona: "Africa/Nairobi",
    propinas: PROPINAS_ESTE,
  },
  Tanzania: {
    visado: { texto: "Visado electrónico antes de viajar, unos 50 USD.", url: "https://visa.immigration.go.tz/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: MALARIA_TODO,
    enchufes: ["D", "G"],
    dinero: "Chelín tanzano; dólares muy usados. Las tasas de parques se pagan sin efectivo.",
    conduce: "izquierda",
    zona: "Africa/Dar_es_Salaam",
    propinas: PROPINAS_ESTE,
  },
  Uganda: {
    visado: { texto: "Visado electrónico antes de viajar, unos 50 USD.", url: "https://visas.immigration.go.ug/" },
    fiebreAmarilla: "Certificado obligatorio para todos los viajeros (desde 2024).",
    malaria: MALARIA_TODO,
    enchufes: ["G"],
    dinero: "Chelín ugandés; dólares en billetes recientes.",
    conduce: "izquierda",
    zona: "Africa/Kampala",
    propinas: PROPINAS_ESTE,
  },
  Ruanda: {
    visado: { texto: "Visado a la llegada u online, unos 50 USD.", url: "https://irembo.gov.rw/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en las zonas bajas (Akagera); bajo en los Volcanes y Kigali.",
    enchufes: ["C", "J"],
    dinero: "Franco ruandés; tarjeta en Kigali.",
    conduce: "derecha",
    zona: "Africa/Kigali",
    propinas: PROPINAS_ESTE,
  },
  Sudáfrica: {
    visado: { texto: "Sin visado hasta 90 días.", url: "https://www.dha.gov.za/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria:
      "Solo en el noreste (Kruger y norte de KwaZulu-Natal), sobre todo de septiembre a mayo. El Cabo, Addo y Pilanesberg, sin riesgo.",
    enchufes: ["C", "D", "M", "N"],
    dinero: "Rand; tarjeta en casi todo (también gasolineras de los parques).",
    conduce: "izquierda",
    zona: "Africa/Johannesburg",
    propinas: PROPINAS_SUR,
  },
  Botsuana: {
    visado: { texto: "Sin visado hasta 90 días.", url: "https://evisa.gov.bw/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Norte (Okavango, Chobe, Moremi), sobre todo de noviembre a junio; el sur, sin riesgo.",
    enchufes: ["D", "G", "M"],
    dinero: "Pula; dólares en los campamentos del delta.",
    conduce: "izquierda",
    zona: "Africa/Gaborone",
    propinas: PROPINAS_SUR,
  },
  Namibia: {
    visado: {
      texto:
        "Desde abril de 2025 muchos países europeos necesitan visado (a la llegada o electrónico, 1600 NAD): compruébalo para tu pasaporte.",
      url: "https://eservices.mhaiss.gov.na/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria:
      "Norte (norte de Etosha, Caprivi/Zambeze), sobre todo de noviembre a junio; Windhoek, la costa y el sur, sin riesgo.",
    enchufes: ["D", "M"],
    dinero: "Dólar namibio (vale lo mismo que el rand, que también se acepta).",
    conduce: "izquierda",
    zona: "Africa/Windhoek",
    propinas: PROPINAS_SUR,
  },
  Zambia: {
    visado: {
      texto:
        "Muchos pasaportes están exentos; si no, 50 USD o la KAZA UniVisa (50 USD, Zambia y Zimbabue): compruébalo.",
      url: "https://www.zambiaimmigration.gov.zm/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: MALARIA_TODO,
    enchufes: ["C", "D", "G"],
    dinero: "Kuacha; dólares en los lodges.",
    conduce: "izquierda",
    zona: "Africa/Lusaka",
    propinas: PROPINAS_SUR,
  },
  Zimbabue: {
    visado: {
      texto: "Visado a la llegada o la KAZA UniVisa (50 USD, Zimbabue y Zambia, con excursiones de un día a Botsuana).",
      url: "https://www.evisa.gov.zw/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en las zonas bajas (Hwange, Mana Pools, cataratas Victoria), sobre todo de noviembre a junio.",
    enchufes: ["D", "G"],
    dinero: "Se paga sobre todo en dólares; lleva billetes pequeños.",
    conduce: "izquierda",
    zona: "Africa/Harare",
    propinas: PROPINAS_SUR,
  },
};

export function practicoDe(pais: string | null | undefined): PracticoPais | undefined {
  if (!pais) return undefined;
  return PRACTICO[pais] ?? PRACTICO[pais.split(" y ")[0]];
}

// ---- Safari por tu cuenta (en coche de alquiler) en los destacados

export type PorTuCuenta = "turismo" | "4x4" | "guia";

export const POR_TU_CUENTA: Record<string, { nivel: PorTuCuenta; nota: string }> = {
  kruger: { nivel: "turismo", nota: "Carreteras asfaltadas y de tierra; campamentos del parque (SANParks)." },
  pilanesberg: { nivel: "turismo", nota: "A dos horas de Johannesburgo, sin malaria." },
  addo: { nivel: "turismo", nota: "Pistas buenas; sin malaria." },
  "hluhluwe-imfolozi": { nivel: "turismo", nota: "Carreteras asfaltadas; uno de los mejores para rinocerontes." },
  etosha: { nivel: "turismo", nota: "Pistas de grava para turismo; charcas con campamentos del parque (NWR)." },
  kgalagadi: { nivel: "turismo", nota: "Pistas principales para turismo; 4×4 para el lado de Botsuana." },
  chobe: { nivel: "4x4", nota: "Arena profunda: 4×4 y experiencia; campings reservados de antemano." },
  moremi: { nivel: "4x4", nota: "4×4 equipado, campings reservados y experiencia en arena y agua." },
  makgadikgadi: { nivel: "4x4", nota: "4×4; salares intransitables con lluvia." },
  "kalahari-central": { nivel: "4x4", nota: "Remoto: dos vehículos, agua y combustible para días." },
  hwange: { nivel: "4x4", nota: "Pistas principales practicables; 4×4 recomendado." },
  "mana-pools": { nivel: "4x4", nota: "4×4 y reserva de campings con ZimParks." },
  akagera: { nivel: "4x4", nota: "Se puede entrar con vehículo propio; guía opcional." },
  murchison: { nivel: "4x4", nota: "Posible con 4×4 de alquiler; ferri para cruzar el Nilo." },
  "reina-isabel": { nivel: "4x4", nota: "Posible con 4×4 de alquiler." },
  "sabi-sand": { nivel: "guia", nota: "Reserva privada: solo con los safaris de los lodges." },
  madikwe: { nivel: "guia", nota: "Solo con los safaris de los lodges." },
  "masai-mara": { nivel: "guia", nota: "Lo normal es ir con guía-conductor; con coche propio, solo con experiencia." },
  serengeti: { nivel: "guia", nota: "Lo normal es ir con guía-conductor (distancias enormes y pistas difíciles)." },
  ngorongoro: { nivel: "guia", nota: "Lo normal es ir con guía-conductor." },
};

export const TEXTO_POR_TU_CUENTA: Record<PorTuCuenta, string> = {
  turismo: "Por tu cuenta en coche normal",
  "4x4": "Por tu cuenta en 4×4 (con experiencia)",
  guia: "Con guía (lo habitual)",
};
