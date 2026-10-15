import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Car, House, LogOut, Menu, WalletCards, Wrench } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";
import {
  endDemoSession,
  getDemoBusiness,
  hasDemoSession,
  isDemoOnboardingPending,
} from "@/lib/demo-auth";
import { WashMark } from "@/components/app/wash-brand";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";
import { getSession } from "@/lib/lavajato.functions";

export function AppShell({
  title,
  back,
  children,
  action,
  wide = false,
}: {
  title: string;
  back?: string;
  children: ReactNode;
  action?: ReactNode;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useServerFn(getSession);
  const demoOnboardingPending = isDemoOnboardingPending();
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: () => session(),
    staleTime: 60_000,
    enabled: !demoOnboardingPending,
  });
  const demoBusiness = getDemoBusiness();
  const businessName = demoBusiness?.nome ?? sessionQuery.data?.tenant?.nome;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (hasDemoSession()) endDemoSession();
    else await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen min-h-dvh bg-hero">
      <WashHoseBackdrop />
      <header className="wash-header sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          {back ? (
            <Link to={back} className="rounded-full p-2 hover:bg-secondary" aria-label="Voltar">
              <ArrowLeft className="size-5" />
            </Link>
          ) : null}
          <WashMark className="size-7 text-primary" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.08em]">{title}</h1>
            {businessName ? (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                EMPRESA: {businessName}
              </p>
            ) : null}
          </div>
          {action ?? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl transition-transform duration-200 hover:scale-105 active:scale-90"
                  aria-label="Abrir menu da conta"
                >
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border-primary/25 bg-card/98 p-2 shadow-xl backdrop-blur"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <span className="block truncate text-xs text-muted-foreground">Lava-jato</span>
                  <span className="mt-0.5 block truncate text-sm">
                    {businessName ?? "Minha empresa"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="rounded-xl px-3 py-3 focus:bg-primary/10 focus:text-primary"
                >
                  <Link to="/perfil">
                    <Building2 />
                    Perfil do lava-jato
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="rounded-xl px-3 py-3 focus:bg-primary/10 focus:text-primary"
                >
                  <Link to="/servicos">
                    <Wrench />
                    Catálogo de serviços
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => void signOut()}
                >
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      {demoBusiness ? (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-primary">
          Ambiente de teste · dados operacionais simulados
        </div>
      ) : null}
      <main
        className={`page-enter mx-auto w-full px-4 py-6 safe-bottom md:px-6 ${wide ? "max-w-6xl" : "max-w-5xl"}`}
      >
        {children}
      </main>
      {!back && (
        <nav className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1">
            <NavItem to="/home" icon={<House className="size-4" />} label="Operação" />
            <NavItem to="/servicos" icon={<Wrench className="size-4" />} label="Serviços" />
            <NavItem
              to="/financeiro"
              icon={<WalletCards className="size-4" />}
              label="Financeiro"
            />
            <NavItem to="/veiculos" icon={<Car className="size-4" />} label="Veículos" />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "bg-primary text-primary-foreground",
      }}
      inactiveProps={{
        className: "text-muted-foreground hover:bg-secondary",
      }}
      className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-1 py-2 text-[10px] font-bold uppercase tracking-wide transition-[color,background-color,transform] duration-200 hover:-translate-y-0.5 active:scale-95 min-[380px]:gap-2 min-[380px]:px-2 min-[380px]:text-[11px]"
    >
      {icon}
      {label}
    </Link>
  );
}
