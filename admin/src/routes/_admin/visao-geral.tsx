import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/app/panel";
import { getMetrics } from "@/lib/admin.functions";
import { formatMoney } from "@/lib/billing";

export const Route = createFileRoute("/_admin/visao-geral")({
  head: () => ({ meta: [{ title: "Visão geral — LavaPro Admin" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const load = useServerFn(getMetrics);
  const query = useQuery({ queryKey: ["metrics"], queryFn: () => load() });
  const metrics = query.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receita das assinaturas e evolução das empresas cadastradas.
        </p>
      </div>

      {query.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}
      {query.isError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {metrics && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Recebido no mês"
              value={formatMoney(metrics.receitaMes)}
              hint={<Change current={metrics.receitaMes} previous={metrics.receitaMesAnterior} />}
            />
            <Stat
              label="Receita recorrente mensal"
              value={formatMoney(metrics.mrr)}
              hint={
                metrics.pagantesSemPagamento > 0
                  ? `${metrics.pagantesSemPagamento} pagante(s) sem pagamento registrado ficam de fora`
                  : "Estimada pelo último pagamento de cada pagante"
              }
            />
            <Stat
              label="Empresas pagantes"
              value={String(metrics.pagantes.BASICO + metrics.pagantes.MAX)}
              hint={`Básico ${metrics.pagantes.BASICO} · Max ${metrics.pagantes.MAX}`}
              to="ATIVA"
            />
            <Stat
              label="Em teste agora"
              value={String(metrics.testesAtivos)}
              hint="Testes de 7 dias do Max em andamento"
              to="TESTE"
            />
            <Stat
              label="Conversão de teste para pago"
              value={
                metrics.conversao.taxa === null
                  ? "—"
                  : `${Math.round(metrics.conversao.taxa * 100)}%`
              }
              hint={
                metrics.conversao.avaliadas
                  ? `${metrics.conversao.convertidas} de ${metrics.conversao.avaliadas} cadastradas nos últimos 90 dias`
                  : "Sem cadastros com teste encerrado nos últimos 90 dias"
              }
            />
            <Stat
              label="Vencendo em 7 dias"
              value={String(metrics.vencendo)}
              hint="Bom momento para cobrar a renovação"
              to="vencendo"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Recebido por mês">
              <Bars data={metrics.receitaPorMes} format={formatMoney} short={shortMoney} />
            </Card>
            <Card title="Novas empresas por mês">
              <Bars data={metrics.novasPorMes} format={String} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function shortMoney(value: number) {
  return value >= 1000
    ? `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : `R$ ${Math.round(value)}`;
}

function Stat({
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

function Change({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <>{current > 0 ? "Mês anterior sem recebimentos" : "Nenhum recebimento ainda"}</>;
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
      em relação ao mês anterior
    </>
  );
}

function Bars({
  data,
  format,
  short = format,
}: {
  data: Array<{ key: string; label: string; valor: number }>;
  format: (value: number) => string;
  /** Rótulo curto em cima da barra; o valor completo fica na dica. */
  short?: (value: number) => string;
}) {
  const max = Math.max(...data.map((item) => item.valor), 1);
  return (
    <div className="flex h-48 items-end gap-2 pt-6">
      {data.map((item, index) => {
        const current = index === data.length - 1;
        return (
          <div
            key={item.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-muted-foreground">
              {item.valor ? short(item.valor) : ""}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={`w-full max-w-12 rounded-t-lg ${current ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${Math.max((item.valor / max) * 100, item.valor ? 4 : 1)}%` }}
                title={`${item.label}: ${format(item.valor)}`}
              />
            </div>
            <span
              className={`text-xs capitalize ${current ? "font-semibold" : "text-muted-foreground"}`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
