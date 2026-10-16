import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FINANCE_PERIOD_LABEL, FINANCE_PERIODS, type FinancePeriod } from "@/lib/finance-analytics";

export type PeriodValue = {
  periodo: FinancePeriod;
  de?: string | undefined;
  ate?: string | undefined;
};

/** Botões de período do financeiro, com datas quando for "Período". */
export function FinancePeriodPicker({
  value,
  onChange,
}: {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Período">
      {FINANCE_PERIODS.map((period) => {
        const active = value.periodo === period;
        return (
          <button
            key={period}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ ...value, periodo: period })}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {period === "personalizado" && <CalendarDays className="size-3.5" />}
            {FINANCE_PERIOD_LABEL[period]}
          </button>
        );
      })}
      {value.periodo === "personalizado" && (
        <div className="flex w-full items-center gap-2 pt-1 sm:w-auto sm:pt-0">
          <Input
            type="date"
            aria-label="De"
            value={value.de ?? ""}
            onChange={(event) => onChange({ ...value, de: event.target.value || undefined })}
            className="h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Até"
            value={value.ate ?? ""}
            onChange={(event) => onChange({ ...value, ate: event.target.value || undefined })}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
