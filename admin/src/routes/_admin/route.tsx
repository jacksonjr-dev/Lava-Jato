import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LayoutDashboard, LogOut, Wallet } from "lucide-react";
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
      <header className="sticky top-0 z-30 border-b border-border bg-background/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link to="/visao-geral" className="flex shrink-0 items-center gap-2">
            <WashMark className="size-7 text-primary" />
            <span className="plate text-xs text-primary">LAVAPRO ADMIN</span>
          </Link>
          {isAdminDemo() && (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
              DEMONSTRAÇÃO
            </span>
          )}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <NavItems />
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden truncate text-xs text-muted-foreground md:inline">{email}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:pb-8 md:px-6 md:pt-8">
        <Outlet />
      </main>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1 border-t border-border bg-background/95 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] sm:hidden"
      >
        <NavItems mobile />
      </nav>
    </div>
  );
}

const NAV = [
  { to: "/visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
] as const;

function NavItems({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} icon={<Icon className="size-4" />} mobile={mobile}>
          {label}
        </NavLink>
      ))}
    </>
  );
}

function NavLink({
  to,
  icon,
  mobile,
  children,
}: {
  to: (typeof NAV)[number]["to"];
  icon: ReactNode;
  mobile: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeProps={{ className: mobile ? "text-primary" : "bg-secondary text-foreground" }}
      inactiveProps={{ className: "text-muted-foreground" }}
      className={
        mobile
          ? "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold"
          : "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
      }
    >
      {icon}
      {children}
    </Link>
  );
}
