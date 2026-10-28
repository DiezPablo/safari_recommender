// Índice de las páginas de respuesta: cuándo ir (por meses) y adónde (por países).
import type { Metadata } from "next";
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { cargarSafaris, enTemporada, paisesDe, paisesDestacados } from "@/features/safaris/datos";

export const metadata: Metadata = {
  title: "Safari por meses y por países",
  description: "Dónde ir de safari cada mes del año y los mejores parques de cada país, con su mejor época.",
};

export default function IndiceRespuestas() {
  const parques = cargarSafaris()?.parques ?? [];
  return (
    <main className="calendario safaris respuesta">
      <header className="titular">
        <p className="rotulo">
          <Link href="/">Safaris</Link> · Cuándo y adónde
        </p>
        <h1>Safari por meses y por países</h1>
        <p className="entradilla">
          Cada mes, los parques que están en su mejor época; cada país, sus parques y cuándo ir a cada uno.
        </p>
      </header>
      <section className="seccion">
        <h2 className="rotulo">Por meses</h2>
        <ul className="lista-respuesta compacta columnas-respuesta">
          {MESES.map((m, i) => (
            <li key={m}>
              <Link href={`/safari-en/${m}`}>Safari en {m}</Link>{" "}
              <small>{parques.filter((p) => enTemporada(p, i)).length} parques en su mejor época</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="seccion">
        <h2 className="rotulo">Por países</h2>
        <ul className="lista-respuesta compacta columnas-respuesta">
          {[...paisesDestacados()].map(([s, n]) => (
            <li key={s}>
              <Link href={`/safari-en/${s}`}>Safari en {n}</Link>{" "}
              <small>{parques.filter((p) => paisesDe(p).includes(n)).length} destacados</small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
