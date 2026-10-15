import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useState } from "react";
import {
  ArrowRight,
  Building2,
  Car,
  Check,
  ChevronDown,
  CircleCheckBig,
  Clock3,
  Copy,
  LogOut,
  Phone,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { clientPortalLogin, searchPublicTenants } from "@/lib/lavajato.functions";
import { brl, dateBR, normalizePlate, type OrderStatus } from "@/lib/plate";
import { getDemoBusiness, isDemoEnabled } from "@/lib/demo-auth";
import { WashBrand } from "@/components/app/wash-brand";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";
import { PlateBadge } from "@/components/app/plate-badge";
import { OrderTimeline } from "@/components/app/order-timeline";
import { Reveal } from "@/components/app/motion";
import { m } from "motion/react";
import {
  BUSINESS_DAYS,
  formatBusinessDay,
  normalizeBusinessHours,
  todayBusinessDayKey,
} from "@/lib/business-hours";

export const Route = createFileRoute("/cliente")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área do cliente — LavaPro" },
      {
        name: "description",
        content: "Acompanhe o status e o histórico de serviços do seu veículo.",
      },
    ],
  }),
  component: ClientPortal,
});

const CLIENT_STATUS_LABEL: Record<OrderStatus, string> = {
  AGUARDANDO: "Aguardando início",
  EM_LAVAGEM: "Em serviço",
  EM_FINALIZACAO: "Em serviço",
  FINALIZADO: "Pronto para retirada — aguardando pagamento",
  AGUARDANDO_PAGAMENTO: "Pronto para retirada — aguardando pagamento",
  PAGO: "Pagamento confirmado",
  ENTREGUE: "Veículo entregue",
  CANCELADO: "Cancelado",
};

type PublicTenant = {
  id: string;
  slug: string;
  nome: string;
  endereco: string | null;
  logo_url: string | null;
  telefone?: string | null;
};

function tenantSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function ClientBusinessHours({
  value,
  legacyValue,
}: {
  value: unknown;
  legacyValue?: string | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const hours = normalizeBusinessHours(value);

  if (!hours) {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0 text-primary" />
        {legacyValue || "Horários não informados"}
      </p>
    );
  }

  const todayKey = todayBusinessDayKey();
  const today = BUSINESS_DAYS.find(({ key }) => key === todayKey)!;

  return (
    <div className="mt-2 max-w-sm">
      <button
        type="button"
        className="group flex w-full items-center gap-2 rounded-xl py-1 text-left text-xs text-muted-foreground transition-colors hover:text-primary"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <Clock3 className="size-3.5 shrink-0 text-primary" />
        <span>
          Hoje ({today.shortLabel}) · {formatBusinessDay(hours[todayKey])}
        </span>
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="mt-2 grid gap-1.5 rounded-2xl border border-border/70 bg-card/85 p-3 shadow-xl backdrop-blur sm:min-w-72">
          {BUSINESS_DAYS.map(({ key, shortLabel }) => (
            <div
              key={key}
              className={`flex items-center justify-between gap-6 text-xs ${key === todayKey ? "text-primary" : "text-muted-foreground"}`}
            >
              <span className="font-semibold">{shortLabel}</span>
              <span>{formatBusinessDay(hours[key])}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ClientPortal() {
  const login = useServerFn(clientPortalLogin);
  const searchTenants = useServerFn(searchPublicTenants);
  const [tenantSearch, setTenantSearch] = useState("");
  const deferredTenantSearch = useDeferredValue(tenantSearch);
  const [selectedTenant, setSelectedTenant] = useState<PublicTenant | null>(null);
  const [placa, setPlaca] = useState("");
  const [telefone, setTelefone] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const demoBusiness = getDemoBusiness();
  const mutation = useMutation({
    mutationFn: () => login({ data: { tenantId: selectedTenant?.id, placa, telefone } }),
    onSuccess: (data) => setAccessToken(data.accessToken),
  });
  const tenantsQuery = useQuery({
    queryKey: ["public-tenants", deferredTenantSearch.trim().toLocaleLowerCase("pt-BR")],
    queryFn: () => searchTenants({ data: { query: deferredTenantSearch } }),
    enabled: !selectedTenant && deferredTenantSearch.trim().length >= 2,
    staleTime: 60_000,
  });
  const normalizedSearch = tenantSearchText(deferredTenantSearch.trim());
  const localBusinessMatches =
    demoBusiness &&
    (tenantSearchText(demoBusiness.nome).includes(normalizedSearch) ||
      demoBusiness.slug.includes(normalizedSearch));
  const tenantOptions: PublicTenant[] = [
    ...(localBusinessMatches ? [demoBusiness] : []),
    ...(tenantsQuery.data ?? []).filter((tenant) => tenant.id !== demoBusiness?.id),
  ];
  const liveQuery = useQuery({
    queryKey: ["client-portal-live", accessToken],
    queryFn: () => login({ data: { accessToken: accessToken! } }),
    enabled: accessToken !== null,
    refetchInterval: (query) => {
      const orders = query.state.data?.orders ?? [];
      return orders.some((order) => !["ENTREGUE", "CANCELADO"].includes(order.status))
        ? 5_000
        : false;
    },
    refetchIntervalInBackground: false,
  });
  const portalData = accessToken ? (liveQuery.data ?? mutation.data) : mutation.data;

  if (portalData) {
    const data = portalData;
    const displayedTenant = selectedTenant ?? data.tenant;
    const activeOrder = data.orders.find(
      (order) => !["ENTREGUE", "CANCELADO"].includes(order.status),
    );
    const activeStatus = activeOrder?.status as OrderStatus | undefined;
    const readyForPickup = activeStatus === "FINALIZADO" || activeStatus === "AGUARDANDO_PAGAMENTO";

    return (
      <div className="min-h-screen min-h-dvh bg-hero">
        <WashHoseBackdrop />
        <header className="wash-header border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div>
              <WashBrand suffix="CLIENTE" />
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-primary" /> {displayedTenant?.nome}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {displayedTenant?.endereco ?? "Endereço não informado"}
              </p>
              <ClientBusinessHours
                value={data.tenant?.business_hours}
                legacyValue={data.tenant?.horario}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setAccessToken(null);
                mutation.reset();
              }}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <LogOut className="size-4" /> SAIR
            </button>
          </div>
        </header>

        <main className="page-enter mx-auto max-w-5xl px-5 py-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-[1.25fr_0.75fr]">
            <section>
              <p className="text-sm text-muted-foreground">Olá, {data.customer?.nome} 👋</p>
              <h1 className="sr-only">Veículo {data.vehicle.placa}</h1>
              <m.div
                initial={{ opacity: 0, y: 16, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="mt-3"
              >
                <PlateBadge plate={data.vehicle.placa} size="lg" />
              </m.div>
              <p className="mt-3 text-sm text-muted-foreground">
                {[data.vehicle.marca, data.vehicle.modelo, data.vehicle.cor]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {activeOrder ? (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  AO VIVO · atualiza sozinho
                  <RefreshCw
                    className={`size-3 ${liveQuery.isFetching ? "animate-spin" : "opacity-60"}`}
                  />
                </p>
              ) : null}
            </section>

            <section className="reveal-stagger grid h-fit grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card">
              <Metric label="ATENDIMENTOS" value={String(data.summary.totalOrders)} />
              <Metric label="TOTAL PAGO" value={brl(data.summary.totalSpent)} />
              <Metric label="ÚLTIMA VISITA" value={dateBR(data.summary.lastVisit)} wide />
            </section>
          </div>

          {activeOrder ? (
            <Reveal className="mt-10">
              <section className="overflow-hidden rounded-3xl border border-primary/50 bg-card shadow-glow">
                <div className="flex flex-wrap items-start justify-between gap-4 bg-brand px-5 py-4 text-primary-foreground">
                  <div>
                    <p className="text-xs font-bold">
                      {readyForPickup ? "VEÍCULO PRONTO PARA RETIRADA" : "ATENDIMENTO EM CURSO"}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">#{activeOrder.numero}</h2>
                  </div>
                  <p className="rounded-xl border border-primary-foreground/30 bg-background/15 px-3 py-2 text-xs font-bold">
                    {CLIENT_STATUS_LABEL[activeOrder.status as OrderStatus]}
                  </p>
                </div>
                <div className="p-5 md:p-7">
                  <OrderTimeline
                    status={activeOrder.status as OrderStatus}
                    title="Onde está o seu carro"
                  />
                  <PickupNotice status={activeOrder.status as OrderStatus} pix={data.pix} />
                  <div className="mt-7 grid gap-5 border-t border-border/60 pt-5 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-xs text-muted-foreground">Serviços</p>
                      <div className="mt-3 space-y-2">
                        {activeOrder.service_order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <Wrench className="size-4 text-primary" />
                            {item.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="mt-2 text-3xl font-bold tabular-nums">
                        {brl(activeOrder.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </Reveal>
          ) : (
            <section className="mt-10 flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <Car className="size-8 shrink-0 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-semibold">Nenhum atendimento em andamento</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quando o seu carro chegar ao lava-jato, o andamento aparece aqui.
                </p>
              </div>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between border-b border-border/60 pb-3">
              <div>
                <p className="text-xs font-semibold text-primary">Histórico</p>
                <h2 className="mt-1 text-2xl font-bold">Serviços realizados</h2>
              </div>
              <ReceiptText className="size-6 text-muted-foreground" />
            </div>

            <div className="reveal-stagger mt-3 divide-y divide-border rounded-2xl border border-border bg-card px-5">
              {data.orders.map((order) => (
                <article key={order.id} className="grid gap-4 py-5 md:grid-cols-[110px_1fr_140px]">
                  <div>
                    <p className="text-xs text-muted-foreground">#{order.numero}</p>
                    <p className="mt-1 text-sm">{dateBR(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {CLIENT_STATUS_LABEL[order.status as OrderStatus]}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {order.service_order_items.map((item) => item.nome).join(" · ")}
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums md:text-right">{brl(order.total)}</p>
                </article>
              ))}
              {data.orders.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
              )}
            </div>
          </section>

          <footer className="mt-12 grid gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground md:grid-cols-2">
            <p className="flex items-center gap-2">
              <Phone className="size-4" />
              {displayedTenant?.telefone ?? data.tenant?.telefone ?? "Telefone não informado"}
            </p>
            <p className="md:text-right">{displayedTenant?.endereco ?? "Endereço não informado"}</p>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen min-h-dvh bg-hero">
      <WashHoseBackdrop />
      <header className="wash-header border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" aria-label="Voltar para a página inicial">
            <WashBrand />
          </Link>
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary">
            ACESSO DO PROPRIETÁRIO
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl items-center gap-6 px-5 py-8 md:grid-cols-2 md:py-12">
        <section className="flex h-full flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 shadow-card md:p-10">
          <div>
            <Car className="size-9 text-primary" strokeWidth={1.5} />
            <h1 className="mt-8 text-[clamp(2.65rem,12vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.07em]">
              Acompanhe
              <br />
              seu carro.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">
              Consulte o andamento da lavagem, os serviços realizados e o histórico completo do
              veículo.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-3 overflow-hidden rounded-2xl border border-border/60 bg-secondary/50 text-center text-xs text-muted-foreground">
            <div className="border-r border-border/60 p-3">
              <Clock3 className="mx-auto mb-2 size-4" />
              STATUS
            </div>
            <div className="border-r border-border/60 p-3">
              <Wrench className="mx-auto mb-2 size-4" />
              SERVIÇOS
            </div>
            <div className="p-3">
              <ReceiptText className="mx-auto mb-2 size-4" />
              HISTÓRICO
            </div>
          </div>
        </section>

        <section className="flex items-center rounded-3xl border border-border/60 bg-card p-6 shadow-card md:p-10">
          <form
            className="w-full"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <p className="text-xs font-semibold text-primary">Área do cliente</p>
            <h2 className="mt-2 text-2xl font-bold">Entrar</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Primeiro escolha a empresa. Depois use a placa e o telefone informados no atendimento.
            </p>

            {isDemoEnabled() && (
              <button
                type="button"
                onClick={() => {
                  const tenant = demoBusiness ?? {
                    id: "demo-tenant",
                    slug: "lavapro-demonstracao",
                    nome: "LavaPro Demonstração",
                    endereco: "Fortaleza - CE",
                    logo_url: null,
                  };
                  setSelectedTenant(tenant);
                  setTenantSearch(tenant.nome);
                  setPlaca("ABC1D23");
                  setTelefone("85999991234");
                  mutation.reset();
                }}
                className="mt-6 w-full rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left text-sm text-primary hover:bg-primary/15"
              >
                PREENCHER ACESSO DE DEMONSTRAÇÃO
              </button>
            )}

            <div className="mt-7">
              <p className="text-[10px] font-bold tracking-[0.14em] text-primary">01 / LAVA-JATO</p>
              {selectedTenant ? (
                <div className="mt-2 flex items-start gap-3 rounded-2xl border border-primary/45 bg-primary/10 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{selectedTenant.nome}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {selectedTenant.endereco ?? "Endereço não informado"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTenant(null);
                      setTenantSearch("");
                      mutation.reset();
                    }}
                    className="rounded-xl border border-border/70 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary"
                  >
                    TROCAR
                  </button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute top-4 left-4 size-5 text-muted-foreground" />
                  <input
                    value={tenantSearch}
                    onChange={(event) => {
                      setTenantSearch(event.target.value);
                      mutation.reset();
                    }}
                    placeholder="Digite o nome ou código do lava-jato"
                    autoComplete="organization"
                    className="h-14 w-full rounded-xl border border-input bg-background/40 pr-4 pl-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {tenantSearch.trim().length >= 2 && (
                    <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-card">
                      {tenantsQuery.isFetching ? (
                        <p className="p-3 text-xs text-muted-foreground">Buscando lava-jatos...</p>
                      ) : tenantOptions.length ? (
                        tenantOptions.map((tenant) => (
                          <button
                            key={tenant.id}
                            type="button"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setTenantSearch(tenant.nome);
                              mutation.reset();
                            }}
                            className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-secondary"
                          >
                            <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">
                                {tenant.nome}
                              </span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {tenant.endereco ?? `Código: ${tenant.slug}`}
                              </span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-xs leading-5 text-muted-foreground">
                          Nenhum lava-jato encontrado. Confirme o nome com o estabelecimento.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="mt-7 text-[10px] font-bold tracking-[0.14em] text-primary">
              02 / SEUS DADOS
            </p>

            <label className="mt-3 block text-sm font-medium" htmlFor="client-plate">
              PLACA DO VEÍCULO
            </label>
            <input
              id="client-plate"
              value={placa}
              onChange={(event) => setPlaca(normalizePlate(event.target.value).slice(0, 7))}
              placeholder="ABC1D23"
              autoComplete="off"
              className="mt-2 h-14 w-full rounded-xl border border-input bg-background/40 px-4 text-lg uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />

            <label className="mt-5 block text-sm font-medium" htmlFor="client-phone">
              TELEFONE
            </label>
            <input
              id="client-phone"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(85) 99999-1234"
              inputMode="tel"
              autoComplete="tel"
              className="mt-2 h-14 w-full rounded-xl border border-input bg-background/40 px-4 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />

            {mutation.isError && (
              <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            )}

            <button
              type="submit"
              disabled={
                mutation.isPending || !selectedTenant || placa.length < 6 || telefone.length < 8
              }
              className="mt-6 flex h-14 w-full items-center justify-between rounded-xl bg-brand px-4 font-bold text-primary-foreground shadow-glow disabled:opacity-40"
            >
              {mutation.isPending ? "CONSULTANDO..." : "ACESSAR MEUS SERVIÇOS"}
              <ArrowRight className="size-5" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`p-4 ${wide ? "col-span-2 border-t border-border/60" : "border-r border-border/60 last:border-r-0"}`}
    >
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

type PortalPix = {
  amount: number;
  key: string;
  receiverName: string;
  copiaECola: string;
  qrCodeDataUrl: string;
};

function PickupNotice({ status, pix }: { status: OrderStatus; pix: PortalPix | null }) {
  if (status === "FINALIZADO" || status === "AGUARDANDO_PAGAMENTO") {
    return (
      <div className="mt-5 flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
        <CircleCheckBig className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="font-semibold">Seu veículo está pronto para retirada.</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {pix
              ? "O serviço foi concluído. Pague via PIX agora ou no lava-jato e retire o veículo."
              : "O serviço foi concluído. Faça o pagamento no lava-jato e retire o veículo."}
          </p>
          {pix ? <PixPaymentCard pix={pix} /> : null}
        </div>
      </div>
    );
  }

  return null;
}

function PixPaymentCard({ pix }: { pix: PortalPix }) {
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState<"key" | "code" | null>(null);

  async function copyPix(value: string, type: "key" | "code") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 2_000);
  }

  if (!showQrCode) {
    return (
      <button
        type="button"
        onClick={() => setShowQrCode(true)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-primary-foreground shadow-glow"
      >
        <QrCode className="size-5" /> Pagar com PIX
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 text-foreground">
      <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr]">
        <div>
          <img
            src={pix.qrCodeDataUrl}
            alt="QR Code PIX para pagamento do serviço"
            className="mx-auto aspect-square w-full max-w-[180px] rounded-xl bg-white p-2"
          />
          <div className="mt-3 rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="text-[11px] text-muted-foreground">Chave PIX</p>
            <p className="mt-1 break-all text-sm font-semibold">{pix.key}</p>
            <button
              type="button"
              onClick={() => copyPix(pix.key, "key")}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15 active:scale-[0.98]"
            >
              {copied === "key" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "key" ? "Chave copiada" : "Copiar chave PIX"}
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valor do PIX</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{brl(pix.amount)}</p>
          <p className="mt-3 text-xs text-muted-foreground">Recebedor</p>
          <p className="mt-1 text-sm font-semibold">{pix.receiverName}</p>
          <button
            type="button"
            onClick={() => copyPix(pix.copiaECola, "code")}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary"
          >
            {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === "code" ? "Código copiado" : "Copiar código PIX"}
          </button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            No celular, copie o código e cole na opção “PIX Copia e Cola” do aplicativo do seu
            banco.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
        <ReceiptText className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-semibold">Após pagar, envie o comprovante ao lava-jato.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Isso ajuda a confirmar o pagamento e liberar a retirada do veículo mais rápido.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        O status será atualizado automaticamente após a confirmação do lava-jato.
      </p>
    </div>
  );
}
