import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Phone,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/shell";
import { WashMark } from "@/components/app/wash-brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSession, updateTenantProfile } from "@/lib/lavajato.functions";
import {
  BUSINESS_DAYS,
  emptyBusinessHours,
  normalizeBusinessHours,
  type BusinessDayKey,
  type BusinessHours,
} from "@/lib/business-hours";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil do lava-jato — LavaPro" },
      { name: "description", content: "Dados públicos e operacionais do seu lava-jato." },
    ],
  }),
  component: BusinessProfile,
});

function BusinessProfile() {
  const queryClient = useQueryClient();
  const getCurrentSession = useServerFn(getSession);
  const saveProfile = useServerFn(updateTenantProfile);
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: () => getCurrentSession(),
  });
  const tenant = sessionQuery.data?.tenant;
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => emptyBusinessHours());
  const [logoUrl, setLogoUrl] = useState("");
  const [publicListing, setPublicListing] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    setNome(tenant.nome);
    setTelefone(tenant.telefone ?? "");
    setEndereco(tenant.endereco ?? "");
    setBusinessHours(normalizeBusinessHours(tenant.business_hours) ?? emptyBusinessHours());
    setLogoUrl(tenant.logo_url ?? "");
    setPublicListing(tenant.public_listing);
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: () =>
      saveProfile({
        data: {
          nome,
          telefone,
          endereco,
          business_hours: businessHours,
          logo_url: logoUrl,
          public_listing: publicListing,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Perfil do lava-jato atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const role = sessionQuery.data?.membership?.role;
  const roleLabel = role === "OWNER" ? "Proprietário" : role === "MANAGER" ? "Gerente" : "Equipe";
  const createdAt = tenant?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(tenant.created_at))
    : null;
  const configuredDays = BUSINESS_DAYS.filter(({ key }) => businessHours[key].enabled).length;

  function updateBusinessDay(key: BusinessDayKey, patch: Partial<BusinessHours[BusinessDayKey]>) {
    setBusinessHours((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  }

  return (
    <AppShell title="Perfil do lava-jato" back="/home">
      {sessionQuery.isLoading ? (
        <div className="flex min-h-56 items-center justify-center text-primary">
          <Loader2 className="size-7 animate-spin" aria-label="Carregando perfil" />
        </div>
      ) : tenant ? (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <section className="interactive-panel overflow-hidden border border-primary/30 bg-card">
              <div className="h-20 bg-brand opacity-80" />
              <div className="px-5 pb-5">
                <Avatar className="-mt-10 size-20 border-4 border-card bg-secondary">
                  {logoUrl ? <AvatarImage src={logoUrl} alt={`Logo de ${nome}`} /> : null}
                  <AvatarFallback className="bg-secondary text-primary">
                    <WashMark className="size-9" />
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 break-words text-xl font-bold">
                  {nome || "Nome do lava-jato"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Código: {tenant.slug}</p>
                <div className="mt-5 space-y-3 text-sm">
                  <ProfileLine icon={<Phone />} value={telefone || "Telefone não informado"} />
                  <ProfileLine icon={<MapPin />} value={endereco || "Endereço não informado"} />
                  <ProfileLine
                    icon={<Clock3 />}
                    value={
                      configuredDays > 0
                        ? `${configuredDays} ${configuredDays === 1 ? "dia configurado" : "dias configurados"}`
                        : "Horários não informados"
                    }
                  />
                  <ProfileLine icon={<Building2 />} value={roleLabel} />
                </div>
              </div>
            </section>

            <section className="interactive-panel border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Recebimento via PIX</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure a chave exibida ao cliente.
                  </p>
                </div>
                <WalletCards className="size-5 text-primary" />
              </div>
              <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
                <Link to="/financeiro">Abrir configuração PIX</Link>
              </Button>
            </section>
          </aside>

          <form
            className="interactive-panel border border-border bg-card p-5 md:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="border-b border-border pb-5">
              <p className="text-lg font-bold">Dados da empresa</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Essas informações identificam o lava-jato para sua equipe e para os clientes.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Nome do lava-jato" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  required
                />
              </Field>
              <Field label="Telefone" htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  inputMode="tel"
                  placeholder="(85) 99999-9999"
                />
              </Field>
              <Field className="sm:col-span-2" label="Endereço" htmlFor="profile-address">
                <Input
                  id="profile-address"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  maxLength={180}
                  placeholder="Rua, número, bairro e cidade"
                />
              </Field>
              <Field className="sm:col-span-2" label="Link do logo" htmlFor="profile-logo">
                <Input
                  id="profile-logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <section
              className="mt-6 border-t border-border pt-6"
              aria-labelledby="business-hours-title"
            >
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h3 id="business-hours-title" className="font-bold">
                    Horários de funcionamento
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ative os dias em que o lava-jato funciona e informe abertura e fechamento.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background/40">
                {BUSINESS_DAYS.map(({ key, label }) => {
                  const day = businessHours[key];
                  return (
                    <div
                      key={key}
                      className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 sm:grid-cols-[150px_1fr] sm:items-center"
                    >
                      <div className="flex items-center justify-between gap-3 sm:justify-start">
                        <Switch
                          id={`business-hours-${key}`}
                          checked={day.enabled}
                          onCheckedChange={(enabled) => updateBusinessDay(key, { enabled })}
                          aria-label={`${day.enabled ? "Fechar" : "Abrir"} ${label}`}
                        />
                        <Label htmlFor={`business-hours-${key}`} className="min-w-28 sm:min-w-0">
                          {label}
                        </Label>
                      </div>

                      {day.enabled ? (
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Label className="sr-only" htmlFor={`business-hours-${key}-open`}>
                            Abertura de {label}
                          </Label>
                          <Input
                            id={`business-hours-${key}-open`}
                            type="time"
                            value={day.open}
                            onChange={(event) =>
                              updateBusinessDay(key, { open: event.target.value })
                            }
                            className="min-w-0 flex-1 sm:max-w-32"
                            required
                          />
                          <span className="text-xs text-muted-foreground">às</span>
                          <Label className="sr-only" htmlFor={`business-hours-${key}-close`}>
                            Fechamento de {label}
                          </Label>
                          <Input
                            id={`business-hours-${key}-close`}
                            type="time"
                            value={day.close}
                            onChange={(event) =>
                              updateBusinessDay(key, { close: event.target.value })
                            }
                            className="min-w-0 flex-1 sm:max-w-32"
                            required
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground sm:text-right">Fechado</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex gap-3">
                {publicListing ? (
                  <Eye className="mt-0.5 size-5 text-primary" />
                ) : (
                  <EyeOff className="mt-0.5 size-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="profile-public">Aparecer na busca dos clientes</Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Quando ativo, clientes podem encontrar este lava-jato pelo nome ou código.
                  </p>
                </div>
              </div>
              <Switch
                id="profile-public"
                checked={publicListing}
                onCheckedChange={setPublicListing}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-border p-4 text-xs text-muted-foreground">
              <p>
                <span className="text-foreground">Conta:</span>{" "}
                {sessionQuery.data?.user?.email ?? "E-mail não disponível"}
              </p>
              {createdAt ? (
                <p className="mt-2">
                  <span className="text-foreground">Empresa cadastrada em:</span> {createdAt}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 h-13 w-full rounded-2xl text-base"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="size-5" /> Salvar alterações
                </>
              )}
            </Button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum lava-jato vinculado a esta conta.</p>
      )}
    </AppShell>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ProfileLine({
  icon,
  value,
}: {
  icon: React.ReactElement<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-muted-foreground">
      {icon}
      <span className="break-words">{value}</span>
    </div>
  );
}
