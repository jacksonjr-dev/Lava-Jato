import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import {
  CalendarDays,
  Car,
  ChevronRight,
  Clock3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listVehicles, plateHistory } from "@/lib/lavajato.functions";
import {
  brl,
  dateBR,
  isValidPlate,
  normalizePlate,
  STATUS_LABEL,
  type OrderStatus,
} from "@/lib/plate";
import {
  DEFAULT_FILTERS,
  PERIOD_LABEL,
  PERIODS,
  SITUATION_LABEL,
  SITUATIONS,
  SORT_LABEL,
  SORTS,
  activeFilterCount,
  filterVehicles,
  parseVehicleFilters,
  type Sort,
  type VehicleFilters,
} from "@/lib/vehicle-filters";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos — LavaPro" },
      {
        name: "description",
        content: "Consulte os veículos cadastrados e o histórico de atendimentos.",
      },
    ],
  }),
  // Os filtros ficam na URL: continuam aplicados ao abrir um atendimento e voltar.
  validateSearch: (search: Record<string, unknown>): Partial<VehicleFilters> =>
    compactFilters(parseVehicleFilters(search)),
  component: Veiculos,
});

/** Só os filtros diferentes do padrão vão para a URL. */
function compactFilters(filters: VehicleFilters): Partial<VehicleFilters> {
  const out: Partial<VehicleFilters> = {};
  if (filters.q) out.q = filters.q;
  if (filters.periodo !== DEFAULT_FILTERS.periodo) out.periodo = filters.periodo;
  if (filters.situacao !== DEFAULT_FILTERS.situacao) out.situacao = filters.situacao;
  if (filters.ordem !== DEFAULT_FILTERS.ordem) out.ordem = filters.ordem;
  if (filters.periodo === "personalizado") {
    if (filters.de) out.de = filters.de;
    if (filters.ate) out.ate = filters.ate;
  }
  return out;
}

