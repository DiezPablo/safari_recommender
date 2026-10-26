"use client";
// Planificador de ruta: país, días, mes, ritmo y animales → circuito con noches, traslados y avisos. El estado va
// en la URL para poder compartir el plan.
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { escribirAlmacen, useParametrosUrl } from "@/lib/almacen";
import { MAX_COMPARAR } from "@/features/safaris/modelo";
import { facilidades, NOCHES_RITMO, planificar, type Ritmo } from "@/features/safaris/planificar";
import { useDatosNavegador } from "@/features/safaris/useDatosNavegador";

const RITMOS: [Ritmo, string][] = [
  ["tranquilo", "Tranquilo (4 noches por parque)"],
  ["normal", "Normal (3 noches)"],
  ["intenso", "Intenso (2 noches)"],
];
const PAIS_INICIAL = "Tanzania";

export default function Planificador({ mesHoy }: { mesHoy: number }) {
  const { especies: datos, indice } = useDatosNavegador();
  const [parametros, actualizar] = useParametrosUrl();
  const pais = parametros.get("pais") ?? PAIS_INICIAL;
  const dias = Math.min(30, Math.max(2, Number(parametros.get("dias") ?? 10) || 10));
  const mes = parametros.has("mes") ? Number(parametros.get("mes")) : mesHoy;
  const ritmo = (parametros.get("ritmo") as Ritmo) in NOCHES_RITMO ? (parametros.get("ritmo") as Ritmo) : "normal";
  const elegidas = (parametros.get("ver") ?? "").split(",").filter(Boolean).map(Number);

  if (!datos || !indice) return <p className="nota-pie">Cargando parques…</p>;

  const filas = [...indice.values()];
  // países ordenados por interés total de sus parques (los de safari primero)
  const interes = new Map<string, number>();
  for (const f of filas) if (f.p) interes.set(f.p, (interes.get(f.p) ?? 0) + f.s);
  const paises = [...interes.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
  const plan = planificar({
    indice: filas,
    observaciones: facilidades(datos.parques),
    pais,
    dias,
    mes,
    especies: elegidas,
    ritmo,
  });
  const nombre = new Map(datos.especies.map((e) => [e.clave, e.nombre]));
  // en el selector, las especies que se ven en algún parque del país
  const delPais = new Set(filas.filter((f) => f.p === pais).flatMap((f) => f.e));
  const opcionesEspecies = datos.especies.filter((e) => delPais.has(e.clave));

  function alternar(clave: number) {
    const nuevas = elegidas.includes(clave) ? elegidas.filter((c) => c !== clave) : [...elegidas, clave];
    actualizar({ ver: nuevas.join(",") || null });
  }

  return (
    <>
      <section className="seccion formulario-plan">
        <label className="campo">
          <span className="rotulo">País</span>
          <select value={pais} onChange={(e) => actualizar({ pais: e.target.value, ver: null })}>
            {paises.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Días</span>
          <input type="number" min={2} max={30} value={dias} onChange={(e) => actualizar({ dias: e.target.value })} />
        </label>
        <label className="campo">
          <span className="rotulo">Mes del viaje</span>
          <select value={mes} onChange={(e) => actualizar({ mes: e.target.value })}>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Ritmo</span>
          <select value={ritmo} onChange={(e) => actualizar({ ritmo: e.target.value })}>
            {RITMOS.map(([r, t]) => (
              <option key={r} value={r}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </section>
      {opcionesEspecies.length > 0 && (
        <section className="seccion">
          <p className="rotulo">Qué quieres ver (opcional)</p>
          <div className="chips-especies" role="group" aria-label="Animales">
            {opcionesEspecies.map((e) => (
              <button
                key={e.clave}
                type="button"
                className="chip-especie"
                aria-pressed={elegidas.includes(e.clave)}
                onClick={() => alternar(e.clave)}
              >
                {e.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto} alt="" width={28} height={28} loading="lazy" />
                )}
                {e.nombre}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="seccion plan" aria-live="polite">
        <h2>
          {dias} días en {pais}: {plan.etapas.length} {plan.etapas.length === 1 ? "parque" : "parques"}
        </h2>
        {plan.avisos.length > 0 && (
          <ul className="avisos-plan">
            {plan.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        {plan.sinCubrir.length > 0 && (
          <p className="aviso-plan">
            Sin cubrir en {pais}: {plan.sinCubrir.map((k) => nombre.get(k)).join(", ")}. Prueba con más días o mira en{" "}
            <Link href={`/?ver=${plan.sinCubrir.join(",")}&mes=${mes}`}>qué parques del mundo se ven</Link>.
          </p>
        )}
        <ol className="etapas-plan">
          {plan.etapas.map((e) => (
            <li key={e.f.id}>
              {e.traslado && (
                <p className={`traslado ${e.traslado.volar ? "volar" : ""}`}>
                  {e.traslado.volar
                    ? `✈ Vuelo interno o avioneta (por carretera serían ~${e.traslado.km.toLocaleString("es-ES")} km, ${e.traslado.horas} h)`
                    : `🚙 ~${e.traslado.km.toLocaleString("es-ES")} km por carretera, unas ${e.traslado.horas} h`}
                </p>
              )}
              <div className="etapa">
                {e.f.f && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.f.f} alt="" loading="lazy" />
                )}
                <div>
                  <p className="rotulo">
                    {e.noches} {e.noches === 1 ? "noche" : "noches"}
                  </p>
                  <h3>
                    <Link href={`/parque/${e.f.id}`}>{e.f.n}</Link>
                  </h3>
                  {e.especies.length > 0 && (
                    <p className="especies-ok">
                      {e.especies.map((k) => (
                        <span key={k} className="si">
                          ✓ {nombre.get(k)}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className={e.enEpoca === false ? "fuera-temporada" : "en-temporada"}>
                    {e.enEpoca === null
                      ? "Sin datos de temporada"
                      : e.enEpoca
                        ? `Buena época en ${MESES[mes]}`
                        : `${MESES[mes]} no es su mejor época`}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        {plan.etapas.length > 0 && (
          <p className="enlaces">
            {plan.etapas.length > 1 && (
              <Link
                href={`/comparar?p=${plan.etapas
                  .slice(0, MAX_COMPARAR)
                  .map((e) => e.f.id)
                  .join(",")}`}
                onClick={() =>
                  escribirAlmacen(
                    "safaris.comparar",
                    plan.etapas
                      .slice(0, MAX_COMPARAR)
                      .map((e) => e.f.id)
                      .join(","),
                  )
                }
              >
                Comparar estos parques →
              </Link>
            )}
            <Link
              href={`/presupuesto?p=${plan.etapas.map((e) => `${e.f.id}:${e.noches}`).join(",")}&mes=${mes}&vuelos=${
                plan.etapas.filter((e) => e.traslado?.volar).length
              }`}
            >
              Calcular el presupuesto →
            </Link>
          </p>
        )}
        <p className="nota-pie">
          Primera aproximación para saber si el viaje es realista, no un itinerario cerrado: distancias en línea recta
          ×1,3 a 50 km/h (pistas), parques elegidos por observaciones reales (GBIF) y época. La primera y la última
          noche suelen ser en la ciudad del aeropuerto. Revísalo con un operador local antes de reservar.
        </p>
      </section>
    </>
  );
}
