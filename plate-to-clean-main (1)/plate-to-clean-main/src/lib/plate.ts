export function normalizePlate(input: string): string {
  return (input ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatPlate(input: string): string {
  const p = normalizePlate(input);
  if (p.length !== 7) return p;
  return `${p.slice(0, 3)}${p.slice(3)}`;
}

export function isValidPlate(input: string): boolean {
  const p = normalizePlate(input);
  return /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/.test(p);
}

export const ORDER_STATUSES = [
  "AGUARDANDO",
  "EM_LAVAGEM",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "ENTREGUE",
  "CANCELADO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "EM_FINALIZACAO" | "FINALIZADO";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  AGUARDANDO: "Aguardando",
  EM_LAVAGEM: "Em serviço",
  EM_FINALIZACAO: "Em serviço",
  FINALIZADO: "Pronto para retirada",
  AGUARDANDO_PAGAMENTO: "Pronto para retirada",
  PAGO: "Pago",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const KANBAN_STATUSES: OrderStatus[] = [
  "AGUARDANDO",
  "EM_LAVAGEM",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
];

export const PAYMENT_METHODS = ["DINHEIRO", "PIX", "DEBITO", "CREDITO", "OUTRO"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  OUTRO: "Outro",
};

export function brl(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

export function dateBR(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}
