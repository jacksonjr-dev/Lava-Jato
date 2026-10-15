import { forwardRef, type InputHTMLAttributes } from "react";

/** Moldura de placa no padrão Mercosul: faixa azul "BRASIL" e caracteres pretos. */
function PlateFrame({
  size,
  children,
  className = "",
}: {
  size: "md" | "lg";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border-2 border-neutral-900 bg-white text-neutral-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ${className}`}
    >
      <div
        className={`flex items-center justify-between bg-[#0b3d91] px-2 font-sans font-bold tracking-[0.3em] text-white ${
          size === "lg" ? "h-6 text-[10px]" : "h-4 text-[7px]"
        }`}
      >
        <span aria-hidden="true">●</span>
        <span>BRASIL</span>
        <span aria-hidden="true" className="opacity-80">
          BR
        </span>
      </div>
      {children}
    </div>
  );
}

export function PlateBadge({
  plate,
  size = "md",
  className,
}: {
  plate: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <PlateFrame size={size} className={`inline-block ${className ?? ""}`}>
      <p
        className={`plate px-3 text-center font-bold tracking-[0.18em] ${
          size === "lg" ? "py-2 text-4xl" : "py-1 text-lg"
        }`}
      >
        {plate || "———————"}
      </p>
    </PlateFrame>
  );
}

/** Campo de digitação com a aparência de uma placa. */
export const PlateInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PlateInput({ className = "", ...props }, ref) {
    return (
      <PlateFrame
        size="lg"
        className="w-full max-w-sm focus-within:ring-4 focus-within:ring-primary/40"
      >
        <input
          ref={ref}
          {...props}
          className={`plate w-full bg-transparent px-3 py-3 text-center text-4xl font-bold uppercase tracking-[0.18em] text-neutral-950 outline-none placeholder:text-neutral-300 sm:text-5xl ${className}`}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
      </PlateFrame>
    );
  },
);
