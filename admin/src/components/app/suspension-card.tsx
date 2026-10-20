import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, textareaClass } from "@/components/app/panel";
import { formatDate } from "@/components/app/subscription-badge";
import { setSuspension } from "@/lib/admin.functions";
import type { CompanyDetail } from "@/lib/companies";

export function SuspendedBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-destructive/50 bg-destructive/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-destructive">
      <Ban className="size-3" /> Suspensa
    </span>
  );
}

/**
 * Suspende ou reativa a empresa. Suspensa, o banco deixa de liberar os dados dela
 * (até para chamadas diretas à API), ela some da área do cliente e o dono vê o aviso
 * "Empresa suspensa" ao entrar. Os dados não são apagados.
 */
export function SuspensionCard({ company }: { company: CompanyDetail }) {
  const queryClient = useQueryClient();
  const save = useServerFn(setSuspension);
  const [reason, setReason] = useState("");
  const suspended = Boolean(company.suspended_at);

  const mutation = useMutation({
    mutationFn: () => save({ data: { id: company.id, suspend: !suspended, reason } }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", company.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      setReason("");
      toast.success(suspended ? "Empresa reativada." : "Empresa suspensa.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card
      title="Acesso da empresa"
      icon={
        suspended ? (
          <Ban className="size-4 text-destructive" />
        ) : (
          <ShieldCheck className="size-4 text-primary" />
        )
      }
    >
      {suspended ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5">
          Suspensa desde {formatDate(company.suspended_at)}
          {company.suspended_reason ? ` — “${company.suspended_reason}”` : ""}. O lava-jato não
          acessa o sistema e não aparece na área do cliente. Os dados continuam guardados.
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Use para contas falsas ou abuso. Suspensa, a empresa perde o acesso ao sistema e some da
          área do cliente; os dados não são apagados e dá para reativar a qualquer momento.
        </p>
      )}
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold">Motivo (obrigatório)</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder={suspended ? "Ex.: dados confirmados por telefone" : "Ex.: cadastro falso"}
          className={textareaClass}
        />
      </label>
      <Button
        variant={suspended ? "default" : "destructive"}
        className="h-11 w-full rounded-xl"
        disabled={mutation.isPending || reason.trim().length < 3}
        onClick={() => {
          if (
            !suspended &&
            !window.confirm(`Suspender ${company.nome}? O lava-jato perde o acesso agora.`)
          ) {
            return;
          }
          mutation.mutate();
        }}
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : suspended ? (
          "Reativar empresa"
        ) : (
          "Suspender empresa"
        )}
      </Button>
    </Card>
  );
}
