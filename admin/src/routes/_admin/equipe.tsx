import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  History,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/app/panel";
import { formatDate } from "@/components/app/subscription-badge";
import { inviteAdmin, listTeam, removeAdmin, whoAmI } from "@/lib/admin.functions";
import { isOwner, memberStatus, ROLE_LABEL, type TeamMember } from "@/lib/team";

export const Route = createFileRoute("/_admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe — LavaPro Admin" }] }),
  component: TeamPage,
});

const STATUS: Record<ReturnType<typeof memberStatus>, { label: string; className: string }> = {
  pendente: {
    label: "Convite pendente",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  "sem-autenticador": {
    label: "Sem autenticador",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  ativo: { label: "Ativo", className: "border-success/40 bg-success/10 text-success" },
};

function TeamPage() {
  const load = useServerFn(listTeam);
  const me = useServerFn(whoAmI);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => me() });
  const owner = isOwner(meQuery.data?.role);
  const query = useQuery({ queryKey: ["team"], queryFn: () => load(), enabled: owner });
  const [inviting, setInviting] = useState(false);

  if (meQuery.isSuccess && !owner) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <ShieldOff className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-bold">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Somente o dono do painel gerencia a equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">Acesso ao painel</p>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Quem pode entrar no painel administrativo. Todos entram com senha e o código do Google
            Authenticator.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setInviting((value) => !value)}>
          {inviting ? <X className="size-4" /> : <UserPlus className="size-4" />}
          {inviting ? "Fechar" : "Convidar administrador"}
        </Button>
      </div>

      {inviting ? <InviteForm onDone={() => setInviting(false)} /> : null}

      {query.isLoading && <Skeleton className="h-48 rounded-2xl" />}
      {query.isError && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {query.data && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card title={`Administradores (${query.data.members.length})`}>
            <ul className="divide-y divide-border">
              {query.data.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isMe={member.email === meQuery.data?.email}
                  canRemove={query.data.members.length > 1}
                />
              ))}
            </ul>
          </Card>
          <Card title="Registro" icon={<History className="size-4 text-primary" />}>
            {query.data.events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma alteração na equipe ainda.</p>
            ) : (
              <ol className="space-y-3">
                {query.data.events.map((event) => (
                  <li key={event.id} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-sm font-semibold">
                      {event.action === "ADICIONAR" ? "Acesso liberado" : "Acesso removido"}:{" "}
                      <span className="font-normal">{event.target_email}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(event.created_at).toLocaleString("pt-BR")} ·{" "}
                      {event.actor_email ?? "admin"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isMe,
  canRemove,
}: {
  member: TeamMember;
  isMe: boolean;
  canRemove: boolean;
}) {
  const queryClient = useQueryClient();
  const remove = useServerFn(removeAdmin);
  const status = STATUS[memberStatus(member)];
  const mutation = useMutation({
    mutationFn: () => remove({ data: { userId: member.userId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Acesso removido.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {member.mfa ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {member.nome ?? member.email}
          {isMe ? <span className="ml-1.5 text-xs font-normal text-primary">(você)</span> : null}
          {isOwner(member.role) ? (
            <span className="ml-1.5 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
              {ROLE_LABEL["DONO"]}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {member.lastSignInAt
            ? `Último acesso ${new Date(member.lastSignInAt).toLocaleString("pt-BR")}`
            : `Convidado em ${formatDate(member.since)}`}
          {member.addedByEmail ? ` · por ${member.addedByEmail}` : ""}
        </p>
      </div>
      <span
        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
      >
        {status.label}
      </span>
      {!isMe && canRemove && !isOwner(member.role) ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={mutation.isPending}
          onClick={() => {
            if (window.confirm(`Remover o acesso de ${member.nome ?? member.email} ao painel?`)) {
              mutation.mutate();
            }
          }}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserMinus className="size-4" />
          )}
          Remover
        </Button>
      ) : null}
    </li>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const invite = useServerFn(inviteAdmin);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const mutation = useMutation({
    mutationFn: () => invite({ data: { nome, email } }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(
        result.invited
          ? "Convite enviado. A pessoa cria a senha pelo link do e-mail."
          : "Acesso liberado. A pessoa já tinha conta e entra com a senha dela.",
      );
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card title="Convidar administrador" icon={<Mail className="size-4 text-primary" />}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold">Nome</span>
            <Input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Ana Souza"
              maxLength={80}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold">E-mail</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ana@seudominio.com.br"
              required
            />
          </label>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          A pessoa recebe um e-mail para criar a senha. No primeiro acesso ela lê o QR Code no
          Google Authenticator. Ela terá acesso completo ao painel.
        </p>
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Enviar convite"}
        </Button>
      </form>
    </Card>
  );
}
