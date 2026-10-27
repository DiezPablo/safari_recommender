// Qué probabilidad hay de ver cada especie estrella, mes a mes: frecuencia en las fotos de los visitantes
// (iNaturalist) frente a las de su grupo, en cinco niveles. La pregunta número uno de los foros.
import Link from "next/link";
import { INICIALES, MESES } from "@/lib/fechas";
import { nivelFrecuencia } from "@/features/safaris/modelo";

export interface FilaFrecuencia {
  nombre: string;
  href?: string;
  meses: (number | null)[];
}

// un valor de cada nivel, para la leyenda
const LEYENDA = [50, 20, 5, 1, 0].map(nivelFrecuencia);

export default function FrecuenciaAvistamientos({ filas, mesHoy }: { filas: FilaFrecuencia[]; mesHoy: number }) {
  if (!filas.length) return null;
  const media = (f: FilaFrecuencia) => f.meses.reduce<number>((a, b) => a + (b ?? 0), 0);
  const ordenadas = [...filas].sort((a, b) => media(b) - media(a));
  return (
    <section className="seccion frecuencia" aria-labelledby="frecuencia-titulo">
      <h2 className="rotulo" id="frecuencia-titulo">
        Qué probabilidad hay de verlos, mes a mes
      </h2>
      <div className="tabla-desliza">
        <table className="tabla-frecuencia">
          <thead>
            <tr>
              <td />
              {INICIALES.map((l, i) => (
                <th key={i} scope="col" className={i === mesHoy ? "mes-actual" : undefined} title={MESES[i]}>
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((f) => (
              <tr key={f.nombre}>
                <th scope="row">{f.href ? <Link href={f.href}>{f.nombre}</Link> : f.nombre}</th>
                {f.meses.map((v, i) => {
                  const n = nivelFrecuencia(v);
                  return (
                    <td
                      key={i}
                      className={`f-${n.clave}${i === mesHoy ? " mes-actual" : ""}`}
                      title={`${f.nombre} en ${MESES[i]}: ${n.texto}`}
                    >
                      <span className="sr">{`${MESES[i]}: ${n.texto}`}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="leyenda-frecuencia">
        {LEYENDA.map((n) => (
          <span key={n.clave}>
            <i className={`f-${n.clave}`} /> {n.texto}
          </span>
        ))}
      </p>
      <p className="nota-pie">
        Cuántas de las fotos de su grupo (mamíferos, aves…) que suben los visitantes a iNaturalist cada mes son de esa
        especie, sumando los meses vecinos. Corrige que en temporada alta vaya más gente, pero no es una probabilidad
        exacta: los animales vistosos se fotografían más y el resultado depende de tu guía y de la suerte.
      </p>
    </section>
  );
}
