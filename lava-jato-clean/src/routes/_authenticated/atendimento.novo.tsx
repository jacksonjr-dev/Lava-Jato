import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  History,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { CountUp } from "@/components/app/motion";
import { PlateBadge, PlateInput } from "@/components/app/plate-badge";
import { useFeature } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createOrder,
  createNewCustomerOrder,
  findVehicleByPlate,
  listServices,
} from "@/lib/lavajato.functions";
import { brl, dateBR, normalizePlate } from "@/lib/plate";
import { preloadPlateOcr, readPlateWithOcr } from "@/lib/plate-ocr";
import { assessFrameQuality, PlateReadConfirmation } from "@/lib/plate-scan";
import { isWashService, toggleServiceSelection } from "@/lib/service-selection";

export const Route = createFileRoute("/_authenticated/atendimento/novo")({
  head: () => ({
    meta: [
      { title: "Novo atendimento — LavaPro" },
      { name: "description", content: "Aponte a câmera para a placa e inicie o atendimento." },
      { property: "og:title", content: "Novo atendimento — LavaPro" },
      {
        property: "og:description",
        content: "Aponte a câmera para a placa e inicie o atendimento.",
      },
    ],
  }),
  component: NovoAtendimento,
});

type Step = "plate" | "vehicle" | "quick" | "services";

const STAGES = ["Placa", "Cliente", "Serviços"] as const;
const STAGE_OF: Record<Step, number> = { plate: 0, vehicle: 1, quick: 1, services: 2 };

