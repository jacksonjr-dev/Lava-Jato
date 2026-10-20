// Avisos ao cliente quando o carro fica pronto. Hoje o canal é a notificação no
// celular (web push); outros canais (ex.: WhatsApp automático) entram em
// customer-notifications.server.ts usando a mesma mensagem.

/** Serviços de push dos navegadores. O servidor só envia para estes endereços. */
const PUSH_HOSTS = [
  "fcm.googleapis.com", // Chrome, Edge (Android), Samsung Internet
  "updates.push.services.mozilla.com", // Firefox
  "web.push.apple.com", // Safari (iPhone e Mac)
];
const PUSH_HOST_SUFFIXES = [".notify.windows.com", ".push.apple.com"]; // Edge (Windows), Apple

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const BASE64URL = /^[A-Za-z0-9_-]+=*$/;

/**
 * Confere a assinatura de push enviada pelo navegador. O endereço precisa ser de
 * um serviço de push conhecido: sem isso, alguém poderia cadastrar um endereço
 * qualquer e fazer o servidor enviar requisições para ele.
 */
export function validatePushSubscription(input: unknown): PushSubscriptionInput {
  const value = input as Partial<PushSubscriptionInput> | null;
  const endpoint = typeof value?.endpoint === "string" ? value.endpoint : "";
  const p256dh = typeof value?.keys?.p256dh === "string" ? value.keys.p256dh : "";
  const auth = typeof value?.keys?.auth === "string" ? value.keys.auth : "";
  let host = "";
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error();
    host = url.hostname.toLowerCase();
  } catch {
    throw new Error("Não foi possível ativar o aviso neste navegador.");
  }
  const knownHost =
    PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  if (
    !knownHost ||
    endpoint.length > 1000 ||
    p256dh.length < 40 ||
    p256dh.length > 200 ||
    auth.length < 10 ||
    auth.length > 100 ||
    !BASE64URL.test(p256dh) ||
    !BASE64URL.test(auth)
  ) {
    throw new Error("Não foi possível ativar o aviso neste navegador.");
  }
  return { endpoint, keys: { p256dh, auth } };
}

export type CustomerMessage = { title: string; body: string; url: string; tag: string };

/** Mensagem de "carro pronto". `tag` evita avisos repetidos do mesmo atendimento. */
export function readyMessage(info: {
  plate: string;
  tenantName: string;
  orderNumber: number;
  hasPix: boolean;
}): CustomerMessage {
  return {
    title: "Seu carro está pronto!",
    body: `${info.plate} · ${info.tenantName}. ${
      info.hasPix ? "Pague pelo PIX ou no lava-jato e retire." : "Já pode retirar no lava-jato."
    }`,
    url: "/cliente",
    tag: `lavapro-pronto-${info.orderNumber}`,
  };
}

/** Status em que o carro passa a estar pronto para retirada. */
export function isReadyTransition(status: string): boolean {
  return status === "AGUARDANDO_PAGAMENTO" || status === "FINALIZADO";
}

/**
 * Traduz o erro do navegador ao ativar o aviso. Erros do próprio navegador
 * (DOMException) chegam em inglês e sem orientação; os do servidor já vêm em
 * português e são mantidos.
 */
export function pushErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  if (name === "AbortError" || /push service/i.test(message)) {
    return (
      "Este navegador não conseguiu falar com o serviço de notificações. No Brave, ative " +
      "“Usar serviços do Google para mensagens push” em Configurações > Privacidade. Em rede " +
      "de empresa esse acesso pode estar bloqueado: tente pelo 4G ou no Chrome, Edge ou Firefox."
    );
  }
  if (name === "NotAllowedError") {
    return "As notificações estão bloqueadas para este site. Libere nas configurações do navegador.";
  }
  if (name || !message) {
    return "Não foi possível ativar o aviso neste navegador. Tente no Chrome, Edge ou Firefox.";
  }
  return message;
}
