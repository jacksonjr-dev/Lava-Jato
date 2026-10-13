import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Car,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Loader2,
  QrCode,
  ReceiptText,
  Save,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financialSummary, getPixSettings, updatePixSettings } from "@/lib/lavajato.functions";
import { exportMonthlyExcel, exportMonthlyPdf } from "@/lib/financial-export";
import { brl } from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — LavaPro" },
      { name: "description", content: "Faturamento, pagamentos e desempenho do lava-jato." },
    ],
  }),
  component: FinancialPage,
});

const METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  DINHEIRO: "Dinheiro",
  OUTRO: "Outro",
};

function FinancialPage() {
  const loadSummary = useServerFn(financialSummary);
  const query = useQuery({ queryKey: ["financial-summary"], queryFn: () => loadSummary() });
  const data = query.data;
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  async function exportReport(format: "excel" | "pdf") {
    if (!data) return;
    setExporting(format);
    try {
      if (format === "excel") await exportMonthlyExcel(data);
      else await exportMonthlyPdf(data);
      toast.success(`Balanço de ${data.periodo.titulo} exportado.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível exportar o balanço.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <AppShell title="Financeiro" wide>
      <div className="pb-4">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border/60 pb-6">
          <div>
            <p className="text-xs font-semibold text-primary">Visão do proprietário</p>
            <h1 className="mt-2 text-[clamp(2rem,8vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.06em]">
              Caixa e desempenho
            </h1>
          </div>
          <div className="w-full max-w-md lg:w-auto">
            <p className="text-xs leading-5 text-muted-foreground">
              Valores calculados a partir dos pagamentos registrados e das ordens de serviço do mês.
            </p>
            {data && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-w-0 px-3"
                  disabled={exporting !== null}
                  onClick={() => void exportReport("excel")}
                >
                  {exporting === "excel" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="size-4" />
                  )}
                  Excel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-w-0 px-3"
                  disabled={exporting !== null}
                  onClick={() => void exportReport("pdf")}
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        {query.isLoading && (
          <p className="py-10 text-sm text-muted-foreground">Carregando dados financeiros…</p>
        )}
        {query.isError && (
          <p className="my-8 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {(query.error as Error).message}
          </p>
        )}

        {data && (
          <>
            <section className="reveal-stagger mt-6 grid overflow-hidden border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
              <FinancialMetric
                icon={<Banknote className="size-5" />}
                label="HOJE"
                value={brl(data.faturamentoDia)}
                trend="Caixa recebido"
              />
              <FinancialMetric
                icon={<WalletCards className="size-5" />}
                label="ÚLTIMOS 7 DIAS"
                value={brl(data.faturamentoSemana)}
                trend={`${data.veiculosDia} veículos hoje`}
              />
              <FinancialMetric
                icon={<ReceiptText className="size-5" />}
                label="MÊS ATUAL"
                value={brl(data.faturamentoMes)}
                trend={`${data.pagosOuEntregues} pagamentos recebidos no mês`}
              />
              <FinancialMetric
                icon={<Car className="size-5" />}
                label="TICKET MÉDIO"
                value={brl(data.ticketMedio)}
                trend={`${data.veiculosMes} veículos no mês`}
              />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="interactive-panel border border-border bg-card p-5 md:p-6">
                <SectionTitle index="01" title="Receita dos últimos 7 dias" />
                <RevenueBars values={data.last7} />
              </div>

              <div className="interactive-panel border border-border bg-card p-5 md:p-6">
                <SectionTitle index="02" title="Formas de pagamento" />
                <div className="mt-6 divide-y divide-border/60">
                  {data.porMetodo.map((item) => {
                    const share =
                      data.faturamentoMes > 0 ? (item.valor / data.faturamentoMes) * 100 : 0;
                    return (
                      <div key={item.metodo} className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-sm">
                            <CreditCard className="size-4 text-primary" />
                            {METHOD_LABEL[item.metodo] ?? item.metodo}
                          </span>
                          <span className="font-bold tabular-nums">{brl(item.valor)}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="bar-grow h-full bg-brand"
                            style={{ width: `${Math.min(100, share)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {data.porMetodo.length === 0 && (
                    <p className="py-6 text-sm text-muted-foreground">
                      Nenhum pagamento registrado neste mês.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="interactive-panel border border-border bg-card p-5 md:p-6">
                <SectionTitle index="03" title="Serviços com maior saída" />
                <div className="mt-5 divide-y divide-border/60">
                  {data.topServicos.map((service, index) => (
                    <div
                      key={service.nome}
                      className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-3 py-4 sm:grid-cols-[32px_minmax(0,1fr)_auto]"
                    >
                      <span className="text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{service.nome}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {service.qtd} execuções
                        </p>
                      </div>
                      <p className="col-start-2 font-bold tabular-nums sm:col-start-auto">
                        {brl(service.valor)}
                      </p>
                    </div>
                  ))}
                  {data.topServicos.length === 0 && (
                    <p className="py-6 text-sm text-muted-foreground">
                      Nenhum serviço registrado neste mês.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid overflow-hidden border border-border bg-card sm:grid-cols-2">
                <OperationalNumber
                  label="EM ANDAMENTO"
                  value={String(data.emAndamento)}
                  icon={<ArrowUpRight className="size-5" />}
                />
                <OperationalNumber
                  label="PAGAMENTOS NO MÊS"
                  value={String(data.pagosOuEntregues)}
                  icon={<ArrowDownRight className="size-5" />}
                />
                <div className="col-span-full border-t border-border/60 p-5 md:p-6">
                  <p className="text-xs text-muted-foreground">Leitura do mês</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    “Pagos / entregues” considera apenas ordens com esses dois status no mês. As
                    ordens em lavagem ou aguardando pagamento continuam em andamento e não entram no
                    faturamento.
                  </p>
                </div>
              </div>
            </section>

            <PixSettingsCard />
          </>
        )}
      </div>
    </AppShell>
  );
}

function PixSettingsCard() {
  const queryClient = useQueryClient();
  const loadSettings = useServerFn(getPixSettings);
  const saveSettings = useServerFn(updatePixSettings);
  const query = useQuery({ queryKey: ["pix-settings"], queryFn: () => loadSettings() });
  const [pixKey, setPixKey] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [city, setCity] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!query.data || dirty) return;
    setPixKey(query.data.pix_key ?? "");
    setReceiverName(query.data.pix_receiver_name ?? "");
    setCity(query.data.pix_city ?? "");
  }, [dirty, query.data]);

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        data: { pix_key: pixKey, pix_receiver_name: receiverName, pix_city: city },
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["pix-settings"], saved);
      setDirty(false);
      toast.success("Configuração PIX salva.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="interactive-panel mt-6 border border-border bg-card p-5 md:p-6">
      <SectionTitle index="04" title="Recebimento via PIX" />
      <div className="mt-6 grid gap-7 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <QrCode className="size-8 text-primary" />
          <h3 className="mt-4 text-xl font-bold">QR Code para o cliente</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Quando uma ordem estiver aguardando pagamento, o cliente poderá gerar um PIX com o valor
            exato do serviço.
          </p>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input
              id="pix-key"
              value={pixKey}
              onChange={(event) => {
                setPixKey(event.target.value);
                setDirty(true);
              }}
              placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pix-receiver">Nome do recebedor</Label>
            <Input
              id="pix-receiver"
              value={receiverName}
              onChange={(event) => {
                setReceiverName(event.target.value);
                setDirty(true);
              }}
              maxLength={25}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pix-city">Cidade</Label>
            <Input
              id="pix-city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setDirty(true);
              }}
              maxLength={15}
              required
            />
          </div>
          <Button
            type="submit"
            className="h-12 sm:col-span-2"
            disabled={query.isLoading || mutation.isPending || !dirty}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar configuração PIX
          </Button>
          <p className="text-[11px] leading-5 text-muted-foreground sm:col-span-2">
            {dirty
              ? "Há alterações ainda não salvas."
              : "Configuração salva e mantida até você alterá-la novamente."}
          </p>
        </form>
      </div>
    </section>
  );
}

