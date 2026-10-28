// Calendario de un viaje concreto (/viaje.ics?p=tarangire:2,serengeti:3&salida=2027-08-03): cada etapa en sus
// días y los recordatorios de antes (reservas, vacunas, visados). Todo va en la dirección, sin guardar nada.
import { cargarMundo, getParque, getParqueMundo } from "@/features/safaris/datos";
import { CABECERAS_ICS, type EventoFecha, fechaValida, ics, sumarDias } from "@/features/safaris/calendario";
import { leerEtapas } from "@/features/safaris/presupuesto";
import { SANIDAD, practicoDe } from "@/features/safaris/paises";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

const GORILAS = new Set(["bwindi", "volcanes"]);

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const etapas = leerEtapas(q.get("p")).slice(0, 15);
  const salida = fechaValida(q.get("salida"));
  if (!etapas.length || !salida) return new Response("Faltan las etapas (p) o la fecha de salida", { status: 400 });
  const nombre = (q.get("nombre") ?? "Mi safari").slice(0, 80);
  const mundo = cargarMundo();
  const hoy = new Date().toISOString().slice(0, 10);
  const enlaceViaje = `${SITIO}/viaje?${q.toString()}`;

  const eventos: EventoFecha[] = [];
  const paises = new Set<string>();
  let dia = salida;
  for (const e of etapas) {
    const p = getParque(e.id);
    const m = p ? undefined : getParqueMundo(e.id);
    const titulo = p?.nombre ?? m?.nombre ?? e.id;
    const pais = p?.pais ?? m?.pais_nombre ?? (m?.pais ? mundo?.paises[m.pais]?.nombre : null);
    if (pais) pais.split(" y ").forEach((x) => paises.add(x));
    eventos.push({
      uid: `viaje-${salida}-${e.id}`,
      inicio: dia,
      dias: e.noches,
      titulo: `${titulo} (${e.noches} ${e.noches === 1 ? "noche" : "noches"})`,
      descripcion: p?.consejo ?? `Safari en ${titulo}.`,
      url: `${SITIO}/parque/${e.id}`,
    });
    dia = sumarDias(dia, e.noches);
  }
  eventos.push({
    uid: `viaje-${salida}-vuelta`,
    inicio: dia,
    dias: 1,
    titulo: `Fin de ${nombre}`,
    descripcion: "Último día: vuelo de vuelta.",
    url: enlaceViaje,
  });

  // recordatorios de antes del viaje (solo los que aún no han pasado)
  const antes = (dias: number, clave: string, titulo: string, descripcion: string, url = enlaceViaje) => {
    const inicio = sumarDias(salida, -dias);
    if (inicio >= hoy) eventos.push({ uid: `viaje-${salida}-${clave}`, inicio, dias: 1, titulo, descripcion, url });
  };
  antes(
    180,
    "reservas",
    `${nombre}: reservar alojamientos`,
    "Los campamentos buenos se llenan con meses de antelación. Pide presupuesto a 3-4 operadores con el mismo texto.",
  );
  if (etapas.some((e) => GORILAS.has(e.id)))
    antes(180, "gorilas", `${nombre}: permisos de gorilas`, "En temporada alta se agotan meses antes.");
  antes(
    56,
    "vacunas",
    `${nombre}: cita de vacunas y malaria`,
    "Pide cita en un centro de vacunación internacional 4-8 semanas antes.",
    SANIDAD,
  );
  for (const pais of paises) {
    const x = practicoDe(pais);
    if (x && !x.visado.texto.startsWith("Sin visado"))
      antes(42, `visado-${pais}`, `${nombre}: visado de ${pais}`, x.visado.texto, x.visado.url);
  }
  antes(
    7,
    "lista",
    `${nombre}: repasar la lista`,
    "Pasaporte, seguro con evacuación, dólares pequeños, adaptador, prismáticos.",
  );

  return new Response(ics(nombre, eventos), {
    headers: { ...CABECERAS_ICS, "Content-Disposition": 'inline; filename="viaje.ics"' },
  });
}
