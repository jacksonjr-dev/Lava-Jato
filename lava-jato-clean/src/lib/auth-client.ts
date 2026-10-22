import { currentOwner } from "./auth.functions";

// Quem está logado, do ponto de vista do navegador. A sessão real fica em cookies
// httpOnly; aqui só guardamos por um minuto para não perguntar ao servidor a cada
// troca de tela. O servidor confere a sessão em toda chamada de qualquer forma.

export type Owner = { id: string; email: string | null };

const CACHE_MS = 60_000;
let cached: { owner: Owner | null; at: number } | null = null;

export async function getOwner(): Promise<Owner | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.owner;
  const owner = await currentOwner();
  cached = { owner, at: Date.now() };
  return owner;
}

/** Chamar depois de entrar ou sair, para a próxima tela perguntar de novo. */
export function forgetOwner(): void {
  cached = null;
}

/** Remove a sessão antiga que a versão anterior guardava no localStorage. */
export function clearLegacySupabaseTokens(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.+-auth-token/.test(key)) localStorage.removeItem(key);
    }
  } catch {
    // Navegação privada ou armazenamento bloqueado: não há o que limpar.
  }
}