function Veiculos() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const filters: VehicleFilters = { ...DEFAULT_FILTERS, ...search };
  const [showFilters, setShowFilters] = useState(false);
  const historyFn = useServerFn(plateHistory);
  const listFn = useServerFn(listVehicles);
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: () => listFn() });
  const historyMutation = useMutation({
    mutationFn: (selectedPlate: string) => historyFn({ data: { placa: selectedPlate } }),
    onError: (error: Error) => toast.error(error.message),
  });
  const result = historyMutation.data;
  const all = useMemo(() => vehiclesQuery.data ?? [], [vehiclesQuery.data]);
  const filterKey = JSON.stringify(filters);
  const visibleVehicles = useMemo(
    () => filterVehicles(all, JSON.parse(filterKey) as VehicleFilters),
    [all, filterKey],
  );
  const activeCount = activeFilterCount(filters);
  const hasAnyFilter = activeCount > 0 || filters.q.length > 0;

  function update(patch: Partial<VehicleFilters>) {
    void navigate({ search: compactFilters({ ...filters, ...patch }), replace: true });
  }

  function clearFilters() {
    void navigate({ search: {}, replace: true });
  }

  function openVehicle(selectedPlate: string) {
    historyMutation.mutate(selectedPlate);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AppShell title="Veículos" wide>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">Cadastro de veículos</p>
          <h1 className="mt-1 text-2xl font-bold">Placas salvas</h1>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {hasAnyFilter ? `${visibleVehicles.length} de ${all.length}` : all.length} veículos
        </p>
      </div>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const plate = normalizePlate(filters.q);
          if (isValidPlate(plate)) openVehicle(plate);
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Buscar placa ou cliente"
            aria-label="Buscar veículos"
            className="h-13 pr-11 pl-12 text-base"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => update({ q: "" })}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="relative h-13 px-4 lg:hidden"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((open) => !open)}
        >
          <SlidersHorizontal className="size-5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </form>

      {/* No desktop o painel fica sempre aberto (as classes lg:! vencem o estilo inline). */}
      <m.div
        initial={false}
        animate={showFilters ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.75, 0.25, 1] }}
        className="overflow-hidden lg:!h-auto lg:!overflow-visible lg:!opacity-100"
      >
        <FilterPanel
          filters={filters}
          onChange={update}
          onClear={clearFilters}
          hasAnyFilter={hasAnyFilter}
        />
      </m.div>

      {historyMutation.isPending && <Skeleton className="mt-6 h-40 rounded-3xl" />}
      {result && !result.vehicle && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Veículo {result.placa} ainda não cadastrado.
        </p>
      )}
      {result?.vehicle && <VehicleHistory result={result} />}

      <section className="mt-6">
        {vehiclesQuery.isLoading && (
          <div className="grid gap-3 lg:grid-cols-2" aria-label="Carregando veículos">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}
        {vehiclesQuery.isError && (
          <p className="py-6 text-sm text-destructive">{(vehiclesQuery.error as Error).message}</p>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleVehicles.map((vehicle) => {
              const last = vehicle.ultimoAtendimento;
              return (
                <m.button
                  key={vehicle.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  type="button"
                  onClick={() => openVehicle(vehicle.placa)}
                  className="interactive-panel grid w-full gap-4 border border-border bg-card p-5 text-left sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="plate text-xl">{vehicle.placa}</span>
                      {last && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                          {STATUS_LABEL[last.status as OrderStatus]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[vehicle.marca, vehicle.modelo, vehicle.cor].filter(Boolean).join(" · ") ||
                        "Dados do veículo não informados"}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {vehicle.customers?.nome ?? "Cliente não informado"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{vehicle.totalAtendimentos} atendimento(s)</span>
                      {last && (
                        <span className="flex items-center gap-1">
                          <Clock3 className="size-3.5" /> Último em {dateBR(last.created_at)}
                        </span>
                      )}
                    </div>
                    {last && (
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        {last.service_order_items.map((item) => item.nome).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {last && <span className="font-semibold tabular-nums">{brl(last.total)}</span>}
                    <ChevronRight className="size-5 text-primary" />
                  </div>
                </m.button>
              );
            })}
          </AnimatePresence>
        </div>

        {!vehiclesQuery.isLoading && visibleVehicles.length === 0 && (
          <div className="mt-3 rounded-3xl border border-dashed border-border p-8 text-center">
            <Car className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {hasAnyFilter
                ? "Nenhum veículo corresponde aos filtros."
                : "Nenhum veículo cadastrado ainda."}
            </p>
            {hasAnyFilter && (
              <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClear,
  hasAnyFilter,
}: {
  filters: VehicleFilters;
  onChange: (patch: Partial<VehicleFilters>) => void;
  onClear: () => void;
  hasAnyFilter: boolean;
}) {
  return (
    <div className="mt-3 grid gap-4 rounded-2xl border border-border bg-card/70 p-4 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-6">
      <FilterGroup label="Última visita">
        {PERIODS.map((period) => (
          <Chip
            key={period}
            active={filters.periodo === period}
            onClick={() => onChange({ periodo: period })}
          >
            {period === "personalizado" && <CalendarDays className="size-3.5" />}
            {PERIOD_LABEL[period]}
          </Chip>
        ))}
        {filters.periodo === "personalizado" && (
          <div className="flex w-full items-center gap-2 pt-1">
            <Input
              type="date"
              aria-label="De"
              value={filters.de ?? ""}
              onChange={(event) => onChange({ de: event.target.value || undefined })}
              className="h-9 text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              aria-label="Até"
              value={filters.ate ?? ""}
              onChange={(event) => onChange({ ate: event.target.value || undefined })}
              className="h-9 text-xs"
            />
          </div>
        )}
      </FilterGroup>

      <FilterGroup label="Situação">
        {SITUATIONS.map((situation) => (
          <Chip
            key={situation}
            active={filters.situacao === situation}
            onClick={() => onChange({ situacao: situation })}
          >
            {SITUATION_LABEL[situation]}
          </Chip>
        ))}
      </FilterGroup>

      <div className="flex flex-wrap items-end gap-3 lg:flex-col lg:items-stretch">
        <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ordenar por
          <select
            value={filters.ordem}
            onChange={(event) => onChange({ ordem: event.target.value as Sort })}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground"
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABEL[sort]}
              </option>
            ))}
          </select>
        </label>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
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
      className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function VehicleHistory({ result }: { result: Awaited<ReturnType<typeof plateHistory>> }) {
  if (!result.vehicle) return null;
  return (
    <section className="mt-6 space-y-4 border-b border-border/60 pb-8">
      <div className="rounded-3xl border border-primary/30 bg-card p-5 shadow-card">
        <p className="plate text-2xl">{result.vehicle.placa}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[result.vehicle.marca, result.vehicle.modelo, result.vehicle.cor]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
        <p className="mt-3 text-sm font-semibold">
          {result.vehicle.customers?.nome ?? "Sem cliente"}
        </p>
        <p className="text-sm text-muted-foreground">{result.vehicle.customers?.telefone ?? "—"}</p>
        <p className="mt-3 text-sm">
          {result.stats?.total ?? 0} atendimentos · gasto total {brl(result.stats?.totalGasto ?? 0)}
        </p>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground">Histórico da placa</h2>
      <div className="space-y-2">
        {result.history.map((order) => (
          <Link
            key={order.id}
            to="/os/$id"
            params={{ id: order.id }}
            className="block rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="flex justify-between">
              <span className="font-semibold">#{order.numero}</span>
              <span className="text-sm">{brl(order.total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateBR(order.created_at)} · {STATUS_LABEL[order.status as OrderStatus]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(order.service_order_items ?? []).map((item) => item.nome).join(", ") || "—"}
            </p>
          </Link>
        ))}
        {result.history.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum atendimento ainda.</p>
        )}
      </div>
    </section>
  );
}
