type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let entry: Promise<ServerEntry> | undefined;

const CSP = [
  "default-src 'self'",
  // challenges.cloudflare.com: verificação anti-robô (Turnstile) no login.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  // O painel não usa câmera, microfone, localização nem pagamentos do navegador.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  // Isola a janela do painel de páginas abertas a partir dela (e vice-versa).
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  // O painel não deve aparecer em buscadores.
  "X-Robots-Tag": "noindex, nofollow",
};

function isHttps(request: Request) {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    entry ??= import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
    const response = await (await entry).fetch(request, env, ctx);
    if (!import.meta.env.PROD) return response;
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
    // Em HTTPS, qualquer recurso pedido por http é trocado por https.
    headers.set(
      "Content-Security-Policy",
      [...CSP, ...(isHttps(request) ? ["upgrade-insecure-requests"] : [])].join("; "),
    );
    // Páginas e respostas de dados do painel nunca ficam em cache (navegador ou proxy).
    const type = headers.get("content-type") ?? "";
    if (type.includes("text/html") || type.includes("json") || !type) {
      headers.set("Cache-Control", "no-store");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
