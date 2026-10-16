import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/app/panel";
import { Bars, Change, shortMoney, Stat } from "@/components/app/stats";
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
