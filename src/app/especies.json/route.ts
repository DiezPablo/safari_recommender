// Datos para «¿Qué quieres ver y cuándo?»: para cada especie estrella, los parques del mundo donde más se ha
// observado. Se genera en el build (estático) a partir de safaris_mundo.json y del catálogo, que da el nombre en
// español y la foto de iNaturalist.
import { cargarMundo, cargarSafaris, nombreEstrella, slugEspecie } from "@/features/safaris/datos";

export const dynamic = "force-static";

const MAX_PARQUES = 80;
const MIN_OBS = 3;
// lo más buscado en un safari va primero; el resto, en el orden del catálogo
const PRIMERAS = [
  "Panthera leo",
  "Loxodonta africana",
  "Panthera pardus",
  "Syncerus caffer",
  "Ceratotherium simum",
  "Diceros bicornis",
  "Acinonyx jubatus",
  "Connochaetes taurinus",
  "Giraffa camelopardalis",
  "Lycaon pictus",
  "Gorilla beringei",
  "Pan troglodytes",
  "Panthera tigris",
  "Panthera onca",
  "Pongo pygmaeus",
  "Ursus maritimus",
  "Ursus arctos",
  "Canis lupus",
  "Hippopotamus amphibius",
  "Crocuta crocuta",
  "Equus quagga",
  "Elephas maximus",
];

export function GET() {
  const mundo = cargarMundo();
  const listaCatalogo = cargarSafaris()?.especies ?? [];
  const catalogo = new Map(listaCatalogo.map((e) => [e.cientifico, e]));
  const orden = (cientifico: string) => {
    const i = PRIMERAS.indexOf(cientifico);
    if (i >= 0) return i;
    const j = listaCatalogo.findIndex((e) => e.cientifico === cientifico);
    return PRIMERAS.length + (j >= 0 ? j : 999);
  };
  const especies = [];
  const parques: Record<string, [string, number][]> = {};
  for (const [clave, cientifico] of Object.entries(mundo?.estrella ?? {})) {
    const lista = (mundo?.parques ?? [])
      .map((p) => [p.id, p.estrella[clave] ?? 0] as [string, number])
      .filter(([, n]) => n >= MIN_OBS)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_PARQUES);
    if (!lista.length) continue;
    const c = catalogo.get(cientifico);
    especies.push({
      clave: Number(clave),
      cientifico,
      nombre: nombreEstrella(clave),
      slug: c ? slugEspecie(c) : null,
      foto: c?.foto?.url.replace("/medium.", "/square.") ?? null,
      n_parques: lista.length,
      orden: orden(cientifico),
    });
    parques[clave] = lista;
  }
  especies.sort((a, b) => a.orden - b.orden);
  return Response.json({ especies, parques });
}
