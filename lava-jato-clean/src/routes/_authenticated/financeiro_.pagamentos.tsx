import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronRight, Receipt, Search, X } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { CountUp } from "@/components/app/motion";
import { UpgradeNotice } from "@/components/app/plan-gate";
import { FinancePeriodPicker } from "@/components/app/finance-period-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeature } from "@/hooks/use-plan";
import { listPayments } from "@/lib/lavajato.functions";
import { brl, PAYMENT_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/lib/plate";
import {
  FINANCE_PERIODS,
  FINANCE_PERIOD_LABEL,
  formatDay,
  matchesPaymentSearch,
  parseDay,
  periodRange,
  totals,
  type FinancePeriod,
} from "@/lib/finance-analytics";

type PaymentsSearch = {
  periodo?: FinancePeriod;
  de?: string | undefined;
  ate?: string | undefined;
  metodo?: PaymentMethod;
  q?: string;
};

export const Route = createFileRoute("/_authenticated/financeiro_/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — LavaPro" }] }),
  validateSearch: (search: Record<string, unknown>): PaymentsSearch => {
    const out: PaymentsSearch = {};
    const periodo = search["periodo"];
    if (typeof periodo === "string" && (FINANCE_PERIODS as readonly string[]).includes(periodo)) {
      out.periodo = periodo as FinancePeriod;
    }
    for (const key of ["de", "ate"] as const) {
      const value = search[key];
      if (typeof value === "string" && parseDay(value)) out[key] = value;
    }
    const metodo = search["metodo"];
    if (typeof metodo === "string" && (PAYMENT_METHODS as readonly string[]).includes(metodo)) {
      out.metodo = metodo as PaymentMethod;
    }
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"].slice(0, 60);
    return out;
  },
  component: PaymentsPage,
});

function PaymentsPage() {
  const financeiroLiberado = useFeature("financeiro");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loadPayments = useServerFn(listPayments);
  const periodo = search.periodo ?? "mes";
  const range = periodRange(periodo, new Date(), search);

  const query = useQuery({
    queryKey: ["payments-list", formatDay(range.from), formatDay(range.to)],
    queryFn: () =>
      loadPayments({ data: { from: range.from.toISOString(), to: range.to.toISOString() } }),
    enabled: financeiroLiberado,
    placeholderData: (last) => last,
  });

  const rows = useMemo(
    () =>
      (query.data ?? []).filter(
        (payment) =>
          (!search.metodo || payment.metodo === search.metodo) &&
          matchesPaymentSearch(payment, search.q ?? ""),
      ),
    [query.data, search.metodo, search.q],
  );
  const summary = totals(rows);

  function update(patch: { [K in keyof PaymentsSearch]?: PaymentsSearch[K] | undefined }) {
    const next = { ...search, ...patch } as PaymentsSearch;
    if (next.periodo !== "personalizado") {
      delete next.de;
      delete next.ate;
    }
    if (!next.q) delete next.q;
    if (!next.metodo) delete next.metodo;
    void navigate({ search: next, replace: true });
  }

  if (!financeiroLiberado) {
    return (
      <AppShell title="Pagamentos" back="/financeiro" wide>
        <UpgradeNotice feature="financeiro" />
      </AppShell>
    );
  }

  const periodLabel =
    periodo === "personalizado"
      ? `${range.from.toLocaleDateString("pt-BR")} a ${new Date(range.to.getTime() - 1).toLocaleDateString("pt-BR")}`
      : FINANCE_PERIOD_LABEL[periodo];

  return (
    <AppShell title="Pagamentos" back="/financeiro" wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">Financeiro</p>
          <h1 className="mt-1 text-2xl font-bold">Pagamentos recebidos</h1>
          <p className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-xl font-bold tabular-nums text-primary">
              <CountUp value={summary.receita} format={brl} />
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagamentos</p>
            <p className="text-xl font-bold tabular-nums">{summary.pagamentos}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-card/70 p-4">
        <FinancePeriodPicker
          value={{ periodo, de: search.de, ate: search.ate }}
          onChange={(next) => update(next)}
        />
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Forma de pagamento"
        >
          <MethodChip active={!search.metodo} onClick={() => update({ metodo: undefined })}>
            Todas
          </MethodChip>
          {PAYMENT_METHODS.map((method) => (
            <MethodChip
              key={method}
              active={search.metodo === method}
              onClick={() => update({ metodo: method })}
            >
              {PAYMENT_LABEL[method]}
            </MethodChip>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search.q ?? ""}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Placa, cliente ou nº da OS"
            aria-label="Buscar pagamentos"
            className="h-11 pr-10 pl-10"
          />
          {search.q && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => update({ q: "" })}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {query.isLoading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}
      {query.isError && (
        <p className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {!query.isLoading && rows.length === 0 && (
        <div className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center">
          <Receipt className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum pagamento encontrado.</p>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {rows.map((payment) => {
            const paidAt = new Date(payment.pago_em);
            return (
              <m.li
                key={payment.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Link
                  to="/os/$id"
                  params={{ id: payment.orderId }}
                  className="interactive-panel group grid grid-cols-[1fr_auto] items-center gap-3 border border-border bg-card p-4 sm:grid-cols-[110px_1fr_auto_auto]"
                >
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    <p className="font-semibold text-foreground">
                      {paidAt.toLocaleDateString("pt-BR")}
                    </p>
                    <p>
                      {paidAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="plate font-bold">{payment.placa ?? "—"}</span>
                      <span className="text-muted-foreground">
                        {payment.numero != null ? `OS #${payment.numero}` : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium">
                      {payment.cliente ?? "Cliente não informado"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      <span className="sm:hidden">{paidAt.toLocaleDateString("pt-BR")} · </span>
                      {payment.itens.map((item) => item.nome).join(" · ")}
                    </p>
                  </div>
                  <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground sm:inline">
                    {PAYMENT_LABEL[payment.metodo as PaymentMethod] ?? payment.metodo}
                  </span>
                  <span className="flex items-center gap-1 text-right">
                    <span>
                      <span className="block font-bold tabular-nums">{brl(payment.valor)}</span>
                      <span className="block text-[10px] uppercase text-muted-foreground sm:hidden">
                        {PAYMENT_LABEL[payment.metodo as PaymentMethod] ?? payment.metodo}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                </Link>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </AppShell>
  );
}

function MethodChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
