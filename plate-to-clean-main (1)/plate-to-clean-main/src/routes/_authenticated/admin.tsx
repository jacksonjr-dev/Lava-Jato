import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  adminListTenants,
  adminUpdateSubscription,
  type AdminSubscriptionAction,
} from "@/lib/lavajato.functions";
import { dateBR } from "@/lib/plate";
import { PLANS, type Subscription } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — LavaPro" }] }),
  component: AdminPage,
});

const STATUS_STYLE: Record<Subscription["status"], string> = {
  TESTE: "border-primary/40 text-primary",
  ATIVA: "border-success/40 text-success",
  TOLERANCIA: "border-warning/50 text-warning",
  GRATIS: "border-border text-muted-foreground",
};

const STATUS_LABEL: Record<Subscription["status"], string> = {
  TESTE: "TESTE",
  ATIVA: "ATIVA",
  TOLERANCIA: "VENCIDA",
  GRATIS: "GRÁTIS",
};

function AdminPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListTenants);
  const updateFn = useServerFn(adminUpdateSubscription);
  const query = useQuery({ queryKey: ["admin-tenants"], queryFn: () => listFn() });
  const [search, setSearch] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { tenantId: string; change: AdminSubscriptionAction }) =>
      updateFn({ data: input }),
    onSuccess: async () => {
      toast.success("Assinatura atualizada.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tenants = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((tenant) =>
      [tenant.nome, tenant.slug, tenant.owner_email ?? "", tenant.telefone ?? ""].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term),
      ),
    );
  }, [query.data, search]);

  function run(tenantId: string, change: AdminSubscriptionAction, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    mutation.mutate({ tenantId, change });
  }

  return (
    <AppShell title="Administração" back="/home" wide>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <p className="text-xs font-semibold text-primary">Somente equipe LavaPro</p>
          <h1 className="mt-2 text-[clamp(1.75rem,6vw,3rem)] font-bold tracking-[-0.06em]">
            Empresas e assinaturas
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
            Libere o plano depois de confirmar o pagamento. Renovar o mesmo plano soma 30 dias ao
            vencimento atual; trocar de plano começa a contar hoje.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empresa, e-mail ou telefone"
            className="pl-9"
          />
        </div>
      </div>

      {query.isLoading && (
        <div className="mt-6 grid gap-3" aria-label="Carregando empresas">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 rounded-2xl" />
          ))}
        </div>
      )}
      {query.isError && (
        <p className="my-8 border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {tenants.map((tenant) => {
          const sub = tenant.subscription;
          const busy = mutation.isPending && mutation.variables?.tenantId === tenant.id;
          return (
            <article key={tenant.id} className="border border-border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">{tenant.nome}</h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {tenant.owner_email ?? "sem e-mail"} · {tenant.telefone ?? "sem telefone"} ·
                    desde {dateBR(tenant.created_at)}
                  </p>
                </div>
                <span
                  className={`border px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[sub.status]}`}
                >
                  {STATUS_LABEL[sub.status]} · {PLANS[sub.effectivePlan].nome.toUpperCase()}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Contratado: <strong className="text-foreground">{PLANS[sub.plan].nome}</strong>
                {sub.expiresAt && <> · vence {dateBR(sub.expiresAt)}</>}
                {sub.trialEndsAt && <> · teste até {dateBR(sub.trialEndsAt)}</>}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton
                  disabled={busy}
                  onClick={() => run(tenant.id, { action: "ATIVAR", plan: "BASICO", days: 30 })}
                >
                  Básico +30 dias
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  onClick={() => run(tenant.id, { action: "ATIVAR", plan: "MAX", days: 30 })}
                >
                  Max +30 dias
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  onClick={() => run(tenant.id, { action: "ESTENDER_TESTE", days: 7 })}
                >
                  Teste +7 dias
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  danger
                  onClick={() =>
                    run(
                      tenant.id,
                      { action: "GRATIS" },
                      `Voltar "${tenant.nome}" para o plano Grátis agora? O teste e o plano pago são encerrados.`,
                    )
                  }
                >
                  Voltar ao Grátis
                </ActionButton>
                {busy && <Loader2 className="size-4 animate-spin self-center text-primary" />}
              </div>
            </article>
          );
        })}
        {query.data && tenants.length === 0 && (
          <p className="py-8 text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
        )}
      </div>
    </AppShell>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
        danger
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border hover:border-primary/60 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
