import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, type ReactNode } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { PLANS, type PlanId } from "@core/lib/plans";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { expiryText, formatDate, SubscriptionBadge } from "@/components/app/subscription-badge";
import { listCompanies } from "@/lib/admin.functions";
import {
  filterCompanies,
  STATUS_FILTERS,
  STATUS_LABEL,
  summarize,
  type StatusFilter,
} from "@/lib/companies";

type Search = { q?: string; status?: StatusFilter; plano?: PlanId };

export const Route = createFileRoute("/_admin/empresas/")({
  head: () => ({ meta: [{ title: "Empresas — LavaPro Admin" }] }),
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"].slice(0, 80);
    const status = search["status"];
    if (typeof status === "string" && (STATUS_FILTERS as readonly string[]).includes(status)) {
      out.status = status as StatusFilter;
    }
    const plano = search["plano"];
    if (plano === "GRATIS" || plano === "BASICO" || plano === "MAX") out.plano = plano;
    return out;
  },
  component: CompaniesPage,
});

function CompaniesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const load = useServerFn(listCompanies);
  const query = useQuery({ queryKey: ["companies"], queryFn: () => load() });
  const all = useMemo(() => query.data ?? [], [query.data]);
  const stats = summarize(all);
  const rows = filterCompanies(all, {
    q: search.q ?? "",
    status: search.status ?? "todas",
    plan: search.plano ?? "todos",
  });

  function update(patch: { [K in keyof Search]?: Search[K] | undefined }) {
    const next = { ...search, ...patch } as Search;
    (Object.keys(next) as Array<keyof Search>).forEach((key) => {
      if (!next[key] || next[key] === ("todas" as never)) delete next[key];
    });
    void navigate({ search: next, replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">Clientes do LavaPro</p>
          <h1 className="mt-1 text-2xl font-bold">Empresas</h1>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {rows.length === all.length ? all.length : `${rows.length} de ${all.length}`} empresas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total" value={stats.total} onClick={() => update({ status: undefined })} />
        <Stat label="Em teste" value={stats.teste} onClick={() => update({ status: "TESTE" })} />
        <Stat
          label="Pagantes"
          value={stats.pagas}
          hint={`Básico ${stats.porPlano.BASICO} · Max ${stats.porPlano.MAX}`}
          onClick={() => update({ status: "ATIVA" })}
        />
        <Stat
          label="Vencidas"
          value={stats.vencidas}
          tone="warning"
          onClick={() => update({ status: "TOLERANCIA" })}
        />
        <Stat
          label="Vencendo em 7 dias"
          value={stats.vencendo}
          tone="primary"
          onClick={() => update({ status: "vencendo" })}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/70 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search.q ?? ""}
            onChange={(e) => update({ q: e.target.value || undefined })}
            placeholder="Nome, código, e-mail do dono ou telefone"
            aria-label="Buscar empresas"
            className="h-11 pr-10 pl-10"
          />
          {search.q && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => update({ q: undefined })}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              active={(search.status ?? "todas") === status}
              onClick={() => update({ status: status === "todas" ? undefined : status })}
            >
              {STATUS_LABEL[status]}
            </Chip>
          ))}
          <select
            value={search.plano ?? "todos"}
            onChange={(e) =>
              update({ plano: e.target.value === "todos" ? undefined : (e.target.value as PlanId) })
            }
            aria-label="Plano em vigor"
            className="ml-auto h-8 rounded-full border border-border bg-background px-3 text-xs"
          >
            <option value="todos">Todos os planos</option>
            {(["GRATIS", "BASICO", "MAX"] as const).map((plan) => (
              <option key={plan} value={plan}>
                {PLANS[plan].nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}
      {query.isError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[minmax(0,2fr)_150px_minmax(0,1.3fr)_110px_100px_24px] gap-4 border-b border-border px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Empresa</span>
            <span>Situação</span>
            <span>Vencimento</span>
            <span className="text-right">Atend. mês</span>
            <span>Cadastro</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {rows.map((company) => (
              <li key={company.id}>
                <Link
                  to="/empresas/$id"
                  params={{ id: company.id }}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-secondary/50 md:grid-cols-[minmax(0,2fr)_150px_minmax(0,1.3fr)_110px_100px_24px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{company.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {company.ownerEmail ?? "sem e-mail"}
                    </p>
                  </div>
                  <div className="md:order-none">
                    <SubscriptionBadge subscription={company.subscription} />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground md:col-span-1">
                    {expiryText(company.subscription)}
                  </p>
                  <p className="hidden text-right text-sm tabular-nums md:block">
                    {company.ordersThisMonth}
                    {company.subscription.monthlyOrderLimit !== null && (
                      <span className="text-muted-foreground">
                        /{company.subscription.monthlyOrderLimit}
                      </span>
                    )}
                  </p>
                  <p className="hidden text-xs text-muted-foreground md:block">
                    {formatDate(company.created_at)}
                  </p>
                  <ChevronRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!query.isLoading && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma empresa encontrada.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "warning" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums ${
          tone === "warning" && value
            ? "text-warning"
            : tone === "primary" && value
              ? "text-primary"
              : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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
