// Textos e horários do acompanhamento na área do cliente.
import type { OrderStatus } from "./plate";

type StatusMessage = { titulo: string; detalhe: string; tom: "andamento" | "pronto" | "fim" };

/** Mensagem principal do acompanhamento, na linguagem do cliente. */
export function portalStatusMessage(status: OrderStatus, hasPix: boolean): StatusMessage {
  switch (status) {
    case "AGUARDANDO":
      return {
        titulo: "Seu carro chegou",
        detalhe: "Ele está na fila e logo começa o serviço.",
        tom: "andamento",
      };
    case "EM_LAVAGEM":
    case "EM_FINALIZACAO":
      return {
        titulo: "Seu carro está sendo lavado",
        detalhe: "Avisaremos aqui assim que ele ficar pronto.",
        tom: "andamento",
      };
    case "FINALIZADO":
    case "AGUARDANDO_PAGAMENTO":
      return {
        titulo: "Seu carro está pronto!",
        detalhe: hasPix
          ? "Pague pelo PIX aqui mesmo ou no lava-jato e retire o veículo."
          : "Faça o pagamento no lava-jato e retire o veículo.",
        tom: "pronto",
      };
    case "PAGO":
      return {
        titulo: "Pagamento confirmado",
        detalhe: "Tudo certo! É só retirar o veículo no lava-jato.",
        tom: "pronto",
      };
    case "ENTREGUE":
      return { titulo: "Veículo entregue", detalhe: "Obrigado pela preferência!", tom: "fim" };
    case "CANCELADO":
      return {
        titulo: "Atendimento cancelado",
        detalhe: "Em caso de dúvida, fale com o lava-jato.",
        tom: "fim",
      };
  }
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const hourMinute = (date: Date) =>
  date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "hoje às 14:32", "ontem às 09:10" ou "18/10 às 14:32". */
export function whenText(iso: string | null | undefined, now = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const day = sameDay(date, now)
    ? "hoje"
    : sameDay(date, yesterday)
      ? "ontem"
      : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${day} às ${hourMinute(date)}`;
}

/** "agora mesmo", "há 5 min", "há 2 h" ou a data, para a última atualização. */
export function sinceText(iso: string | null | undefined, now = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (Number.isNaN(minutes)) return null;
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  if (minutes < 24 * 60 && sameDay(date, now)) return `há ${Math.floor(minutes / 60)} h`;
  return whenText(iso, now);
}
