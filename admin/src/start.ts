import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { attachAdminToken } from "@/integrations/supabase/auth";

export const startInstance = createStart(() => ({
  functionMiddleware: [attachAdminToken],
  requestMiddleware: [createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" })],
}));
