// Calendario suscribible con la buena época de un parque (se repite cada año) y un aviso para reservar.
import { buenaEpoca, cargarSafaris, getParque, getParqueMundo } from "@/features/safaris/datos";
import { CABECERAS_ICS, eventosTemporada, ics } from "@/features/safaris/calendario";
import { SITIO } from "@/lib/sitio";

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return (cargarSafaris()?.parques ?? []).map((p) => ({ id: p.id }));
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParque(id);
  const m = p ? undefined : getParqueMundo(id);
  if (!p && !m) return new Response("No existe ese parque", { status: 404 });
  const nombre = (p?.nombre ?? m?.nombre)!;
  const meses = p
    ? p.meses
    : (buenaEpoca({ la: m!.lat, sec: m!.meses_secos, ep: m!.epoca?.meses, em: m!.epoca?.motivo }) ?? []);
  const url = `${SITIO}/parque/${id}`;
  return new Response(ics(`Safari: ${nombre}`, eventosTemporada(id, nombre, meses, url)), {
    headers: CABECERAS_ICS,
  });
}
