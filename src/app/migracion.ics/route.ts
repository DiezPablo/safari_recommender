// Calendario suscribible de la gran migración: dónde suelen estar las manadas cada mes de un año normal.
import { CABECERAS_ICS, ics } from "@/features/safaris/calendario";
import { MIGRACION } from "@/features/safaris/migracion";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-static";

export function GET() {
  const eventos = MIGRACION.map((z) => ({
    uid: `migracion-${z.mes}`,
    mes: z.mes,
    meses: 1,
    titulo: `Migración: ${z.zona}${z.cruces ? " (cruces de ríos)" : z.partos ? " (partos)" : ""}`,
    descripcion: `${z.que} Dónde dormir: ${z.base}. Es el ciclo de un año normal: se adelanta o se retrasa varias semanas según la lluvia.`,
    url: `${SITIO}/migracion`,
  }));
  return new Response(ics("Safari: la gran migración", eventos), { headers: CABECERAS_ICS });
}
