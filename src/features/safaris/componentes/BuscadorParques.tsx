"use client";
// Buscador de parques del índice mundial (nombre, país o zona conocida como Ndutu): lo usan el comparador y la
// calculadora de presupuesto.
import { useState } from "react";
import { type FilaIndice } from "@/features/safaris/modelo";
import { buscarZonas } from "@/features/safaris/zonas";

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function BuscadorParques({
  indice,
  excluir,
  etiqueta,
  onElegir,
}: {
  indice: FilaIndice[];
  excluir: string[];
  etiqueta: string;
  onElegir: (f: FilaIndice) => void;
}) {
  const [texto, setTexto] = useState("");
  const q = normalizar(texto.trim());
  const deZonas = new Set(buscarZonas(texto).map((z) => z.parque));
  const opciones =
    q.length < 2
      ? []
      : indice
          .filter(
            (f) => !excluir.includes(f.id) && (deZonas.has(f.id) || normalizar(`${f.n} ${f.p ?? ""}`).includes(q)),
          )
          .sort((a, b) => Number(deZonas.has(b.id)) - Number(deZonas.has(a.id)) || b.s - a.s)
          .slice(0, 8);
  return (
    <div className="anadir-comparar">
      <label className="campo">
        <span className="rotulo">{etiqueta}</span>
        <input
          type="search"
          value={texto}
          placeholder="Nombre, zona o país"
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>
      {opciones.length > 0 && (
        <ul className="opciones-comparar">
          {opciones.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setTexto("");
                  onElegir(f);
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
