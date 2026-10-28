// Páginas de respuesta, generadas con plantillas a partir de los datos: «Safari en agosto: dónde ir» (12) y
// «Safari en Tanzania: parques y cuándo ir» (un país por cada uno con destacados). Son lo que la gente busca en
// Google; cada una enlaza a las fichas, al planificador y a las demás.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INICIALES, MESES } from "@/lib/fechas";
import {
  CONTINENTES,
  cargarMundo,
  cargarSafaris,
  enTemporada,
  especiePorTaxon,
  nivelFrecuencia,
  nombreTaxon,
  paisesDe,
  paisesDestacados,
  puntuacionAhora,
  slugTexto,
  type Parque,
} from "@/features/safaris/datos";
import { MIGRACION } from "@/features/safaris/migracion";
import { practicoDe } from "@/features/safaris/paises";
import { SIN_MALARIA } from "@/features/safaris/familias";
import { ItemsPais } from "@/features/safaris/componentes/PracticoPais";
import { Suscribir } from "@/ui/Suscribir";

type Props = { params: Promise<{ clave: string }> };

export const dynamicParams = false;

function mesDe(clave: string): number {
  return MESES.indexOf(clave);
}

export function generateStaticParams() {
  return [...MESES, ...paisesDestacados().keys()].map((clave) => ({ clave }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clave } = await params;
  const mes = mesDe(clave);
  if (mes >= 0)
    return {
      title: `Safari en ${MESES[mes]}: dónde ir`,
      description: `Los parques del mundo en su mejor época en ${MESES[mes]}, qué animales es más probable ver ese mes y dónde está la gran migración.`,
      alternates: { canonical: `/safari-en/${clave}` },
    };
  const pais = paisesDestacados().get(clave);
  if (!pais) return {};
  return {
    title: `Safari en ${pais}: parques y cuándo ir`,
    description: `Los mejores parques de ${pais} para ver fauna, su mejor época mes a mes, qué animales se ven y lo práctico (visado, salud, dinero).`,
    alternates: { canonical: `/safari-en/${clave}` },
  };
}

/** Especies estrella probables ese mes (frecuencia ≥ 20 ‰), de más a menos. */
function probables(p: Parque, mes: number): string[] {
  return Object.entries(p.frecuencia ?? {})
    .map(([t, f]) => ({ e: especiePorTaxon(Number(t)), f: f[mes] ?? 0 }))
    .filter((x) => x.e && nivelFrecuencia(x.f).clave.includes("probable"))
    .sort((a, b) => b.f - a.f)
    .map((x) => nombreTaxon(x.e!).toLowerCase());
}

function lista(nombres: string[]): string {
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}` : (nombres[0] ?? "");
}

function rango(meses: number[]): string {
  // meses seguidos (también de diciembre a enero) como «julio a octubre»
  const si = new Set(meses);
  if (si.size === 12) return "todo el año";
  const tramos: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!si.has(m) || si.has(m === 1 ? 12 : m - 1)) continue;
    let n = 1;
    while (si.has(((m - 1 + n) % 12) + 1)) n++;
    const fin = ((m - 1 + n - 1) % 12) + 1;
    tramos.push(n === 1 ? MESES[m - 1] : `${MESES[m - 1]} ${n === 2 ? "y" : "a"} ${MESES[fin - 1]}`);
  }
  return lista(tramos);
}

function NavMeses({ actual }: { actual: number }) {
  return (
    <nav className="nav-respuestas" aria-label="Otros meses">
      {MESES.map((m, i) => (
        <Link key={m} href={`/safari-en/${m}`} aria-current={i === actual ? "page" : undefined}>
          {m}
        </Link>
      ))}
    </nav>
  );
}

function NavPaises({ actual }: { actual?: string }) {
  return (
    <nav className="nav-respuestas" aria-label="Por países">
      {[...paisesDestacados()].map(([s, n]) => (
        <Link key={s} href={`/safari-en/${s}`} aria-current={s === actual ? "page" : undefined}>
          {n}
        </Link>
      ))}
    </nav>
  );
}

function PaginaMes({ mes }: { mes: number }) {
  const parques = cargarSafaris()?.parques ?? [];
  const enEpoca = parques
    .filter((p) => enTemporada(p, mes))
    .sort((a, b) => puntuacionAhora(b, mes) - puntuacionAhora(a, mes));
  const fuera = parques.filter((p) => !enTemporada(p, mes) && p.continente === "África");
  const migracion = MIGRACION.find((z) => z.mes === mes + 1);
  const nombreMes = MESES[mes];
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · Cuándo ir
        </p>
        <h1>Safari en {nombreMes}: dónde ir</h1>
        <p className="entradilla">
          En {nombreMes} {enEpoca.length} de los {parques.length} parques destacados están en su mejor época
          {enEpoca.length
            ? `, con ${lista(enEpoca.slice(0, 3).map((p) => `${p.nombre} (${p.pais})`))} a la cabeza`
            : ""}
          . Para cada uno, los animales que más se ven ese mes según las fotos de los visitantes en iNaturalist.
        </p>
      </header>

      {migracion && (
        <section className="seccion">
          <h2 className="rotulo">La gran migración en {nombreMes}</h2>
          <p>
            <b>{migracion.zona}.</b> {migracion.que} Dónde dormir: {migracion.base}.{" "}
            <Link href="/migracion">La migración mes a mes →</Link>
          </p>
        </section>
      )}

      {CONTINENTES.map((c) => {
        const delContinente = enEpoca.filter((p) => p.continente === c);
        if (!delContinente.length) return null;
        return (
          <section className="seccion" key={c}>
            <h2 className="rotulo">
              {c}: en su mejor época en {nombreMes}
            </h2>
            <ol className="lista-respuesta">
              {delContinente.map((p) => {
                const ver = probables(p, mes);
                return (
                  <li key={p.id}>
                    <h3>
                      <Link href={`/parque/${p.id}`}>{p.nombre}</Link> <small>{p.pais}</small>
                    </h3>
                    <p>
                      {ver.length ? `Muy probable o probable en ${nombreMes}: ${lista(ver.slice(0, 6))}. ` : ""}
                      Mejor época: {rango(p.meses)}.
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {fuera.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">En África, mejor en otro momento</h2>
          <ul className="lista-respuesta compacta">
            {fuera.map((p) => (
              <li key={p.id}>
                <Link href={`/parque/${p.id}`}>{p.nombre}</Link> ({p.pais}): mejor de {rango(p.meses)}.
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="seccion no-imprimir">
        <h2 className="rotulo">Organízalo</h2>
        <p className="enlaces">
          <Link href={`/planificar?mes=${mes}`}>Planificar una ruta en {nombreMes} →</Link>
          <Link href="/presupuesto">Calcular el presupuesto →</Link>
        </p>
        <NavMeses actual={mes} />
        <NavPaises />
      </section>
    </main>
  );
}

function PaginaPais({ clave, pais }: { clave: string; pais: string }) {
  const parques = (cargarSafaris()?.parques ?? []).filter((p) => paisesDe(p).includes(pais));
  const mundo = cargarMundo();
  const destacados = new Set(parques.map((p) => p.id));
  const otros = (mundo?.parques ?? [])
    .filter(
      (p) =>
        !destacados.has(p.id) &&
        p.nivel === "B" &&
        (p.pais_nombre ?? (p.pais ? mundo?.paises[p.pais]?.nombre : null)) === pais,
    )
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, 12);
  // meses en los que más parques están en temporada
  const cuenta = MESES.map((_, i) => parques.filter((p) => enTemporada(p, i)).length);
  const tope = Math.max(...cuenta);
  const mejores = cuenta.flatMap((n, i) => (n === tope && tope > 0 ? [i + 1] : []));
  const x = practicoDe(pais);
  const conNinos = parques.filter((p) => SIN_MALARIA.has(p.id));
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · Países
        </p>
        <h1>Safari en {pais}</h1>
        <p className="entradilla">
          {parques.length === 1 ? "Un parque destacado" : `${parques.length} parques destacados`}
          {otros.length ? ` y ${otros.length} destinos de fauna más` : ""}. Los meses en los que más de ellos están en
          su mejor época: {rango(mejores)}.
          {conNinos.length ? ` Sin malaria, para ir con niños: ${lista(conNinos.map((p) => p.nombre))}.` : ""}
        </p>
      </header>

      <section className="seccion">
        <h2 className="rotulo">Cuándo ir a cada parque</h2>
        <div className="ano-safari ano-pais" role="table" aria-label={`Mejor época de los parques de ${pais}`}>
          <div role="row" className="fila-ano cabecera-ano">
            <span role="rowheader" />
            {INICIALES.map((m, i) => (
              <span role="columnheader" key={i}>
                <Link href={`/safari-en/${MESES[i]}`} aria-label={MESES[i]}>
                  {m}
                </Link>
              </span>
            ))}
          </div>
          {parques.map((p) => (
            <div role="row" className="fila-ano" key={p.id}>
              <span role="rowheader">
                <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
              </span>
              {MESES.map((m, i) => (
                <span
                  role="cell"
                  key={m}
                  className={p.meses.includes(i + 1) ? "temporada-si" : "temporada-no"}
                  aria-label={p.meses.includes(i + 1) ? `${m}: buena época` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="seccion">
        <h2 className="rotulo">Los parques</h2>
        <ol className="lista-respuesta">
          {parques.map((p) => {
            const estrella = p.estrella
              .map(especiePorTaxon)
              .filter((e) => e !== undefined)
              .map((e) => nombreTaxon(e).toLowerCase());
            return (
              <li key={p.id}>
                <h3>
                  <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
                </h3>
                <p>
                  {estrella.length ? `Para ver ${lista(estrella.slice(0, 6))}. ` : ""}Mejor época: {rango(p.meses)}.{" "}
                  {p.consejo}
                </p>
                <Suscribir ruta={`/parque/${p.id}/calendario.ics`} texto="Su buena época en tu calendario." />
              </li>
            );
          })}
        </ol>
      </section>

      {otros.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Otros destinos de fauna en {pais}</h2>
          <ul className="lista-respuesta compacta">
            {otros.map((p) => (
              <li key={p.id}>
                <Link href={`/parque/${p.id}`}>{p.nombre}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {x && (
        <section className="seccion">
          <h2 className="rotulo">Lo práctico</h2>
          <ul className="lista-organiza">
            <ItemsPais pais={pais} x={x} />
          </ul>
        </section>
      )}

      <section className="seccion no-imprimir">
        <h2 className="rotulo">Organízalo</h2>
        <p className="enlaces">
          <Link href={`/planificar?pais=${encodeURIComponent(pais)}`}>Planificar una ruta por {pais} →</Link>
          <Link
            href={`/comparar?p=${parques
              .slice(0, 4)
              .map((p) => p.id)
              .join(",")}`}
          >
            Comparar sus parques →
          </Link>
        </p>
        <NavPaises actual={clave} />
        <NavMeses actual={-1} />
      </section>
    </main>
  );
}

export default async function PaginaRespuesta({ params }: Props) {
  const { clave } = await params;
  const mes = mesDe(clave);
  if (mes >= 0) return <PaginaMes mes={mes} />;
  const pais = paisesDestacados().get(clave);
  if (!pais) notFound();
  return <PaginaPais clave={clave} pais={pais} />;
}
