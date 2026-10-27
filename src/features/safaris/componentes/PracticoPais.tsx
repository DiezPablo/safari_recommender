// Lo práctico del país (visado, salud, enchufes, dinero, conducción, propinas) y, en los destacados, si se puede
// hacer el safari por tu cuenta, con las horas de luz del mes: las puertas abren y cierran con el sol.
import { horaSol } from "@/lib/sol";
import { MESES } from "@/lib/fechas";
import {
  EXTERIORES,
  POR_TU_CUENTA,
  type PracticoPais as Practico,
  REVISADO,
  SANIDAD,
  TEXTO_POR_TU_CUENTA,
} from "@/features/safaris/paises";

/** Enchufes de España: C y F. Con otros tipos hace falta adaptador. */
const EN_ESPANA = new Set(["C", "F"]);

function hora(d: Date | null, zona: string): string {
  return d ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: zona }) : "–";
}

export function ItemsPais({ pais, x }: { pais: string; x: Practico }) {
  const adaptador = !x.enchufes.some((e) => EN_ESPANA.has(e));
  return (
    <>
      <li>
        <b>Visado</b> (pasaporte español): {x.visado.texto}{" "}
        <a href={x.visado.url} target="_blank" rel="noopener">
          Web oficial ↗
        </a>
      </li>
      <li>
        <b>Fiebre amarilla:</b> {x.fiebreAmarilla}
      </li>
      <li>
        <b>Malaria:</b> {x.malaria}{" "}
        <a href={SANIDAD} target="_blank" rel="noopener">
          Centros de vacunación internacional ↗
        </a>
      </li>
      <li>
        <b>Enchufes:</b> tipo {x.enchufes.join(", ")}
        {adaptador ? " (lleva adaptador)" : " (el tipo C de España suele valer)"}.
      </li>
      <li>
        <b>Dinero:</b> {x.dinero}
      </li>
      <li>
        <b>Conducción:</b> por la {x.conduce}.
      </li>
      <li>
        <b>Propinas:</b> {x.propinas}
      </li>
      <li className="nota-pie">
        Revisado el {REVISADO}. Cambia a menudo: confírmalo en{" "}
        <a href={EXTERIORES} target="_blank" rel="noopener">
          Exteriores ({pais}) ↗
        </a>
        .
      </li>
    </>
  );
}

export function PorTuCuenta({ id, lat, lon, zona }: { id: string; lat: number; lon: number; zona?: string }) {
  const t = POR_TU_CUENTA[id];
  if (!t) return null;
  const hoy = new Date();
  const fecha = `${hoy.getUTCFullYear()}-${String(hoy.getUTCMonth() + 1).padStart(2, "0")}-15`;
  return (
    <div className="por-tu-cuenta">
      <h3>{TEXTO_POR_TU_CUENTA[t.nivel]}</h3>
      <p>{t.nota}</p>
      {t.nivel !== "guia" && zona && (
        <p>
          En {MESES[hoy.getUTCMonth()]} amanece hacia las <b>{hora(horaSol(fecha, lat, lon, -0.833, true), zona)}</b> y
          anochece hacia las <b>{hora(horaSol(fecha, lat, lon, -0.833, false), zona)}</b>: las puertas y los campamentos
          abren y cierran con la luz (horario exacto en la web del parque), y fuera de hora hay multas.
        </p>
      )}
    </div>
  );
}
