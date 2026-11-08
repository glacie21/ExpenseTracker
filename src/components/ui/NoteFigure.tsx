import React from "react";
import { formatRupiah } from "@/lib/formatters";

/** A large money figure with a smaller "Rp", as printed on a banknote. */
export function NoteFigure({ value }: { value: number }) {
  const text = formatRupiah(Math.abs(value)).replace(/^Rp/, "");
  return (
    <p className="num font-display text-[2.5rem] leading-none font-semibold sm:text-5xl">
      {value < 0 && (
        <>
          <span className="sr-only">minus </span>
          <span aria-hidden="true">−</span>
        </>
      )}
      <span className="mr-1 align-[0.55em] text-lg font-medium sm:text-xl">Rp</span>
      {text}
    </p>
  );
}
