import { useEffect, useRef } from "react";
// Import relativo: o componente também é usado pelo painel admin (via @core).
import { turnstileSiteKey } from "../../lib/captcha";

/**
 * Verificação anti-robô (Cloudflare Turnstile) usada no cadastro e no login.
 * O token vai junto para o Supabase, que confere com a chave secreta (configurada
 * no painel do Supabase em Authentication → Bot and Abuse Protection).
 * Sem VITE_TURNSTILE_SITE_KEY o componente não aparece (ex.: desenvolvimento).
 */

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile indisponível."));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Não foi possível carregar a verificação."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * `resetKey`: mude o valor depois de cada tentativa (o token só vale uma vez) para
 * gerar um novo.
 */
export function Turnstile({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void;
  resetKey?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const siteKey = turnstileSiteKey();

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;
    const element = container.current;
    loadTurnstile()
      .then((api) => {
        if (cancelled || widget.current) return;
        widget.current = api.render(element, {
          sitekey: siteKey,
          theme: "dark",
          language: "pt-br",
          callback: (token) => callback.current(token),
          "expired-callback": () => callback.current(null),
          "error-callback": () => callback.current(null),
        });
      })
      .catch(() => callback.current(null));
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey && widget.current) {
      callback.current(null);
      window.turnstile?.reset(widget.current);
    }
  }, [resetKey]);

  if (!siteKey) return null;
  return <div ref={container} className="min-h-[65px]" aria-label="Verificação anti-robô" />;
}
