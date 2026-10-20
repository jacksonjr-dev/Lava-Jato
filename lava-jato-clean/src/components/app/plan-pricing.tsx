import {
  BILLING_PERIODS,
  formatBRL,
  PERIOD_DISCOUNT_PERCENT,
  PERIOD_LABEL,
  periodPrice,
  PLANS,
  type BillingPeriod,
  type PlanId,
} from "@/lib/plans";

/** Mensal / Trimestral / Semestral / Anual, com o desconto de cada período. */
export function BillingPeriodPicker({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (months: BillingPeriod) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Período de pagamento"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1 sm:inline-flex sm:w-auto"
    >
      {BILLING_PERIODS.map((months) => {
        const active = months === value;
        const discount = PERIOD_DISCOUNT_PERCENT[months];
        return (
          <button
            key={months}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(months)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-brand text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PERIOD_LABEL[months]}
            {discount ? (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-background/20" : "bg-success/15 text-success"
                }`}
              >
                -{discount}%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Preço do plano no período escolhido: valor por mês, total e economia. */
export function PlanPrice({ plan, months }: { plan: PlanId; months: BillingPeriod }) {
  const definition = PLANS[plan];
  const price = periodPrice(plan, months);
  if (!price || plan === "GRATIS") {
    return <p className="text-3xl font-bold text-primary">{definition.preco ?? "Sob consulta"}</p>;
  }
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-3xl font-bold text-primary tabular-nums">
          {formatBRL(price.perMonth)}
        </span>
        <span className="text-sm text-muted-foreground">/mês</span>
        {price.savings > 0 ? (
          <span className="text-sm text-muted-foreground line-through tabular-nums">
            {formatBRL(definition.precoMensal ?? 0)}
          </span>
        ) : null}
      </p>
      <p className="mt-1 min-h-5 text-xs text-muted-foreground">
        {months === 1 ? (
          "Cobrado todo mês"
        ) : (
          <>
            {formatBRL(price.total)} a cada {months} meses ·{" "}
            <span className="font-semibold text-success">economize {formatBRL(price.savings)}</span>
          </>
        )}
      </p>
    </div>
  );
}
