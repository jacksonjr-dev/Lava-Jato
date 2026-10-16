/** Painel em modo demonstração: dados fictícios, sem Supabase. */
export function isAdminDemo(): boolean {
  return import.meta.env["VITE_ADMIN_DEMO_MODE"] === "true";
}

export const DEMO_ADMIN = { email: "admin@lavapro.local", password: "Admin@2026", code: "123456" };
export const DEMO_SESSION_KEY = "lavapro-admin-demo-session";
