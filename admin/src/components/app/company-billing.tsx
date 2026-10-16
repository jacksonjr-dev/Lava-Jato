import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, NotebookPen, Plus, Wallet, X } from "lucide-react";
import { PLANS } from "@core/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/components/app/subscription-badge";
import { Card, Choice, Field, textareaClass } from "@/components/app/panel";
import { addNote, recordPayment } from "@/lib/admin.functions";
import { formatMoney, METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/lib/billing";
import { planChange, withSubscription, type CompanyDetail } from "@/lib/companies";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Aceita "89,90", "1.234,50" e "89.90". */
function parseAmount(text: string): number {
  const clean = text.replace(/[^\d.,]/g, "");
  return Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean);
}

function useUpdateCompany(companyId: string) {
  const queryClient = useQueryClient();
  return (updated: CompanyDetail) => {
    queryClient.setQueryData(["company", companyId], updated);
    void queryClient.invalidateQueries({ queryKey: ["companies"] });
    void queryClient.invalidateQueries({ queryKey: ["metrics"] });
    void queryClient.invalidateQueries({ queryKey: ["finance"] });
  };
}

export function PaymentsCard({ company }: { company: CompanyDetail }) {
  const [open, setOpen] = useState(false);
  const total = company.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <Card
      title="Pagamentos"
      icon={<Wallet className="size-4 text-primary" />}
      action={
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {open ? "Fechar" : "Registrar pagamento"}
        </button>
      }
    >
      {open && <PaymentForm company={company} onDone={() => setOpen(false)} />}

      {company.payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum pagamento registrado.</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {company.payments.map((payment) => (
              <li key={payment.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {formatMoney(Number(payment.amount))}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method}
                    </span>
                  </p>
                  {payment.note && (
                    <p className="truncate text-xs text-muted-foreground">{payment.note}</p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p>{formatDate(payment.paid_at)}</p>
                  {payment.plan && payment.months && (
                    <p className="text-muted-foreground">
                      {PLANS[payment.plan as "BASICO" | "MAX"]?.nome ?? payment.plan} ·{" "}
                      {payment.months} {payment.months === 1 ? "mês" : "meses"}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-right text-xs text-muted-foreground">
            Soma dos pagamentos listados:{" "}
            <strong className="text-foreground">{formatMoney(total)}</strong>
          </p>
        </>
      )}
    </Card>
  );
}

function PaymentForm({ company, onDone }: { company: CompanyDetail; onDone: () => void }) {
  const save = useServerFn(recordPayment);
  const update = useUpdateCompany(company.id);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState("");
  const [activate, setActivate] = useState(true);
  const [plan, setPlan] = useState<"BASICO" | "MAX">(
    company.subscription.plan === "BASICO" ? "BASICO" : "MAX",
  );
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);

  let preview = "";
  if (activate) {
    const { next } = planChange(company, { action: "ATIVAR", plan, months }, "prévia");
    preview = `${PLANS[plan].nome} válido até ${formatDate(withSubscription(next).subscription.expiresAt)}.`;
  }

  const value = parseAmount(amount);
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: company.id,
          payment: {
            amount: value,
            method,
            paidOn,
            note,
            activate: activate ? { plan, months } : null,
          },
        },
      }),
    onSuccess: (updated) => {
      update(updated);
      toast.success(
        activate ? "Pagamento registrado e plano atualizado." : "Pagamento registrado.",
      );
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold">Valor (R$)</span>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="89,90"
            aria-label="Valor"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold">Data do pagamento</span>
          <Input
            type="date"
            value={paidOn}
            max={today()}
            onChange={(event) => setPaidOn(event.target.value)}
          />
        </label>
      </div>
      <Field label="Forma">
        {PAYMENT_METHODS.map((id) => (
          <Choice key={id} active={method === id} onClick={() => setMethod(id)}>
            {METHOD_LABEL[id]}
          </Choice>
        ))}
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={activate}
          onChange={(event) => setActivate(event.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Ativar ou renovar o plano junto
      </label>
      {activate && (
        <div className="space-y-3">
          <Field label="Plano">
            {(["BASICO", "MAX"] as const).map((id) => (
              <Choice key={id} active={plan === id} onClick={() => setPlan(id)}>
                {PLANS[id].nome}
              </Choice>
            ))}
          </Field>
          <Field label="Meses pagos">
            {([1, 3, 6, 12] as const).map((count) => (
              <Choice key={count} active={months === count} onClick={() => setMonths(count)}>
                {count} {count === 1 ? "mês" : "meses"}
              </Choice>
            ))}
          </Field>
          <p className="text-xs text-muted-foreground">{preview}</p>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold">Observação (opcional)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Ex.: comprovante enviado no WhatsApp"
          className={textareaClass}
        />
      </label>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl"
        disabled={mutation.isPending || !(value > 0)}
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : value > 0 ? (
          `Registrar ${formatMoney(value)}`
        ) : (
          "Registrar pagamento"
        )}
      </Button>
    </form>
  );
}

export function NotesCard({ company }: { company: CompanyDetail }) {
  const save = useServerFn(addNote);
  const update = useUpdateCompany(company.id);
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () => save({ data: { id: company.id, body } }),
    onSuccess: (updated) => {
      update(updated);
      setBody("");
      toast.success("Nota salva.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card title="Notas internas" icon={<NotebookPen className="size-4 text-primary" />}>
      <p className="text-xs text-muted-foreground">Só a equipe LavaPro vê estas notas.</p>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Ex.: pediu para ligar na segunda sobre a renovação"
          aria-label="Nova nota"
          className={textareaClass}
        />
        <Button
          type="submit"
          variant="outline"
          className="h-9 rounded-xl"
          disabled={mutation.isPending || !body.trim()}
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Adicionar nota"}
        </Button>
      </form>
      {company.notes.length > 0 && (
        <ul className="space-y-3">
          {company.notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-secondary/60 p-3">
              <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(note.created_at).toLocaleString("pt-BR")} · {note.admin_email ?? "admin"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
