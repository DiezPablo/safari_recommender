"use client";
// Añadir o quitar un parque del comparador (hasta 4, guardados en este navegador) y enlace para verlos juntos.
import Link from "next/link";
import { escribirAlmacen, useAlmacen } from "@/lib/almacen";
import { MAX_COMPARAR } from "@/features/safaris/modelo";

const CLAVE = "safaris.comparar";

export function useComparador(): [string[], (id: string) => void] {
  const ids = (useAlmacen(CLAVE) ?? "").split(",").filter(Boolean);
  function alternar(id: string) {
    const nuevos = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-MAX_COMPARAR);
    escribirAlmacen(CLAVE, nuevos.join(",") || null);
  }
  return [ids, alternar];
}

export default function BotonComparar({ id }: { id: string }) {
  const [ids, alternar] = useComparador();
  const dentro = ids.includes(id);
  return (
    <span className="boton-comparar">
      <button type="button" aria-pressed={dentro} onClick={() => alternar(id)}>
        {dentro ? "✓ En el comparador" : "+ Comparar"}
      </button>
      {ids.length > (dentro ? 1 : 0) && (
        <Link href={`/comparar?p=${ids.join(",")}`}>Ver comparador ({ids.length})</Link>
      )}
    </span>
  );
}
