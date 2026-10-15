import type { OrderStatus } from "./plate";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  AGUARDANDO: "EM_LAVAGEM",
  EM_LAVAGEM: "AGUARDANDO_PAGAMENTO",
  EM_FINALIZACAO: "AGUARDANDO_PAGAMENTO",
  FINALIZADO: "AGUARDANDO_PAGAMENTO",
  AGUARDANDO_PAGAMENTO: "PAGO",
  PAGO: "ENTREGUE",
};

const CANCELLABLE = new Set<OrderStatus>([
  "AGUARDANDO",
  "EM_LAVAGEM",
  "EM_FINALIZACAO",
  "FINALIZADO",
  "AGUARDANDO_PAGAMENTO",
]);

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function allowedManualTransitions(status: OrderStatus): OrderStatus[] {
  const next = nextOrderStatus(status);
  const transitions: OrderStatus[] = [];
  // PAGO is exclusively produced by registerPayment.
  if (next && next !== "PAGO") transitions.push(next);
  if (CANCELLABLE.has(status)) transitions.push("CANCELADO");
  return transitions;
}

export function canTransitionOrder(
  current: OrderStatus,
  target: OrderStatus,
  options: { viaPayment?: boolean; canCancel?: boolean } = {},
): boolean {
  if (current === target) return true;
  if (target === "CANCELADO") return options.canCancel === true && CANCELLABLE.has(current);
  if (target === "PAGO") {
    return options.viaPayment === true && current === "AGUARDANDO_PAGAMENTO";
  }
  return nextOrderStatus(current) === target;
}

export function assertOrderTransition(
  current: OrderStatus,
  target: OrderStatus,
  options: { viaPayment?: boolean; canCancel?: boolean } = {},
): void {
  if (!canTransitionOrder(current, target, options)) {
    throw new Error(`Transição de status inválida: ${current} → ${target}.`);
  }
}
