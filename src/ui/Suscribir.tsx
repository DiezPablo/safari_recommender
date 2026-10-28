// Enlaces para suscribirse a un calendario .ics sin cuenta: el calendario del móvil o del ordenador (webcal),
// Google Calendar o el fichero tal cual. Las aplicaciones lo vuelven a pedir solas, así que se mantiene al día.
import { SITIO } from "@/lib/sitio";
import { IconoCalendario } from "@/ui/Iconos";

export function Suscribir({ ruta, texto }: { ruta: string; texto: string }) {
  const https = `${SITIO}${ruta}`;
  const webcal = https.replace(/^https?:/, "webcal:");
  return (
    <div className="suscribir">
      <p>
        <IconoCalendario /> {texto}
      </p>
      <p className="suscribir-enlaces">
        <a href={webcal}>Añadir a mi calendario</a>
        <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} rel="noopener">
          Google Calendar
        </a>
        <a href={ruta} download>
          Descargar .ics
        </a>
      </p>
    </div>
  );
}