function NovoAtendimento() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const leituraPorFoto = useFeature("placa_foto");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [stableReads, setStableReads] = useState(0);

  // Baixa o motor de OCR enquanto a pessoa ainda está na tela da placa.
  useEffect(() => {
    if (leituraPorFoto) preloadPlateOcr();
  }, [leituraPorFoto]);

  const findFn = useServerFn(findVehicleByPlate);
  const servicesFn = useServerFn(listServices);
  const createOrderFn = useServerFn(createOrder);
  const createNewCustomerOrderFn = useServerFn(createNewCustomerOrder);

  const [step, setStep] = useState<Step>("plate");
  const [direction, setDirection] = useState(1);
  const [plate, setPlate] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof findVehicleByPlate>> | null>(
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [cliente, setCliente] = useState({ nome: "", telefone: "" });
  const [veic, setVeic] = useState({ marca: "", modelo: "", cor: "" });

  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    const videoElement = videoRef.current;
    const canvas = document.createElement("canvas");
    const confirmation = new PlateReadConfirmation();

    const scheduleNextFrame = (delay = 500) => {
      timer = window.setTimeout(() => void scanFrame(), delay);
    };

    async function scanFrame() {
      if (cancelled) return;
      const video = videoElement;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setScannerMessage("Iniciando a câmera traseira…");
        scheduleNextFrame(250);
        return;
      }

      let frame: Blob | null = null;
      try {
        const sourceWidth = video.videoWidth * 0.9;
        const sourceHeight = video.videoHeight * 0.4;
        const sourceX = video.videoWidth * 0.05;
        const sourceY = video.videoHeight * 0.3;
        const scale = Math.min(1, 1400 / sourceWidth);
        canvas.width = Math.round(sourceWidth * scale);
        canvas.height = Math.round(sourceHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas indisponível.");
        context.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const quality = assessFrameQuality(image.data, canvas.width, canvas.height);
        if (!quality.usable) {
          confirmation.reset();
          setStableReads(0);
          setScannerMessage(
            quality.reason === "dark"
              ? "Imagem escura. Aponte para uma área mais iluminada."
              : quality.reason === "bright"
                ? "Imagem com reflexo ou luz forte. Mude um pouco o ângulo."
                : "Imagem desfocada. Segure o celular firme e aguarde o foco.",
          );
          scheduleNextFrame();
          return;
        }
        frame = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9),
        );
        if (!frame) throw new Error("Não foi possível capturar um quadro da câmera.");
      } catch (error) {
        if (!cancelled) {
          console.error("[scanner da placa]", error);
          setScannerMessage("Não consegui analisar este quadro. Mantenha a placa na moldura.");
          scheduleNextFrame();
        }
        return;
      }

      try {
        const result = await readPlateWithOcr(frame, { strict: true });
        if (cancelled) return;
        const progress = confirmation.observe(result.plate, result.confidence);
        setStableReads(progress.stableReads);

        if (progress.confirmed) {
          setPlate(progress.confirmed);
          setConfidence(result.confidence);
          setScannerOpen(false);
          return;
        }

        setScannerMessage(
          progress.stableReads > 0
            ? `Confirmando ${progress.plate}: ${progress.stableReads}/3 leituras estáveis…`
            : result.plate
              ? "Leitura instável. Continue mantendo a placa na moldura."
              : "Procurando a placa. Centralize, aproxime e melhore a iluminação.",
        );
      } catch (error) {
        if (cancelled) return;
        confirmation.reset();
        setStableReads(0);
        console.error("[OCR ao vivo]", error);
        setScannerMessage(
          "A leitura falhou neste quadro. Mantenha a placa visível e tente novamente.",
        );
      }

      if (!cancelled) scheduleNextFrame();
    }

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerMessage("Este navegador não oferece acesso à câmera. Tente em outro navegador.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoElement;
        if (!video) throw new Error("Vídeo da câmera indisponível.");
        video.srcObject = stream;
        await video.play();
        if (!cancelled) {
          setScannerMessage(
            "Procurando a placa. Centralize na moldura e mantenha o celular firme.",
          );
          scheduleNextFrame(250);
        }
      } catch (error) {
        if (cancelled) return;
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        if (videoElement) videoElement.srcObject = null;
        const name = error instanceof DOMException ? error.name : "";
        setScannerMessage(
          name === "NotAllowedError"
            ? "Acesso à câmera negado. Libere a câmera nas permissões do navegador e tente novamente."
            : name === "NotFoundError"
              ? "Nenhuma câmera foi encontrada neste dispositivo."
              : "Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.",
        );
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      const video = videoElement;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [scannerOpen]);

  function go(next: Step) {
    setDirection(STAGE_OF[next] >= STAGE_OF[step] ? 1 : -1);
    setStep(next);
  }

  function goBack() {
    if (step === "services") go(vehicleId ? "vehicle" : "quick");
    else if (step === "vehicle" || step === "quick") go("plate");
  }

  const services = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesFn(),
  });

  const findMutation = useMutation({
    mutationFn: (placa: string) => findFn({ data: { placa } }),
    onSuccess: (res) => {
      setSummary(res);
      setPlate(res.placa);
      if (res.vehicle) {
        setVehicleId(res.vehicle.id);
        go("vehicle");
      } else {
        setVehicleId(null);
        go("quick");
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
    onSuccess: (res) => {
      toast.success("Atendimento criado!");
      navigate({ to: "/os/$id", params: { id: res.orderId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = (services.data ?? []).filter((s) => s.ativo);
  const subtotal = active
    .filter((s) => selected.includes(s.id))
    .reduce((acc, s) => acc + Number(s.preco), 0);
  const stage = STAGE_OF[step];

  return (
    <AppShell title="Novo atendimento" back="/home">
      <div className="mx-auto max-w-xl">
        <Progress stage={stage} />

        {step !== "plate" && (
          <button
            type="button"
            onClick={goBack}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
        )}

        <div className="relative mt-4">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <m.div
              key={step}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            >
              {step === "plate" && (
                <div className="space-y-6">
                  <StepTitle
                    title="Qual é a placa?"
                    text="Digite a placa ou aponte a câmera. O sistema busca o cliente e o histórico."
                  />
                  <form
                    className="flex flex-col items-center gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (plate.length >= 6) findMutation.mutate(plate);
                    }}
                  >
                    <PlateInput
                      value={plate}
                      onChange={(e) => {
                        setPlate(normalizePlate(e.target.value).slice(0, 7));
                        setConfidence(null);
                      }}
                      placeholder="ABC1D23"
                      aria-label="Placa do veículo"
                      autoFocus
                    />
                    <AnimatePresence>
                      {confidence !== null && (
                        <m.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-xs text-primary"
                        >
                          <Sparkles className="size-3.5" />
                          Lida ao vivo · confiança {Math.round(confidence * 100)}%. Confira antes de
                          seguir.
                        </m.p>
                      )}
                    </AnimatePresence>
                    <Button
                      type="submit"
                      className="mt-2 h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-glow"
                      disabled={plate.length < 6 || findMutation.isPending}
                    >
                      {findMutation.isPending ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          CONTINUAR <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> ou{" "}
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  {leituraPorFoto ? (
                    <m.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setStableReads(0);
                        setScannerMessage("Solicitando acesso à câmera traseira…");
                        setScannerOpen(true);
                      }}
                      className="flex h-20 w-full items-center justify-center gap-3 rounded-3xl border border-primary/40 bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
                    >
                      <Camera className="size-6" /> LER PLACA AO VIVO
                    </m.button>
                  ) : (
                    <Link
                      to="/planos"
                      className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-border text-center text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <Lock className="size-4" /> LEITURA DA PLACA PELA CÂMERA
                      </span>
                      Disponível no plano Max
                    </Link>
                  )}
                </div>
              )}

              {step === "vehicle" && summary?.vehicle && (
                <div className="space-y-5">
                  <StepTitle
                    title="Cliente encontrado"
                    text="Confira os dados e escolha os serviços."
                  />
                  <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <PlateBadge plate={summary.vehicle.placa} />
                      <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
                        Cliente cadastrado
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {[summary.vehicle.marca, summary.vehicle.modelo, summary.vehicle.cor]
                        .filter(Boolean)
                        .join(" · ") || "Sem dados do veículo"}
                    </p>
                    <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {(summary.vehicle.customers?.nome ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {summary.vehicle.customers?.nome ?? "Sem cliente"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {summary.vehicle.customers?.telefone ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Visitas" value={String(summary.stats?.total ?? 0)} />
                      <MiniStat
                        label="Última"
                        value={dateBR(summary.stats?.last ?? null).slice(0, 5)}
                      />
                      <MiniStat label="Gasto" value={brl(summary.stats?.totalGasto ?? 0)} />
                    </div>
                    {summary.stats?.topServices.length ? (
                      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <History className="size-3.5 shrink-0 text-primary" />
                        Costuma fazer:{" "}
                        {summary.stats.topServices.map((service) => service.nome).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="h-14 w-full rounded-2xl text-base font-bold shadow-glow"
                    onClick={() => go("services")}
                  >
                    ESCOLHER SERVIÇOS <ArrowRight className="size-5" />
                  </Button>
                </div>
              )}

              {step === "quick" && (
                <form
                  className="space-y-5"
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
                    go("services");
                  }}
                >
                  <StepTitle
                    title="Primeira visita"
                    text="Esta placa ainda não tem cadastro. Leva menos de um minuto."
                  />
                  <div className="flex items-center justify-between gap-4 rounded-3xl border border-warning/40 bg-warning/5 p-4">
                    <PlateBadge plate={plate} />
                    <UserPlus className="size-6 text-warning" />
                  </div>
                  <Field id="cnome" label="Nome do cliente">
                    <Input
                      id="cnome"
                      value={cliente.nome}
                      onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                      autoComplete="name"
                      autoFocus
                      required
                    />
                  </Field>
                  <Field
                    id="ctel"
                    label="Telefone com DDD"
                    hint="Usado para o cliente acompanhar o serviço."
                  >
                    <Input
                      id="ctel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(85) 99999-1234"
                      value={cliente.telefone}
                      onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                      required
                      minLength={10}
                    />
                  </Field>
                  <details className="group rounded-2xl border border-border bg-card/60 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-muted-foreground">
                      <span className="text-primary transition-transform group-open:rotate-45 inline-block mr-2">
                        +
                      </span>
                      Dados do veículo (opcional)
                    </summary>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Field id="marca" label="Marca">
                        <Input
                          id="marca"
                          value={veic.marca}
                          onChange={(e) => setVeic({ ...veic, marca: e.target.value })}
                        />
                      </Field>
                      <Field id="modelo" label="Modelo">
                        <Input
                          id="modelo"
                          value={veic.modelo}
                          onChange={(e) => setVeic({ ...veic, modelo: e.target.value })}
                        />
                      </Field>
                      <div className="col-span-2">
                        <Field id="cor" label="Cor">
                          <Input
                            id="cor"
                            value={veic.cor}
                            onChange={(e) => setVeic({ ...veic, cor: e.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  </details>
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-2xl text-base font-bold shadow-glow"
                  >
                    ESCOLHER SERVIÇOS <ArrowRight className="size-5" />
                  </Button>
                </form>
              )}

              {step === "services" && (
                <div className="space-y-4 pb-28">
                  <div className="flex items-end justify-between gap-4">
                    <StepTitle
                      title="Quais serviços?"
                      text="Uma opção de lavagem por atendimento; adicionais podem ser combinados."
                    />
                    <PlateBadge plate={plate} className="shrink-0" />
                  </div>
                  {services.isLoading && (
                    <div className="space-y-2">
                      {[0, 1, 2].map((item) => (
                        <Skeleton key={item} className="h-[72px] rounded-2xl" />
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {active.map((s, index) => {
                      const on = selected.includes(s.id);
                      return (
                        <m.button
                          key={s.id}
                          type="button"
                          aria-pressed={on}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelected(toggleServiceSelection(selected, s, active))}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                            on
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-card hover:border-primary/40"
                          }`}
                        >
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            }`}
                          >
                            <AnimatePresence>
                              {on && (
                                <m.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: "spring", stiffness: 700, damping: 20 }}
                                >
                                  <Check className="size-3.5" />
                                </m.span>
                              )}
                            </AnimatePresence>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{s.nome}</span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {isWashService(s) ? "Lavagem" : "Adicional"}
                              {s.duracao_min ? ` · ${s.duracao_min} min` : ""}
                            </span>
                          </span>
                          <span className="text-sm font-bold tabular-nums">{brl(s.preco)}</span>
                        </m.button>
                      );
                    })}
                  </div>

                  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
                    <div className="mx-auto flex max-w-xl items-center gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {selected.length} {selected.length === 1 ? "serviço" : "serviços"}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-primary">
                          <CountUp value={subtotal} format={brl} />
                        </p>
                      </div>
                      <Button
                        className="h-13 flex-1 rounded-2xl text-sm font-bold shadow-glow"
                        disabled={!selected.length || orderMutation.isPending}
                        onClick={() => orderMutation.mutate()}
                      >
                        {orderMutation.isPending ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : vehicleId ? (
                          "CRIAR ATENDIMENTO"
                        ) : (
                          "CADASTRAR E CRIAR"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
      {scannerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plate-scanner-title"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black px-4 py-6 text-white"
        >
          <div className="flex w-full max-w-2xl items-center justify-between gap-4">
            <div>
              <h2 id="plate-scanner-title" className="text-lg font-bold">
                Leitura automática da placa
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Centralize a placa na moldura e mantenha o celular firme.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen(false)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Cancelar leitura e fechar câmera"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-3xl bg-neutral-900">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="size-full object-cover"
              aria-label="Imagem ao vivo da câmera traseira"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[5%] top-[34%] flex h-[32%] w-[90%] items-end justify-center rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,0.3)]"
            >
              <span className="mb-2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                Área de leitura
              </span>
            </div>
          </div>

          <div className="w-full max-w-2xl space-y-4 text-center">
            <p aria-live="polite" className="min-h-10 text-sm text-white/90">
              {scannerMessage || "Iniciando a câmera traseira…"}
            </p>
            {stableReads > 0 && (
              <div
                className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold"
                aria-label={`${stableReads} de 3 leituras estáveis`}
              >
                <Loader2 className="size-4 animate-spin" /> {stableReads}/3 leituras estáveis
              </div>
            )}
            <button
              type="button"
              onClick={() => setScannerOpen(false)}
              className="h-12 rounded-xl border border-white/30 px-6 text-sm font-bold hover:bg-white/10"
            >
              CANCELAR LEITURA
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Progress({ stage }: { stage: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Etapas do novo atendimento">
      {STAGES.map((label, index) => (
        <li key={label} aria-current={index === stage ? "step" : undefined}>
          <span className="block h-1.5 overflow-hidden rounded-full bg-border">
            <m.span
              className="block h-full origin-left rounded-full bg-primary"
              initial={false}
              animate={{ scaleX: index <= stage ? 1 : 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </span>
          <span
            className={`mt-2 block text-[10px] font-bold uppercase tracking-wider ${
              index === stage
                ? "text-primary"
                : index < stage
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function StepTitle({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-[-0.04em]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}
