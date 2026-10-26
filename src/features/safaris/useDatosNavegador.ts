"use client";
// Datos que usan las herramientas del navegador (qué ver, planificador): especies estrella con sus mejores
// parques (/especies.json, generado en el build) y el índice mundial de parques. Se piden una vez por página.
import { useEffect, useState } from "react";
import type { FilaIndice } from "@/features/safaris/modelo";

export interface EspecieQueVer {
  clave: number;
  cientifico: string;
  nombre: string;
  slug: string | null;
  foto: string | null;
  n_parques: number;
}

export interface DatosEspecies {
  especies: EspecieQueVer[];
  /** clave de GBIF → [id del parque, observaciones], de más a menos */
  parques: Record<string, [string, number][]>;
}

function pedir<T>(url: string): Promise<T> {
  return fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(`HTTP ${r.status}`))));
}

export function useDatosNavegador(): { especies: DatosEspecies | null; indice: Map<string, FilaIndice> | null } {
  const [especies, setEspecies] = useState<DatosEspecies | null>(null);
  const [indice, setIndice] = useState<Map<string, FilaIndice> | null>(null);
  useEffect(() => {
    pedir<DatosEspecies>("/especies.json")
      .then(setEspecies)
      .catch(() => {});
    pedir<{ parques: FilaIndice[] }>("/datos/safaris_indice.json")
      .then((d) => setIndice(new Map(d.parques.map((p) => [p.id, p]))))
      .catch(() => {});
  }, []);
  return { especies, indice };
}
