// Links que o Supabase manda por e-mail (confirmação de cadastro e recuperação de
// senha). Chegam como ?token_hash=… (modelo recomendado) ou com a sessão depois
// do # (modelo padrão). Só roda no navegador.

export type EmailLinkTokens = { tokenHash: string } | { refreshToken: string } | { error: string };

export function readEmailLinkTokens(): EmailLinkTokens {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  // Tira os tokens da barra de endereço e do histórico antes de qualquer coisa.
  window.history.replaceState(null, "", window.location.pathname);
  const error = hash.get("error_description") ?? search.get("error_description");
  if (error) return { error };
  const tokenHash = search.get("token_hash");
  if (tokenHash) return { tokenHash };
  const refreshToken = hash.get("refresh_token");
  if (refreshToken) return { refreshToken };
  return { error: "Link incompleto." };
}
