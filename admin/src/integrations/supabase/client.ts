import { createClient } from "@supabase/supabase-js";
import type { Database } from "@core/integrations/supabase/types";

// Chaves novas do Supabase (sb_...) não vão no cabeçalho Authorization.
function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function createBrowserClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.");
  return createClient<Database>(url, key, {
    global: { fetch: supabaseFetch(key) },
    auth: {
      // Sessão separada da do app dos lava-jatos e guardada só nesta aba:
      // fechou o navegador, precisa entrar de novo (senha + código).
      storageKey: "lavapro-admin-auth",
      storage: typeof window === "undefined" ? undefined : window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: ReturnType<typeof createBrowserClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop, receiver) {
    client ??= createBrowserClient();
    return Reflect.get(client, prop, receiver);
  },
});
