import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { AlertTriangle, CalendarClock, ChevronRight, Download, Receipt } from "lucide-react";
import { PLANS } from "@core/lib/plans";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, Choice } from "@/components/app/panel";
import { Bars, Change, shortMoney, Stat } from "@/components/app/stats";
import { formatDate } from "@/components/app/subscription-badge";
import { getFinanceData } from "@/lib/admin.functions";
import { formatMoney, METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/lib/billing";
import {
  FINANCE_PERIODS,
  financeRange,
  financeSummary,
  paymentsCsv,
  PERIOD_LABEL,
  type Breakdown,
  type FinancePeriod,
  type Forecast,
} from "@/lib/finance";

type Search = { periodo?: FinancePeriod; forma?: PaymentMethod };

export const Route = createFileRoute("/_admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — LavaPro Admin" }] }),
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    const periodo = search["periodo"];
    if (typeof periodo === "string" && (FINANCE_PERIODS as readonly string[]).includes(periodo)) {
      out.periodo = periodo as FinancePeriod;
    }
    const forma = search["forma"];
    if (typeof forma === "string" && (PAYMENT_METHODS as readonly string[]).includes(forma)) {
      out.forma = forma as PaymentMethod;
    }
    return out;
  },
  component: FinancePage,
});

function FinancePage() {
  const { periodo = "mes", forma } = Route.useSearch();
  const navigate = Route.useNavigate();
  const load = useServerFn(getFinanceData);
  const query = useQuery({ queryKey: ["finance"], queryFn: () => load() });

  const summary = useMemo(
    () => query.data && financeSummary(periodo, query.data.payments, query.data.companies),
    [query.data, periodo],
  );
  const { compare } = financeRange(periodo);
  const listed = summary
    ? summary.pagamentos.filter((payment) => !forma || payment.method === forma)
    : [];

  function exportCsv() {
    // BOM para o Excel reconhecer os acentos.
    const blob = new Blob(["﻿" + paymentsCsv(listed)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lavapro-pagamentos-${periodo}${forma ? `-${forma.toLowerCase()}` : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">Assinaturas do LavaPro</p>
          <h1 className="text-2xl font-bold">Financeiro</h1>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Período">
          {FINANCE_PERIODS.map((id) => (
            <Choice
              key={id}
              active={periodo === id}
              onClick={() =>
                void navigate({ search: (prev) => ({ ...prev, periodo: id }), replace: true })
              }
            >
              {PERIOD_LABEL[id]}
            </Choice>
          ))}
        </div>
      </div>

      {query.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}
      {query.isError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Recebido"
              value={formatMoney(summary.recebido)}
              hint={
                <Change
                  current={summary.recebido}
                  previous={summary.anterior}
                  compare={compare}
                  emptyPrevious="Período anterior sem recebimentos"
                />
              }
            />
            <Stat
              label="Pagamentos"
              value={String(summary.quantidade)}
              hint={`de ${summary.empresasPagantes} empresa(s)`}
            />
            <Stat
              label="Ticket médio"
              value={summary.ticketMedio === null ? "—" : formatMoney(summary.ticketMedio)}
              hint="Valor médio por pagamento"
            />
            <Stat
              label="A receber em 30 dias"
              value={formatMoney(summary.aReceber.total)}
              hint={
                summary.aReceber.semValor
                  ? `${summary.aReceber.itens.length} renovação(ões); ${summary.aReceber.semValor} sem valor de referência`
                  : `${summary.aReceber.itens.length} renovação(ões) previstas`
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card title="Recebido nos últimos 12 meses">
              <Bars data={summary.porMes} format={formatMoney} short={shortMoney} />
            </Card>
            <Card title="A receber" icon={<CalendarClock className="size-4 text-primary" />}>
              <Receivables items={summary.aReceber.itens} />
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title={`Por forma de pagamento · ${PERIOD_LABEL[periodo]}`}>
              <BreakdownList items={summary.porForma} total={summary.recebido} />
            </Card>
            <Card title={`Por plano · ${PERIOD_LABEL[periodo]}`}>
              <BreakdownList items={summary.porPlano} total={summary.recebido} />
            </Card>
          </div>

          <Card
            title={`Pagamentos · ${PERIOD_LABEL[periodo]}`}
            icon={<Receipt className="size-4 text-primary" />}
            action={
              <button
                type="button"
                onClick={exportCsv}
                disabled={!listed.length}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-40"
              >
                <Download className="size-3.5" /> Planilha
              </button>
            }
          >
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Forma de pagamento">
              <Choice
                active={!forma}
                onClick={() =>
                  void navigate({
                    search: ({ forma: _forma, ...prev }) => prev,
                    replace: true,
                  })
                }
              >
                Todas
              </Choice>
              {summary.porForma.map((item) => (
                <Choice
                  key={item.key}
                  active={forma === item.key}
                  onClick={() =>
                    void navigate({
                      search: (prev) => ({ ...prev, forma: item.key as PaymentMethod }),
                      replace: true,
                    })
                  }
                >
                  {item.label} ({item.quantidade})
                </Choice>
              ))}
            </div>
            <PaymentsTable payments={listed} />
          </Card>
        </>
      )}
    </div>
  );
}

function Receivables({ items }: { items: Forecast[] }) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">Nenhuma renovação nos próximos 30 dias.</p>;
  }
  return (
    <ul className="-mx-2 max-h-80 divide-y divide-border overflow-y-auto">
      {items.map((item) => (
        <li key={item.company.id}>
          <Link
            to="/empresas/$id"
            params={{ id: item.company.id }}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.company.nome}</p>
              <p
                className={`flex items-center gap-1 text-xs ${item.overdue ? "text-warning" : "text-muted-foreground"}`}
              >
                {item.overdue && <AlertTriangle className="size-3.5" />}
                {item.overdue ? "Venceu" : "Vence"} em {formatDate(item.dueAt)} ·{" "}
                {PLANS[item.company.subscription.plan].nome}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {item.expected === null ? "—" : formatMoney(item.expected)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BreakdownList({ items, total }: { items: Breakdown; total: number }) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">Nenhum pagamento no período.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = total ? Math.round((item.valor / total) * 100) : 0;
        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="tabular-nums">
                {formatMoney(item.valor)}{" "}
                <span className="text-xs text-muted-foreground">· {share}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PaymentsTable({
  payments,
}: {
  payments: ReturnType<typeof financeSummary>["pagamentos"];
}) {
  if (!payments.length) {
    return <p className="text-xs text-muted-foreground">Nenhum pagamento no período.</p>;
  }
  return (
    <div className="-mx-2">
      <div className="hidden grid-cols-[90px_minmax(0,1.6fr)_110px_110px_minmax(0,1fr)] gap-3 border-b border-border px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <span>Data</span>
        <span>Empresa</span>
        <span className="text-right">Valor</span>
        <span>Forma</span>
        <span>Plano</span>
      </div>
      <ul className="divide-y divide-border">
        {payments.map((payment) => (
          <li key={payment.id}>
            <Link
              to="/empresas/$id"
              params={{ id: payment.tenant_id }}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 rounded-lg px-2 py-2.5 text-sm hover:bg-secondary/50 md:grid-cols-[90px_minmax(0,1.6fr)_110px_110px_minmax(0,1fr)] md:items-center"
            >
              <span className="order-3 text-xs text-muted-foreground md:order-none md:text-sm md:text-foreground">
                {formatDate(payment.paid_at)}
              </span>
              <span className="order-1 truncate font-semibold md:order-none md:font-normal">
                {payment.tenantName}
              </span>
              <span className="order-2 text-right font-semibold tabular-nums md:order-none">
                {formatMoney(Number(payment.amount))}
              </span>
              <span className="order-4 text-right text-xs text-muted-foreground md:order-none md:text-left md:text-sm">
                {METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method}
              </span>
              <span className="hidden truncate text-muted-foreground md:block">
                {payment.plan && payment.months
                  ? `${PLANS[payment.plan as "BASICO" | "MAX"]?.nome ?? payment.plan} · ${payment.months} ${payment.months === 1 ? "mês" : "meses"}`
                  : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
