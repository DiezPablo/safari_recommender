// Índice fijo de la ficha de un parque: la ficha es larga y cada viajero busca una cosa (qué se ve, cuándo,
// cómo organizarlo, dónde dormir). Enlaces a anclas: funciona sin JavaScript.
export default function IndiceFicha({ secciones }: { secciones: [string, string][] }) {
  return (
    <nav className="indice-ficha" aria-label="En esta página">
      {secciones.map(([id, texto]) => (
        <a key={id} href={`#${id}`}>
          {texto}
        </a>
      ))}
    </nav>
  );
}
