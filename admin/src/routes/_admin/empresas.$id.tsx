import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { PLANS } from "@core/lib/plans";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { expiryText, formatDate, SubscriptionBadge } from "@/components/app/subscription-badge";
import { changeSubscription, getCompany } from "@/lib/admin.functions";
import {
  describeEvent,
  planChange,
  withSubscription,
  type CompanyDetail,
  type PanelAction,
} from "@/lib/companies";

export const Route = createFileRoute("/_admin/empresas/$id")({
  head: () => ({ meta: [{ title: "Empresa — LavaPro Admin" }] }),
  component: CompanyPage,
});

function CompanyPage() {
  const { id } = Route.useParams();
  const load = useServerFn(getCompany);
  const query = useQuery({ queryKey: ["company", id], queryFn: () => load({ data: { id } }) });
  const company = query.data;

  return (
    <div className="space-y-6">
      <Link
        to="/empresas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Empresas
      </Link>

      {query.isLoading && <Skeleton className="h-64 rounded-3xl" />}
      {query.isError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {company && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{company.nome}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Código {company.slug} · cadastro em {formatDate(company.created_at)}
              </p>
            </div>
            <SubscriptionBadge subscription={company.subscription} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Contato">
              <Line label="Dono" value={company.ownerEmail ?? "—"} />
              <Line label="Telefone" value={company.telefone ?? "—"} />
              <Line label="Usuários" value={String(company.members)} />
            </Card>
            <Card title="Assinatura">
              <Line label="Contratado" value={PLANS[company.subscription.plan].nome} />
              <Line label="Em vigor" value={PLANS[company.subscription.effectivePlan].nome} />
              <Line label="Vencimento" value={expiryText(company.subscription)} />
            </Card>
            <Card title="Uso">
              <Line
                label="Atendimentos no mês"
                value={
                  company.subscription.monthlyOrderLimit === null
                    ? String(company.ordersThisMonth)
                    : `${company.ordersThisMonth} de ${company.subscription.monthlyOrderLimit}`
                }
              />
              <Line label="Atendimentos no total" value={String(company.ordersTotal)} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <PlanActions company={company} />
            <Card title="Histórico" icon={<History className="size-4 text-primary" />}>
              {company.events.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma alteração registrada ainda.</p>
              ) : (
                <ol className="space-y-3">
                  {company.events.map((event) => (
                    <li key={event.id} className="border-l-2 border-primary/40 pl-3">
                      <p className="text-sm font-semibold">{describeEvent(event)}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.to_expires_at
                          ? `Válido até ${formatDate(event.to_expires_at)}`
                          : event.to_trial_ends_at
                            ? `Teste até ${formatDate(event.to_trial_ends_at)}`
                            : "Sem plano pago"}
                      </p>
                      <p className="mt-1 text-xs">“{event.reason}”</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(event.created_at).toLocaleString("pt-BR")} ·{" "}
                        {event.admin_email ?? "admin"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

type Mode = "ativar" | "teste" | "gratis";

function PlanActions({ company }: { company: CompanyDetail }) {
  const queryClient = useQueryClient();
  const save = useServerFn(changeSubscription);
  const [mode, setMode] = useState<Mode>("ativar");
  const [plan, setPlan] = useState<"BASICO" | "MAX">(
    company.subscription.plan === "BASICO" ? "BASICO" : "MAX",
  );
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [trialDays, setTrialDays] = useState<7 | 14>(7);
  const [reason, setReason] = useState("");

  const action: PanelAction =
    mode === "ativar"
      ? { action: "ATIVAR", plan, months }
      : mode === "teste"
        ? { action: "ESTENDER_TESTE", days: trialDays }
        : { action: "GRATIS" };

  // Prévia do resultado, com a mesma regra usada no servidor.
  let preview: string;
  try {
    const { next } = planChange(company, action, "prévia");
    const after = withSubscription(next).subscription;
    preview =
      mode === "gratis"
        ? "A empresa volta ao plano Grátis agora (teste e plano pago encerrados)."
        : mode === "teste"
          ? `Teste do Max até ${formatDate(after.trialEndsAt)}.`
          : `${PLANS[plan].nome} válido até ${formatDate(after.expiresAt)}.`;
  } catch (error) {
    preview = error instanceof Error ? error.message : "";
  }

  const mutation = useMutation({
    mutationFn: () => save({ data: { id: company.id, action, reason } }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", company.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      setReason("");
      toast.success("Plano atualizado e registrado no histórico.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card title="Alterar plano">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de alteração">
        <Choice active={mode === "ativar"} onClick={() => setMode("ativar")}>
          Ativar / renovar
        </Choice>
        <Choice active={mode === "teste"} onClick={() => setMode("teste")}>
          Estender teste
        </Choice>
        <Choice active={mode === "gratis"} onClick={() => setMode("gratis")} danger>
          Voltar ao Grátis
        </Choice>
      </div>

      {mode === "ativar" && (
        <div className="space-y-3">
          <Field label="Plano">
            {(["BASICO", "MAX"] as const).map((id) => (
              <Choice key={id} active={plan === id} onClick={() => setPlan(id)}>
                {PLANS[id].nome}
              </Choice>
            ))}
          </Field>
          <Field label="Duração">
            {([1, 3, 6, 12] as const).map((value) => (
              <Choice key={value} active={months === value} onClick={() => setMonths(value)}>
                {value} {value === 1 ? "mês" : "meses"}
              </Choice>
            ))}
          </Field>
        </div>
      )}
      {mode === "teste" && (
        <Field label="Estender por">
          {([7, 14] as const).map((value) => (
            <Choice key={value} active={trialDays === value} onClick={() => setTrialDays(value)}>
              +{value} dias
            </Choice>
          ))}
        </Field>
      )}

      <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">{preview}</p>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold">Motivo (obrigatório)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Ex.: pagou 3 meses no PIX em 16/10"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <Button
        className="h-11 w-full rounded-xl"
        variant={mode === "gratis" ? "destructive" : "default"}
        disabled={mutation.isPending || reason.trim().length < 3}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar alteração"}
      </Button>
    </Card>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  danger,
  children,
}: {
  active: boolean;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${
        active
          ? danger
            ? "border-destructive bg-destructive text-destructive-foreground"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
