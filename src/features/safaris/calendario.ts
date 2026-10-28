// Calendarios .ics para suscribirse sin cuenta (Google Calendar, Apple, Outlook): la buena época de cada parque y
// la migración, como eventos que se repiten cada año, más un recordatorio dos meses antes para reservar. Las
// aplicaciones vuelven a pedir el fichero cada pocas horas o días, así que se actualiza solo.
import { MESES } from "@/lib/fechas";

export interface EventoAnual {
  uid: string;
  /** mes 1-12 de inicio y número de meses que dura (puede pasar de diciembre a enero) */
  mes: number;
  meses: number;
  /** solo el día 1 del mes (los recordatorios) */
  unDia?: boolean;
  titulo: string;
  descripcion: string;
  url?: string;
}

/** Evento de una fecha concreta (el calendario de un viaje): días enteros desde «inicio» (AAAA-MM-DD). */
export interface EventoFecha {
  uid: string;
  inicio: string;
  dias: number;
  titulo: string;
  descripcion: string;
  url?: string;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function fechaValida(t: string | null | undefined): string | undefined {
  return t && FECHA.test(t) && !Number.isNaN(Date.parse(t)) ? t : undefined;
}

/** «2027-08-03» + 4 días → «2027-08-07» (en UTC, sin horas). */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Tramos seguidos de una lista de meses (1-12), uniendo diciembre con enero: [11,12,1,2] → [{11, 4}]. */
export function tramos(meses: number[]): { mes: number; meses: number }[] {
  const si = new Set(meses);
  if (si.size === 0 || si.size === 12) return [];
  const res: { mes: number; meses: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const anterior = m === 1 ? 12 : m - 1;
    if (!si.has(m) || si.has(anterior)) continue;
    let n = 1;
    while (si.has(((m - 1 + n) % 12) + 1)) n++;
    res.push({ mes: m, meses: n });
  }
  return res;
}

/** Eventos de temporada de un parque: el tramo entero y un aviso dos meses antes de que empiece. */
export function eventosTemporada(id: string, nombre: string, meses: number[], url: string): EventoAnual[] {
  return tramos(meses).flatMap(({ mes, meses: n }) => {
    const fin = MESES[(mes - 1 + n - 1) % 12];
    const periodo = n === 1 ? MESES[mes - 1] : `${MESES[mes - 1]} ${n === 2 ? "y" : "a"} ${fin}`;
    const aviso = ((mes - 1 + 10) % 12) + 1;
    return [
      {
        uid: `${id}-temporada-${mes}`,
        mes,
        meses: n,
        titulo: `Buena época en ${nombre}`,
        descripcion: `De ${periodo}: los mejores meses para ver fauna en ${nombre}.`,
        url,
      },
      {
        uid: `${id}-reserva-${mes}`,
        mes: aviso,
        meses: 1,
        unDia: true,
        titulo: `Reserva ya: ${nombre} en ${MESES[mes - 1]}`,
        descripcion: `La buena época de ${nombre} empieza en ${MESES[mes - 1]} (${periodo}). Los alojamientos dentro del parque se llenan meses antes.`,
        url,
      },
    ];
  });
}

function escapar(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Corta las líneas a 75 octetos como pide el RFC 5545 (sin partir caracteres UTF-8). */
function plegar(linea: string): string {
  const cod = new TextEncoder();
  const partes: string[] = [];
  let actual = "";
  let octetos = 0;
  for (const c of linea) {
    const n = cod.encode(c).length;
    if (octetos + n > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = "";
      octetos = 0;
    }
    actual += c;
    octetos += n;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

function fecha(anio: number, mes: number, dia = 1): string {
  const a = anio + Math.floor((mes - 1) / 12);
  const m = ((mes - 1) % 12) + 1;
  return `${a}${String(m).padStart(2, "0")}${String(dia).padStart(2, "0")}`;
}

export function ics(nombre: string, eventos: (EventoAnual | EventoFecha)[], ahora = new Date()): string {
  const anio = ahora.getUTCFullYear();
  const sello = ahora.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Safaris//Calendario de temporadas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapar(nombre)}`,
    "X-WR-TIMEZONE:UTC",
    "REFRESH-INTERVAL;VALUE=DURATION:P7D",
    "X-PUBLISHED-TTL:P7D",
  ];
  for (const e of eventos) {
    lineas.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@safaris`,
      `DTSTAMP:${sello}`,
      ...("inicio" in e
        ? [
            `DTSTART;VALUE=DATE:${e.inicio.replace(/-/g, "")}`,
            `DTEND;VALUE=DATE:${sumarDias(e.inicio, e.dias).replace(/-/g, "")}`,
          ]
        : [
            `DTSTART;VALUE=DATE:${fecha(anio, e.mes)}`,
            e.unDia ? `DTEND;VALUE=DATE:${fecha(anio, e.mes, 2)}` : `DTEND;VALUE=DATE:${fecha(anio, e.mes + e.meses)}`,
            "RRULE:FREQ=YEARLY",
          ]),
      `SUMMARY:${escapar(e.titulo)}`,
      `DESCRIPTION:${escapar(e.url ? `${e.descripcion}\n${e.url}` : e.descripcion)}`,
      ...(e.url ? [`URL:${e.url}`] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

export const CABECERAS_ICS = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};
