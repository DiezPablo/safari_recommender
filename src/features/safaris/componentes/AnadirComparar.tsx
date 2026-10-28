"use client";
// Buscador del comparador: añade el parque a la URL (y al comparador guardado).
import { useRouter } from "next/navigation";
import { MAX_COMPARAR } from "@/features/safaris/modelo";
import { useDatosNavegador } from "@/features/safaris/useDatosNavegador";
import { useComparador } from "./BotonComparar";
import BuscadorParques from "./BuscadorParques";

export default function AnadirComparar({ ids, mes }: { ids: string[]; mes?: number }) {
  const router = useRouter();
  const [, alternar] = useComparador();
  const { indice } = useDatosNavegador(false);
  if (ids.length >= MAX_COMPARAR)
    return <p className="nota-pie">Máximo {MAX_COMPARAR} parques: quita uno para añadir otro.</p>;
  return (
    <BuscadorParques
      indice={indice ? [...indice.values()] : []}
      excluir={ids}
      etiqueta="Añadir un parque"
      onElegir={(f) => {
        alternar(f.id);
        router.push(`/comparar?p=${[...ids, f.id].join(",")}${mes !== undefined ? `&mes=${mes}` : ""}`);
      }}
    />
  );
}
