import { Check, XCircle } from "lucide-react";
import { m } from "motion/react";
import type { OrderStatus } from "@/lib/plate";

const TIMELINE: OrderStatus[] = [
  "AGUARDANDO",
  "EM_LAVAGEM",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "ENTREGUE",
];

const TIMELINE_LABEL: Partial<Record<OrderStatus, string>> = {
  AGUARDANDO: "Chegou",
  EM_LAVAGEM: "Lavando",
  AGUARDANDO_PAGAMENTO: "Pronto",
  PAGO: "Pago",
  ENTREGUE: "Entregue",
};

/** Status legados caem na etapa equivalente da linha do tempo. */
const TIMELINE_INDEX: Partial<Record<OrderStatus, number>> = {
  EM_FINALIZACAO: 1,
  FINALIZADO: 2,
};

export function OrderTimeline({
  status,
  title = "Andamento",
}: {
  status: OrderStatus;
  title?: string;
}) {
  if (status === "CANCELADO") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="size-5 shrink-0" />
        Este atendimento foi cancelado.
      </div>
    );
  }
  const current = TIMELINE_INDEX[status] ?? TIMELINE.indexOf(status);
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Etapas do atendimento">
        {TIMELINE.map((step, index) => {
          const done = index < current || (index === current && step === "ENTREGUE");
          const active = index === current && !done;
          return (
            <li key={step} className="relative flex flex-col items-center text-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 overflow-hidden bg-border"
                >
                  <m.span
                    className="block h-full w-full origin-left bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index <= current ? 1 : 0 }}
                    transition={{ duration: 0.45, delay: index * 0.12, ease: "easeOut" }}
                  />
                </span>
              )}
              <span
                className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-background text-primary shadow-glow"
                      : "border-border bg-background text-muted-foreground"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <m.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 18,
                      delay: index * 0.12,
                    }}
                  >
                    <Check className="size-4" />
                  </m.span>
                ) : (
                  index + 1
                )}
                {active && (
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/50" />
                )}
              </span>
              <span
                className={`mt-2 text-[10px] leading-tight ${
                  active
                    ? "font-bold text-primary"
                    : done
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {TIMELINE_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
