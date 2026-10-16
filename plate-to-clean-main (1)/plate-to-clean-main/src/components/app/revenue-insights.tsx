import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Pin, TrendingDown, TrendingUp, X } from "lucide-react";
import { CountUp } from "@/components/app/motion";
import { FinancePeriodPicker, type PeriodValue } from "@/components/app/finance-period-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { listPayments } from "@/lib/lavajato.functions";
import { brl, PAYMENT_LABEL, type PaymentMethod } from "@/lib/plate";
import {
  formatDay,
  paymentsInRange,
  periodRange,
  previousRange,
  revenueByDay,
  revenueByMethod,
  serviceStats,
  totals,
  variation,
  type DayRevenue,
} from "@/lib/finance-analytics";

const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Receita interativa: período, comparação, gráfico por dia, serviços e formas de pagamento. */
export function RevenueInsights() {
  const loadPayments = useServerFn(listPayments);
  const [period, setPeriod] = useState<PeriodValue>({ periodo: "30d" });
  const [rankBy, setRankBy] = useState<"usos" | "receita">("receita");

  const range = periodRange(period.periodo, new Date(), period);
  const previous = previousRange(range);
  const rangeKey = `${formatDay(previous.from)}_${formatDay(range.to)}`;
  // Uma consulta cobre o período atual e o anterior (para a comparação).
  const query = useQuery({
    queryKey: ["payments", rangeKey],
    queryFn: () =>
      loadPayments({ data: { from: previous.from.toISOString(), to: range.to.toISOString() } }),
    placeholderData: (last) => last,
  });

  const analysis = useMemo(() => {
    const all = query.data ?? [];
    const current = paymentsInRange(all, range);
    const before = paymentsInRange(all, previous);
    return {
      current,
      now: totals(current),
      before: totals(before),
      days: revenueByDay(current, range),
      methods: revenueByMethod(current),
      services: serviceStats(current, rankBy),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, rangeKey, rankBy]);

  return (
    <section className="mt-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">Análise de receita</p>
          <h2 className="mt-1 text-xl font-bold">O que está entrando</h2>
        </div>
        <FinancePeriodPicker value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Receita"
          value={analysis.now.receita}
          format={brl}
          change={variation(analysis.now.receita, analysis.before.receita)}
          loading={query.isLoading}
        />
        <Kpi
          label="Pagamentos"
          value={analysis.now.pagamentos}
          change={variation(analysis.now.pagamentos, analysis.before.pagamentos)}
          loading={query.isLoading}
        />
        <Kpi
          label="Ticket médio"
          value={analysis.now.ticketMedio}
          format={brl}
          change={variation(analysis.now.ticketMedio, analysis.before.ticketMedio)}
          loading={query.isLoading}
        />
      </div>

      <Panel
        title="Receita por dia"
        hint="Passe o mouse para ver o dia · clique na barra para fixar (clique de novo para soltar)"
      >
        {query.isLoading ? (
          <Skeleton className="mt-5 h-56 rounded-xl" />
        ) : (
          <DayChart days={analysis.days} />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel
          title="Serviços"
          action={
            <div className="flex rounded-full border border-border p-0.5 text-[11px] font-semibold">
              {(
                [
                  ["receita", "Mais retorno"],
                  ["usos", "Mais usados"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={rankBy === key}
                  onClick={() => setRankBy(key)}
                  className={`relative rounded-full px-3 py-1.5 transition-colors ${
                    rankBy === key ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {rankBy === key && (
                    <m.span
                      layoutId="rank-toggle"
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          }
        >
          {analysis.services.length === 0 ? (
            <Empty />
          ) : (
            <ol className="mt-4 space-y-3">
              <AnimatePresence initial={false}>
                {analysis.services.map((service, index) => {
                  const share = rankBy === "usos" ? service.shareUsos : service.shareReceita;
                  return (
                    <m.li
                      key={service.nome}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border/60 bg-background/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {service.nome}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {service.usos} {service.usos === 1 ? "uso" : "usos"} ·{" "}
                            {brl(service.ticket)} cada
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums">{brl(service.receita)}</p>
                          <p className="text-[11px] tabular-nums text-primary">
                            {Math.round(share * 100)}%{" "}
                            {rankBy === "usos" ? "dos usos" : "da receita"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <m.div
                          className="h-full rounded-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, share * 100)}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </m.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </Panel>

        <Panel title="Formas de pagamento">
          {analysis.methods.length === 0 ? (
            <Empty />
          ) : (
            <ul className="mt-4 space-y-4">
              {analysis.methods.map((method) => (
                <li key={method.metodo}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{PAYMENT_LABEL[method.metodo as PaymentMethod] ?? method.metodo}</span>
                    <span className="font-bold tabular-nums">{brl(method.receita)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <m.div
                        className="h-full rounded-full bg-brand"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, method.share * 100)}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                    <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
                      {Math.round(method.share * 100)}% · {method.pagamentos}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/financeiro/pagamentos"
            search={{
              periodo: period.periodo,
              ...(period.periodo === "personalizado" ? { de: period.de, ate: period.ate } : {}),
            }}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Ver todos os pagamentos do período <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>
    </section>
  );
}

function DayChart({ days }: { days: DayRevenue[] }) {
  // hovered: prévia ao passar o mouse; pinned: fixado com clique (só solta com outro clique).
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const max = Math.max(1, ...days.map((day) => day.receita));
  const dense = days.length > 14;
  const shownDay = hovered ?? pinned;
  const active = days.find((day) => day.day === shownDay) ?? null;
  const isPinnedShown = active !== null && active.day === pinned && hovered === null;

  return (
    <div className="mt-5">
      <div className="min-h-7 text-xs">
        <AnimatePresence mode="wait" initial={false}>
          {active ? (
            <m.div
              key={active.day}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1 ${
                isPinnedShown ? "bg-primary/10 ring-1 ring-primary/40" : ""
              }`}
            >
              {isPinnedShown && <Pin className="size-3.5 text-primary" aria-label="Fixado" />}
              <span className="font-semibold">
                {WEEKDAY[active.date.getDay()]}, {active.date.toLocaleDateString("pt-BR")}
              </span>
              <span className="font-bold text-primary tabular-nums">{brl(active.receita)}</span>
              <span className="text-muted-foreground">
                {active.pagamentos} {active.pagamentos === 1 ? "pagamento" : "pagamentos"}
              </span>
              {active.pagamentos > 0 && (
                <Link
                  to="/financeiro/pagamentos"
                  search={{ periodo: "personalizado", de: active.day, ate: active.day }}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Ver pagamentos
                </Link>
              )}
              {isPinnedShown && (
                <button
                  type="button"
                  onClick={() => setPinned(null)}
                  aria-label="Soltar o dia fixado"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </m.div>
          ) : (
            <m.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 py-1 text-muted-foreground"
            >
              Maior dia: {brl(Math.max(0, ...days.map((day) => day.receita)))}
            </m.p>
          )}
        </AnimatePresence>
      </div>
      <div
        className="mt-3 flex h-48 items-end gap-[3px] sm:gap-1"
        onMouseLeave={() => setHovered(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPinned(null);
        }}
      >
        {days.map((day, index) => {
          const isPinned = pinned === day.day;
          const isHovered = hovered === day.day;
          return (
            <button
              key={day.day}
              type="button"
              aria-label={`${day.date.toLocaleDateString("pt-BR")}: ${brl(day.receita)}`}
              aria-pressed={isPinned}
              onMouseEnter={() => setHovered(day.day)}
              onFocus={() => setHovered(day.day)}
              onBlur={() => setHovered(null)}
              onClick={() => setPinned(isPinned ? null : day.day)}
              className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              {isPinned && (
                <m.span
                  layoutId="pinned-day"
                  className="absolute -top-1 size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <m.span
                className={`w-full rounded-t-md transition-colors ${
                  isPinned
                    ? "bg-primary shadow-glow"
                    : isHovered
                      ? "bg-primary/85"
                      : day.receita
                        ? "bg-primary/50"
                        : "bg-border"
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(2, (day.receita / max) * 100)}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 20, delay: index * 0.01 }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1">
        {days.map((day, index) => (
          <span
            key={day.day}
            className={`min-w-0 flex-1 truncate text-center text-[9px] ${
              pinned === day.day ? "font-bold text-primary" : "text-muted-foreground"
            }`}
          >
            {dense
              ? index % Math.ceil(days.length / 8) === 0 || pinned === day.day
                ? day.date.getDate()
                : ""
              : WEEKDAY[day.date.getDay()]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  format,
  change,
  loading,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
  change: number | null;
  loading: boolean;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums">
          <CountUp value={value} {...(format ? { format } : {})} />
        </p>
      )}
      <p
        className={`mt-1 flex items-center gap-1 text-[11px] ${
          change === null ? "text-muted-foreground" : up ? "text-success" : "text-destructive"
        }`}
      >
        {change === null ? (
          "sem base no período anterior"
        ) : (
          <>
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {up ? "+" : ""}
            {change.toFixed(0)}% vs. período anterior
          </>
        )}
      </p>
    </div>
  );
}

function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Nenhum pagamento neste período.
    </p>
  );
}
