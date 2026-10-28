// RSS con lo visto en el último mes en los parques destacados (iNaturalist). Se regenera con cada despliegue,
// que llega cuando se actualizan los datos (dos veces al día). Solo da el parque, nunca dónde dentro de él.
import { cargarRecientes, cargarSafaris, especiePorTaxon, nombreTaxon } from "@/features/safaris/datos";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-static";

function xml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function GET() {
  const recientes = cargarRecientes();
  const parques = cargarSafaris()?.parques ?? [];
  const fecha = recientes ? new Date(`${recientes.fecha}T12:00:00Z`) : new Date();
  // una entrada por parque y semana: los datos se renuevan dos veces al día y no queremos 65 entradas cada vez
  const semana = `${fecha.getUTCFullYear()}-${Math.floor((fecha.getTime() - Date.UTC(fecha.getUTCFullYear(), 0, 1)) / 6048e5)}`;
  const desde = recientes
    ? new Date(`${recientes.desde}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : "";
  const items = parques
    .map((p) => {
      const r = recientes?.parques[p.id];
      const vistas = Object.entries(r?.estrella ?? {})
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => especiePorTaxon(Number(t)))
        .filter((e) => e !== undefined)
        .map((e) => nombreTaxon(e).toLowerCase());
      return { p, vistas, obs: r?.observaciones ?? 0 };
    })
    .filter((x) => x.vistas.length > 0)
    .sort((a, b) => b.vistas.length - a.vistas.length || b.obs - a.obs)
    .map(({ p, vistas, obs }) => {
      const url = `${SITIO}/parque/${p.id}`;
      const lista = vistas.length > 1 ? `${vistas.slice(0, -1).join(", ")} y ${vistas.at(-1)}` : vistas[0];
      return [
        "<item>",
        `<title>${xml(`${p.nombre}: ${lista}`)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="false">${xml(`${p.id}-${semana}`)}</guid>`,
        `<pubDate>${fecha.toUTCString()}</pubDate>`,
        `<description>${xml(`Visto en ${p.nombre} (${p.pais}) desde el ${desde}: ${lista}. ${obs} observaciones en iNaturalist.`)}</description>`,
        "</item>",
      ].join("");
    });
  const cuerpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    "<title>Safaris: lo visto en el último mes</title>",
    `<link>${SITIO}/</link>`,
    `<atom:link href="${SITIO}/recientes.xml" rel="self" type="application/rss+xml"/>`,
    "<description>Especies estrella observadas en los últimos 30 días en los parques destacados (iNaturalist).</description>",
    "<language>es</language>",
    `<lastBuildDate>${fecha.toUTCString()}</lastBuildDate>`,
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
  return new Response(cuerpo, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
