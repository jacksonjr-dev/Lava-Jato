import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut } from "lucide-react";
import { WashMark } from "@/components/app/wash-brand";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_SESSION_KEY, isAdminDemo } from "@/lib/demo-flag";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  // Só entra quem concluiu senha + código (aal2). O servidor confere de novo
  // em cada chamada, inclusive se o usuário está em platform_admins.
  beforeLoad: async () => {
    if (isAdminDemo()) {
      if (localStorage.getItem(DEMO_SESSION_KEY) !== "1") throw redirect({ to: "/login" });
      return { email: "admin@lavapro.local" };
    }
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel !== "aal2") throw redirect({ to: "/login" });
    const { data } = await supabase.auth.getUser();
    return { email: data.user?.email ?? null };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { email } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    queryClient.clear();
    if (isAdminDemo()) localStorage.removeItem(DEMO_SESSION_KEY);
    else await supabase.auth.signOut();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-hero">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link to="/empresas" className="flex items-center gap-2">
            <WashMark className="size-7 text-primary" />
            <span className="plate text-xs text-primary">LAVAPRO ADMIN</span>
          </Link>
          {isAdminDemo() && (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
              DEMONSTRAÇÃO
            </span>
          )}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <Link
              to="/empresas"
              activeProps={{ className: "bg-secondary text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              <Building2 className="size-4" /> Empresas
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden truncate text-xs text-muted-foreground md:inline">{email}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