function FinancialMetric({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="border-b border-border/60 p-5 last:border-b-0 sm:border-r lg:border-b-0">
      <div className="flex items-center justify-between text-primary">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="mt-6 text-2xl font-bold tabular-nums md:text-3xl">{value}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{trend}</p>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 pb-4">
      <span className="text-xs text-primary">{index}</span>
      <h2 className="text-sm font-bold">{title}</h2>
    </div>
  );
}

function RevenueBars({ values }: { values: Array<{ dia: string; valor: number }> }) {
  const max = Math.max(...values.map((item) => item.valor), 1);
  return (
    <div className="mt-6 grid h-56 grid-cols-7 items-end gap-2 border-b border-border">
      {values.map((item) => (
        <div key={item.dia} className="flex h-full flex-col justify-end">
          <p className="mb-2 hidden text-center text-[10px] tabular-nums text-muted-foreground sm:block">
            {brl(item.valor)}
          </p>
          <div
            className="bar-grow w-full bg-brand"
            style={{ height: `${Math.max(4, (item.valor / max) * 82)}%` }}
          />
          <p className="-mb-6 mt-2 text-center text-[10px] uppercase text-muted-foreground">
            {item.dia}
          </p>
        </div>
      ))}
    </div>
  );
}

function OperationalNumber({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 p-5 sm:border-r sm:border-b-0 md:p-6">
      <div className="flex justify-between text-primary">
        <span className="text-[10px]">{label}</span>
        {icon}
      </div>
      <p className="mt-8 text-5xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
