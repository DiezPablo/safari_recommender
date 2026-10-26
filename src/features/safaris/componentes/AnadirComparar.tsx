"use client";
// Buscador del comparador: busca en el índice mundial y añade el parque a la URL (y al comparador guardado).
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type FilaIndice, MAX_COMPARAR } from "@/features/safaris/modelo";
import { useComparador } from "./BotonComparar";

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function AnadirComparar({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [, alternar] = useComparador();
  const [indice, setIndice] = useState<FilaIndice[]>([]);
  const [texto, setTexto] = useState("");
  useEffect(() => {
    fetch("/datos/safaris_indice.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { parques: FilaIndice[] }) => setIndice(d.parques))
      .catch(() => {});
  }, []);
  const q = normalizar(texto.trim());
  const opciones =
    q.length < 2
      ? []
      : indice
          .filter((f) => !ids.includes(f.id) && normalizar(`${f.n} ${f.p ?? ""}`).includes(q))
          .sort((a, b) => b.s - a.s)
          .slice(0, 8);
  if (ids.length >= MAX_COMPARAR)
    return <p className="nota-pie">Máximo {MAX_COMPARAR} parques: quita uno para añadir otro.</p>;
  return (
    <div className="anadir-comparar">
      <label className="campo">
        <span className="rotulo">Añadir un parque</span>
        <input type="search" value={texto} placeholder="Nombre o país" onChange={(e) => setTexto(e.target.value)} />
      </label>
      {opciones.length > 0 && (
        <ul className="opciones-comparar">
          {opciones.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  alternar(f.id);
                  setTexto("");
                  router.push(`/comparar?p=${[...ids, f.id].join(",")}`);
                }}
              >
                {f.n} <small>{f.p ?? ""}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
