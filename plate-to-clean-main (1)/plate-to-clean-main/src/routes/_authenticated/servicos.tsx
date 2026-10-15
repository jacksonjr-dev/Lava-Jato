import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, Clock3, Loader2, Pencil, Plus, Power, PowerOff, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createService,
  deactivateService,
  getSession,
  listServices,
  updateService,
} from "@/lib/lavajato.functions";
import { brl } from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({
    meta: [
      { title: "Catálogo de serviços — LavaPro" },
      {
        name: "description",
        content: "Configure os serviços e preços específicos do seu lava-jato.",
      },
    ],
  }),
  component: ServicesCatalog,
});

type Category = "LAVAGEM" | "ADICIONAL";
type ServiceRow = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  duracao_min: number | null;
  categoria: string;
  ativo: boolean;
};
type ServiceDraft = {
  nome: string;
  descricao: string;
  preco: string;
  duracao: string;
  categoria: Category;
};

const emptyDraft: ServiceDraft = {
  nome: "",
  descricao: "",
  preco: "",
  duracao: "",
  categoria: "ADICIONAL",
};

function ServicesCatalog() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listServices);
  const sessionFn = useServerFn(getSession);
  const createFn = useServerFn(createService);
  const updateFn = useServerFn(updateService);
  const deactivateFn = useServerFn(deactivateService);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [editDraft, setEditDraft] = useState<ServiceDraft>(emptyDraft);

  const session = useQuery({ queryKey: ["session"], queryFn: () => sessionFn() });
  const services = useQuery({ queryKey: ["services"], queryFn: () => listFn() });
  const canManage = session.data?.membership?.role !== "EMPLOYEE";

  async function refreshServices() {
    await queryClient.invalidateQueries({ queryKey: ["services"] });
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          nome: draft.nome,
          descricao: draft.descricao,
          preco: Number(draft.preco),
          duracao_min: draft.duracao ? Number(draft.duracao) : undefined,
          categoria: draft.categoria,
        },
      }),
    onSuccess: async () => {
      setDraft(emptyDraft);
      await refreshServices();
      toast.success("Serviço adicionado ao catálogo.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Serviço não selecionado.");
      return updateFn({
        data: {
          id: editing.id,
          nome: editDraft.nome,
          descricao: editDraft.descricao,
          preco: Number(editDraft.preco),
          duracao_min: editDraft.duracao ? Number(editDraft.duracao) : null,
          categoria: editDraft.categoria,
        },
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await refreshServices();
      toast.success("Serviço atualizado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: async (service: ServiceRow) => {
      if (service.ativo) return deactivateFn({ data: { id: service.id } });
      return updateFn({ data: { id: service.id, ativo: true } });
    },
    onSuccess: async (_data, service) => {
      await refreshServices();
      toast.success(service.ativo ? "Serviço desativado." : "Serviço reativado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = (services.data ?? []) as ServiceRow[];
  const activeCount = rows.filter((service) => service.ativo).length;

  function startEditing(service: ServiceRow) {
    setEditing(service);
    setEditDraft({
      nome: service.nome,
      descricao: service.descricao ?? "",
      preco: String(service.preco),
      duracao: service.duracao_min ? String(service.duracao_min) : "",
      categoria: service.categoria === "LAVAGEM" ? "LAVAGEM" : "ADICIONAL",
    });
  }

  return (
    <AppShell title="Serviços" wide>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="interactive-panel h-fit border border-primary/35 bg-card p-5 md:p-7">
          {/* No celular o formulário começa recolhido para a lista aparecer logo. */}
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            aria-expanded={formOpen}
            className="flex w-full items-start gap-3 text-left lg:pointer-events-none lg:border-b lg:border-border lg:pb-5"
          >
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-primary">
              <Plus
                className={`size-5 transition-transform duration-300 ${formOpen ? "rotate-45 lg:rotate-0" : ""}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">Adicionar serviço</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Este serviço ficará disponível somente para este lava-jato.
              </p>
            </div>
            <ChevronDown
              className={`mt-3 size-5 shrink-0 text-muted-foreground transition-transform duration-300 lg:hidden ${formOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* No desktop o formulário fica sempre aberto (as classes lg:! vencem o estilo inline). */}
          <m.div
            initial={false}
            animate={formOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.75, 0.25, 1] }}
            className="overflow-hidden lg:!h-auto lg:!overflow-visible lg:!opacity-100"
          >
            <div className="mt-5 border-t border-border pt-5 lg:border-0 lg:pt-0">
              {canManage ? (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createMutation.mutate();
                  }}
                >
                  <ServiceFields draft={draft} onChange={setDraft} prefix="new-service" />
                  <Button
                    type="submit"
                    className="h-13 w-full rounded-2xl"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-5" /> Adicionar ao catálogo
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Apenas proprietários e gerentes podem alterar o catálogo.
                </p>
              )}
            </div>
          </m.div>
        </section>

        <section className="interactive-panel border border-border bg-card p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
            <div>
              <p className="text-xs font-bold text-primary">CATÁLOGO DESTA EMPRESA</p>
              <h2 className="mt-1 text-xl font-bold">Serviços disponíveis</h2>
            </div>
            <p className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              {activeCount} ativos · {rows.length} cadastrados
            </p>
          </div>

          {services.isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-primary">
              <Loader2 className="size-6 animate-spin" aria-label="Carregando serviços" />
            </div>
          ) : rows.length ? (
            <div className="mt-5 space-y-3">
              <AnimatePresence initial={true} mode="popLayout">
                {rows.map((service, index) => (
                  <m.article
                    key={service.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{
                      opacity: service.ativo ? 1 : 0.65,
                      y: 0,
                      transition: { delay: Math.min(index, 8) * 0.04 },
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl border p-4 transition-colors ${
                      service.ativo
                        ? "border-border bg-background/45 hover:border-primary/40"
                        : "border-border/60 bg-background/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-bold">{service.nome}</h3>
                          <span className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                            {service.categoria === "LAVAGEM" ? "LAVAGEM" : "ADICIONAL"}
                          </span>
                          {!service.ativo ? (
                            <span className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground">
                              INATIVO
                            </span>
                          ) : null}
                        </div>
                        {service.descricao ? (
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {service.descricao}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-lg font-bold text-primary">
                        {brl(service.preco)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="size-4" />
                        {service.duracao_min
                          ? `${service.duracao_min} minutos`
                          : "Sem duração definida"}
                      </p>
                      {canManage ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => startEditing(service)}
                          >
                            <Pencil className="size-4" /> Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate(service)}
                          >
                            {service.ativo ? (
                              <PowerOff className="size-4" />
                            ) : (
                              <Power className="size-4" />
                            )}
                            {service.ativo ? "Desativar" : "Reativar"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </m.article>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <Wrench className="size-8 text-primary" />
              <p className="mt-4 font-bold">Nenhum serviço cadastrado</p>
              <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                Adicione o primeiro serviço para iniciar novos atendimentos.
              </p>
            </div>
          )}
        </section>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-primary/30 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar serviço</DialogTitle>
            <DialogDescription>
              A alteração vale para novos atendimentos. O histórico mantém o nome e o preço
              registrados.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-3 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
          >
            <ServiceFields draft={editDraft} onChange={setEditDraft} prefix="edit-service" />
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Salvar serviço"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ServiceFields({
  draft,
  onChange,
  prefix,
}: {
  draft: ServiceDraft;
  onChange: (value: ServiceDraft) => void;
  prefix: string;
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${prefix}-name`}>Nome do serviço</Label>
        <Input
          id={`${prefix}-name`}
          className="mt-2"
          value={draft.nome}
          onChange={(event) => onChange({ ...draft, nome: event.target.value })}
          maxLength={80}
          placeholder="Ex.: Higienização de bancos"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${prefix}-price`}>Preço</Label>
          <Input
            id={`${prefix}-price`}
            className="mt-2"
            type="number"
            min="0"
            max="100000"
            step="0.01"
            inputMode="decimal"
            value={draft.preco}
            onChange={(event) => onChange({ ...draft, preco: event.target.value })}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-duration`}>Duração estimada (min)</Label>
          <Input
            id={`${prefix}-duration`}
            className="mt-2"
            type="number"
            min="1"
            max="1440"
            inputMode="numeric"
            value={draft.duracao}
            onChange={(event) => onChange({ ...draft, duracao: event.target.value })}
            placeholder="60"
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${prefix}-category`}>Categoria</Label>
        <Select
          value={draft.categoria}
          onValueChange={(categoria: Category) => onChange({ ...draft, categoria })}
        >
          <SelectTrigger id={`${prefix}-category`} className="mt-2 h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADICIONAL">Adicional — pode combinar</SelectItem>
            <SelectItem value="LAVAGEM">Lavagem — apenas uma</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${prefix}-description`}>Descrição</Label>
        <Textarea
          id={`${prefix}-description`}
          className="mt-2 min-h-24 rounded-xl"
          value={draft.descricao}
          onChange={(event) => onChange({ ...draft, descricao: event.target.value })}
          maxLength={240}
          placeholder="Explique o que está incluído no serviço"
        />
      </div>
    </>
  );
}
