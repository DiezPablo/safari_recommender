"use client";
// Campo numérico que deja borrar y escribir con libertad (en el móvil, al vaciarlo, no salta a otro valor): el
// número solo se aplica cuando es válido y, al salir del campo, vuelve a mostrar el valor aplicado.
import { useState } from "react";

export default function CampoNumero({
  valor,
  onCambio,
  min = 0,
  max = Infinity,
  ...resto
}: {
  valor: number;
  onCambio: (v: number) => void;
  min?: number;
  max?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "type">) {
  const [borrador, setBorrador] = useState<string | null>(null);
  return (
    <input
      {...resto}
      type="number"
      inputMode="numeric"
      min={min}
      max={Number.isFinite(max) ? max : undefined}
      value={borrador ?? String(valor)}
      onChange={(e) => {
        const texto = e.target.value;
        setBorrador(texto);
        const n = Number(texto);
        if (texto !== "" && Number.isFinite(n) && n >= min && n <= max) onCambio(n);
      }}
      onBlur={() => setBorrador(null)}
    />
  );
}
