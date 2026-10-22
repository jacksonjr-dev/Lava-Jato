import { createMiddleware } from "@tanstack/react-start";
import type { JwtPayload, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// A sessão vem dos cookies httpOnly gravados no login (session.server.ts); o
// navegador não envia nem conhece o token.
export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    if (process.env["DEMO_MODE"] === "true") {
      return next({
        context: {
          supabase: null as unknown as SupabaseClient<Database>,
          userId: "demo-user",
          claims: { sub: "demo-user", email: "demo@lavapro.local" } as JwtPayload,
        },
      });
    }

    const { createUserClient, readSession } = await import("./session.server");
    const session = await readSession();
    if (!session) {
      throw new Error("Unauthorized: sessão expirada. Entre novamente.");
    }

    return next({
      context: {
        supabase: createUserClient(session.accessToken),
        userId: session.userId,
        claims: session.claims,
      },
    });
  },
);
