import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Keyboard, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrder,
  createNewCustomerOrder,
  findVehicleByPlate,
  listServices,
  recognizePlate,
} from "@/lib/lavajato.functions";
import { brl, dateBR, normalizePlate } from "@/lib/plate";
import { isWashService, toggleServiceSelection } from "@/lib/service-selection";

export const Route = createFileRoute("/_authenticated/atendimento/novo")({
  head: () => ({
    meta: [
      { title: "Novo atendimento — LavaPro" },
      { name: "description", content: "Fotografe a placa e inicie o atendimento." },
      { property: "og:title", content: "Novo atendimento — LavaPro" },
      { property: "og:description", content: "Fotografe a placa e inicie o atendimento." },
    ],
  }),
  component: NovoAtendimento,
});

type Step = "capture" | "confirm" | "vehicle" | "quick" | "services";

function NovoAtendimento() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const recognizeFn = useServerFn(recognizePlate);
  const findFn = useServerFn(findVehicleByPlate);
  const servicesFn = useServerFn(listServices);
  const createOrderFn = useServerFn(createOrder);
  const createNewCustomerOrderFn = useServerFn(createNewCustomerOrder);

  const [step, setStep] = useState<Step>("capture");
  const [plate, setPlate] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof findVehicleByPlate>> | null>(
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);

  const [cliente, setCliente] = useState({ nome: "", telefone: "" });
  const [veic, setVeic] = useState({ marca: "", modelo: "", cor: "" });

  const services = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesFn(),
    enabled: step === "services",
  });

  const recognizeMutation = useMutation({
    mutationFn: (image: string) => recognizeFn({ data: { image } }),
    onSuccess: (res) => {
      if (!res.plate) {
        toast.error("Não consegui ler a placa. Digite manualmente.");
        setConfidence(null);
        setStep("confirm");
        return;
      }
      setPlate(res.plate);
      setConfidence(res.confidence);
      setStep("confirm");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setStep("confirm");
    },
  });

  const findMutation = useMutation({
    mutationFn: (placa: string) => findFn({ data: { placa } }),
    onSuccess: (res) => {
      setSummary(res);
      setPlate(res.placa);
      if (res.vehicle) {
        setVehicleId(res.vehicle.id);
        setStep("vehicle");
      } else {
        setStep("quick");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderMutation = useMutation({
    mutationFn: () =>
      vehicleId
        ? createOrderFn({ data: { vehicle_id: vehicleId, service_ids: selected } })
        : createNewCustomerOrderFn({
            data: {
              placa: plate,
              cliente_nome: cliente.nome,
              cliente_telefone: cliente.telefone,
              marca: veic.marca,
              modelo: veic.modelo,
              cor: veic.cor,
              service_ids: selected,
            },
          }),
    onSuccess: (res) => navigate({ to: "/os/$id", params: { id: res.orderId } }),
    onError: (e: Error) => toast.error(e.message),
  });

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => recognizeMutation.mutate(String(reader.result));
    reader.readAsDataURL(file);
  }

  const active = (services.data ?? []).filter((s) => s.ativo);
  const subtotal = active
    .filter((s) => selected.includes(s.id))
    .reduce((acc, s) => acc + Number(s.preco), 0);

  return (
    <AppShell title="Novo atendimento" back="/home">
      {step === "capture" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para a placa do veículo. Você poderá confirmar antes de continuar.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <Button
            className="h-28 w-full rounded-3xl bg-brand text-lg font-bold text-primary-foreground shadow-glow"
            onClick={() => fileRef.current?.click()}
            disabled={recognizeMutation.isPending}
          >
            {recognizeMutation.isPending ? (
              <Loader2 className="size-7 animate-spin" />
            ) : (
              <>
                <Camera className="mr-2 size-7" /> FOTOGRAFAR PLACA
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            className="h-13 w-full text-base"
            onClick={() => {
              setConfidence(null);
              setStep("confirm");
            }}
          >
            <Keyboard className="mr-2 size-5" /> DIGITAR PLACA MANUALMENTE
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border/60 bg-card p-5 text-center shadow-card">
            <p className="text-xs text-muted-foreground">Placa identificada</p>
            <Input
              value={plate}
              onChange={(e) => setPlate(normalizePlate(e.target.value).slice(0, 7))}
              className="plate mt-3 h-16 text-center text-2xl uppercase"
              placeholder="ABC1D23"
              autoFocus
            />
            {confidence !== null && (
              <p className="mt-3 text-xs text-muted-foreground">
                Confiança: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
          <Button
            className="h-14 w-full text-base font-semibold"
            disabled={plate.length < 6 || findMutation.isPending}
            onClick={() => findMutation.mutate(plate)}
          >
            {findMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : "CONFIRMAR"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep("capture")}>
            Tirar outra foto
          </Button>
        </div>
      )}

      {step === "vehicle" && summary?.vehicle && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
            <p className="plate text-2xl">{summary.vehicle.placa}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {[summary.vehicle.marca, summary.vehicle.modelo, summary.vehicle.cor]
                .filter(Boolean)
                .join(" · ") || "Sem dados do veículo"}
            </p>
            <div className="mt-4 border-t border-border/60 pt-4 text-sm">
              <p className="font-semibold">{summary.vehicle.customers?.nome ?? "Sem cliente"}</p>
              <p className="text-muted-foreground">{summary.vehicle.customers?.telefone ?? "—"}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Atendimentos</p>
                <p className="font-semibold">{summary.stats?.total ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Último</p>
                <p className="font-semibold">{dateBR(summary.stats?.last ?? null)}</p>
              </div>
            </div>
          </div>
          <Button
            className="h-14 w-full text-base font-semibold"
            onClick={() => setStep("services")}
          >
            INICIAR ATENDIMENTO
          </Button>
        </div>
      )}

      {step === "quick" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const phone = cliente.telefone.replace(/\D/g, "");
            if (cliente.nome.trim().length < 2) {
              toast.error("Informe o nome do cliente.");
              return;
            }
            if (phone.length < 10 || phone.length > 11) {
              toast.error("Informe um telefone válido com DDD.");
              return;
            }
            setStep("services");
          }}
        >
          <div className="rounded-2xl border border-warning/40 bg-card p-4 text-sm">
            Veículo ainda não cadastrado.
            <p className="plate mt-2 text-xl">{plate}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnome">Nome do cliente</Label>
            <Input
              id="cnome"
              value={cliente.nome}
              onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctel">Telefone</Label>
            <Input
              id="ctel"
              inputMode="tel"
              value={cliente.telefone}
              onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
              required
              minLength={10}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={veic.marca}
                onChange={(e) => setVeic({ ...veic, marca: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={veic.modelo}
                onChange={(e) => setVeic({ ...veic, modelo: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <Input
              id="cor"
              value={veic.cor}
              onChange={(e) => setVeic({ ...veic, cor: e.target.value })}
            />
          </div>
          <Button type="submit" className="h-14 w-full text-base font-semibold">
            CONTINUAR PARA SERVIÇOS
          </Button>
        </form>
      )}

      {step === "services" && (
        <div className="space-y-4">
          <p className="plate text-xl">{plate}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Escolha os serviços deste atendimento. Opções da categoria lavagem não podem ser
            combinadas entre si.
          </p>
          {services.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando serviços…</p>
          )}
          <div className="space-y-2">
            {active.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(toggleServiceSelection(selected, s, active))}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                    on ? "border-primary bg-primary/10" : "border-border/60 bg-card"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{s.nome}</span>
                    {isWashService(s) && (
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        Uma opção de lavagem por atendimento
                      </span>
                    )}
                  </span>
                  <span className="text-sm">{brl(s.preco)}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm">
            <Row label="Subtotal" value={brl(subtotal)} />
            <Row label="Desconto" value={brl(0)} />
            <Row label="Acréscimo" value={brl(0)} />
            <div className="mt-2 border-t border-border/60 pt-2">
              <Row label="Total" value={brl(subtotal)} strong />
            </div>
          </div>

          <Button
            className="h-14 w-full text-base font-semibold"
            disabled={!selected.length || orderMutation.isPending}
            onClick={() => orderMutation.mutate()}
          >
            {orderMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : vehicleId ? (
              "CRIAR ORDEM DE SERVIÇO"
            ) : (
              "CADASTRAR CLIENTE E CRIAR ORDEM"
            )}
          </Button>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "text-lg font-bold" : ""}>{value}</span>
    </div>
  );
}
