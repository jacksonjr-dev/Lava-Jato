import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

/** Cartões de número e gráfico de barras usados na visão geral e no financeiro. */
export function shortMoney(value: number) {
  return value >= 1000
    ? `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : `R$ ${Math.round(value)}`;
}

export function Stat({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string;
  hint: ReactNode;
  to?: "ATIVA" | "TESTE" | "vencendo";
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </>
  );
  const className = "block rounded-2xl border border-border bg-card p-5";
  return to ? (
    <Link
      to="/empresas"
      search={{ status: to }}
      className={`${className} transition-colors hover:border-primary/50`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Change({
  current,
  previous,
  compare = "em relação ao mês anterior",
  emptyPrevious = "Mês anterior sem recebimentos",
}: {
  current: number;
  previous: number;
  compare?: string;
  emptyPrevious?: string;
}) {
  if (previous === 0) {
    return <>{current > 0 ? emptyPrevious : "Nenhum recebimento no período"}</>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  return (
    <>
      <span
        className={change >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}
      >
        {change >= 0 ? "+" : ""}
        {change}%
      </span>{" "}
      {compare}
    </>
  );
}

export function Bars({
  data,
  format,
  short = format,
}: {
  data: Array<{ key: string; label: string; valor: number }>;
  format: (value: number) => string;
  /** Rótulo curto em cima da barra (telas maiores). */
  short?: (value: number) => string;
}) {
  // Toque/clique escolhe a barra; o valor completo aparece acima do gráfico.
  const [selected, setSelected] = useState(data.length - 1);
  const max = Math.max(...data.map((item) => item.valor), 1);
  const dense = data.length > 6;
  const chosen = data[selected] ?? data[data.length - 1];
  return (
    <div>
      {chosen && (
        <p className="text-sm">
          <span className="capitalize text-muted-foreground">{chosen.label}: </span>
          <strong className="tabular-nums">{format(chosen.valor)}</strong>
        </p>
      )}
      <div className="flex h-48 items-end gap-1.5 pt-4 sm:gap-2">
        {data.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={active}
              aria-label={`${item.label}: ${format(item.valor)}`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={`whitespace-nowrap text-[10px] font-semibold tabular-nums text-muted-foreground ${dense ? "hidden lg:block" : ""}`}
              >
                {item.valor ? short(item.valor) : ""}
              </span>
              <span className="flex w-full flex-1 items-end justify-center">
                <span
                  className={`block w-full max-w-12 rounded-t-lg transition-colors ${active ? "bg-primary" : "bg-primary/35 hover:bg-primary/60"}`}
                  style={{ height: `${Math.max((item.valor / max) * 100, item.valor ? 4 : 1)}%` }}
                />
              </span>
              <span
                className={`text-[11px] capitalize sm:text-xs ${active ? "font-semibold" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
