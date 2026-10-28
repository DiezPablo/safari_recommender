"use client";
// «Lo que has visto»: para ir marcando los animales durante el viaje. Se guarda en este navegador, de todos los
// viajes (la lista de toda la vida), con el día en que se marcó.
import { escribirAlmacen, useAlmacen } from "@/lib/almacen";
import { CLAVE_VISTOS, leerJson } from "@/features/safaris/viaje";
import type { EspecieQueVer } from "@/features/safaris/useDatosNavegador";

export default function ListaVistos({ especies, total }: { especies: EspecieQueVer[]; total: number }) {
  const vistos = leerJson<Record<string, string>>(useAlmacen(CLAVE_VISTOS), {});
  const enViaje = especies.filter((e) => vistos[e.clave]).length;
  const enTotal = Object.keys(vistos).length;
  const marcar = (clave: number) => {
    const nuevo = { ...vistos };
    if (nuevo[clave]) delete nuevo[clave];
    else nuevo[clave] = new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD en la hora del móvil
    escribirAlmacen(CLAVE_VISTOS, JSON.stringify(nuevo));
  };
  return (
    <section className="seccion" id="vistos">
      <h2>Lo que has visto</h2>
      <p className="nota-pie">
        Márcalos durante el viaje: {enViaje} de {especies.length} de los que se ven en estos parques
        {enTotal > enViaje ? ` · ${enTotal} de ${total} especies emblemáticas en todos tus viajes` : ""}. Se guarda solo
        en este navegador.
      </p>
      <ul className="lista-vistos">
        {especies.map((e) => {
          const fecha = vistos[e.clave];
          return (
            <li key={e.clave}>
              <button
                type="button"
                aria-pressed={!!fecha}
                className={fecha ? "visto" : undefined}
                onClick={() => marcar(e.clave)}
              >
                {e.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto} alt="" loading="lazy" />
                ) : (
                  <span className="sin-foto" />
                )}
                <span className="lista-vistos-nombre">{e.nombre}</span>
                <small>
                  {fecha
                    ? `✓ ${new Date(`${fecha}T12:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
                    : "Sin ver"}
                </small>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
