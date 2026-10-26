// Comparador de parques: hasta 4 lado a lado con lo que decide un viaje (qué se ve, cuándo, cómo se llega,
// cuánto cuesta entrar y cuánta oferta de alojamiento y operadores hay). Dinámica: depende de los parques elegidos.
import type { Metadata } from "next";
import Link from "next/link";
import { INICIALES, MESES } from "@/lib/fechas";
import AnadirComparar from "@/features/safaris/componentes/AnadirComparar";
import {
  cargarMundo,
  cargarSafaris,
  getParque,
  getParqueMundo,
  nombreEstrella,
  slugEspecie,
} from "@/features/safaris/datos";
import { buenaEpoca, CLASE, MAX_COMPARAR, type ParqueMundo, TEXTO_MOTIVO, urlWeb } from "@/features/safaris/modelo";

export const metadata: Metadata = {
  title: "Comparar parques",
  description:
    "Compara parques de safari: especies, mejor época, lluvia, cómo llegar, tasas, alojamientos y operadores.",
};

type Props = { searchParams: Promise<{ p?: string }> };

const MAX_ESPECIES = 16;

function km(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} km`;
}

export default async function PaginaComparar({ searchParams }: Props) {
  const ids = [...new Set(((await searchParams).p ?? "").split(",").filter(Boolean))].slice(0, MAX_COMPARAR);
  const mundo = cargarMundo();
  const parques = ids.map(getParqueMundo).filter((p): p is ParqueMundo => p !== undefined);
  const conFicha = new Map((cargarSafaris()?.especies ?? []).map((e) => [e.cientifico, slugEspecie(e)]));

  // especies estrella de alguno de los parques, las más vistas en el conjunto primero
  const total = new Map<string, number>();
  for (const p of parques)
    for (const [k, n] of Object.entries(p.estrella)) if (n >= 3) total.set(k, (total.get(k) ?? 0) + n);
  const especies = [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ESPECIES)
    .map(([k]) => k);

  const fila = (titulo: string, celda: (p: ParqueMundo) => React.ReactNode) => (
    <tr>
      <th scope="row">{titulo}</th>
      {parques.map((p) => (
        <td key={p.id}>{celda(p)}</td>
      ))}
    </tr>
  );

  return (
    <main className="calendario safaris comparar">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · hasta {MAX_COMPARAR} parques
        </p>
        <h1>Comparar parques</h1>
        <p className="entradilla">
          Lo que decide entre un parque y otro, lado a lado. Añade parques desde aquí o con «+ Comparar» en cada ficha.
        </p>
      </header>
      <AnadirComparar ids={parques.map((p) => p.id)} />

      {parques.length === 0 ? (
        <p>
          Aún no has elegido parques. Prueba con{" "}
          <Link href="/comparar?p=serengeti,masai-mara,kruger">Serengeti, Masái Mara y Kruger</Link>.
        </p>
      ) : (
        <div className="tabla-desliza">
          <table className="tabla-comparar">
            <thead>
              <tr>
                <td />
                {parques.map((p) => (
                  <th key={p.id} scope="col">
                    {p.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto.url} alt="" loading="lazy" />
                    )}
                    <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
                    <small>{(p.pais && mundo?.paises[p.pais]?.nombre) ?? p.pais_nombre ?? ""}</small>
                    <Link
                      className="quitar"
                      href={`/comparar?p=${parques
                        .filter((x) => x !== p)
                        .map((x) => x.id)
                        .join(",")}`}
                    >
                      Quitar
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fila("Tipo", (p) => CLASE[p.clase] ?? p.clase)}
              {fila("Superficie", (p) => (p.area_km2 ? `${p.area_km2.toLocaleString("es-ES")} km²` : "–"))}
              {fila("Mejor época", (p) => {
                const curada = getParque(p.id)?.meses;
                const ep = curada?.length ? curada : buenaEpoca({ la: p.lat, sec: p.meses_secos, ep: p.epoca?.meses });
                return (
                  <>
                    <span className="mini-ano" aria-label={ep ? ep.map((m) => MESES[m - 1]).join(", ") : "sin datos"}>
                      {INICIALES.map((l, i) => (
                        <i key={i} className={ep?.includes(i + 1) ? "si" : undefined}>
                          {l}
                        </i>
                      ))}
                    </span>
                    {(curada?.length || p.epoca?.motivo) && (
                      <small>{TEXTO_MOTIVO[curada?.length ? "recomendada" : p.epoca!.motivo!]}</small>
                    )}
                  </>
                );
              })}
              {fila("Lluvia anual", (p) =>
                p.lluvia_mm ? `${Math.round(p.lluvia_mm.reduce((a, b) => a + b, 0)).toLocaleString("es-ES")} mm` : "–",
              )}
              {fila("Mamíferos registrados", (p) => (p.n_mamiferos >= 200 ? "200+" : p.n_mamiferos))}
              {fila("Observaciones (GBIF)", (p) => p.obs.toLocaleString("es-ES"))}
              <tr className="separador">
                <th scope="rowgroup" colSpan={parques.length + 1}>
                  Especies estrella (observaciones)
                </th>
              </tr>
              {especies.map((k) => {
                const s = mundo ? conFicha.get(mundo.estrella[k]) : undefined;
                const nombre = nombreEstrella(k);
                const max = Math.max(...parques.map((p) => p.estrella[k] ?? 0));
                return (
                  <tr key={k}>
                    <th scope="row">{s ? <Link href={`/especie/${s}`}>{nombre}</Link> : nombre}</th>
                    {parques.map((p) => {
                      const n = p.estrella[k] ?? 0;
                      return (
                        <td key={p.id} className={n >= 3 ? (n === max ? "mejor" : undefined) : "no"}>
                          {n >= 3 ? n.toLocaleString("es-ES") : "–"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="separador">
                <th scope="rowgroup" colSpan={parques.length + 1}>
                  Organizarlo
                </th>
              </tr>
              {fila("Aeropuerto internacional", (p) => {
                const a = p.llegar.aeropuertos.find((x) => x.internacional);
                return a ? `${a.ciudad ?? a.nombre} (${a.iata}), ${km(a.km)}` : "–";
              })}
              {fila("Aeropuerto más cercano", (p) => {
                const a = p.llegar.aeropuertos[0];
                return a ? `${a.ciudad ?? a.nombre} (${a.iata}), ${km(a.km)}` : "–";
              })}
              {fila("Pistas de avioneta", (p) => p.llegar.n_pistas || "–")}
              {fila("Tasa de entrada", (p) => getParque(p.id)?.tasa ?? "–")}
              {fila("Alojamientos (OSM)", (p) => {
                const n = p.osm?.alojamientos.length ?? 0;
                return n >= 30 ? "30 o más" : n || "–";
              })}
              {fila(
                "Operadores",
                (p) => (p.osm?.operadores.length ?? 0) + (p.operadores_ciudad?.lista.length ?? 0) || "–",
              )}
              {fila("Web oficial", (p) => {
                const w = urlWeb(p.web);
                return w ? (
                  <a href={w} target="_blank" rel="noopener">
                    Abrir ↗
                  </a>
                ) : (
                  "–"
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="nota-pie">
        Observaciones de GBIF desde 2010 en un radio alrededor del parque: miden lo fácil que es ver cada especie, no
        cuántos animales hay. Época: temporada recomendada en los destacados; en el resto, estación seca o meses con más
        avistamientos. Alojamientos y operadores de OpenStreetMap (los que tienen ficha allí, no todos los que existen).
      </p>
    </main>
  );
}
