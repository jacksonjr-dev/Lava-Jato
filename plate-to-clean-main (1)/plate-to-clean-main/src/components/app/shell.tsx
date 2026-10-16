import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Car,
  Crown,
  House,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
  WalletCards,
  Wrench,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { m } from "motion/react";
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
import { endDemoSession, getDemoBusiness, hasDemoSession } from "@/lib/demo-auth";
import { WashMark } from "@/components/app/wash-brand";
import { TenantLogo } from "@/components/app/tenant-logo";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";
import { SubscriptionBanner } from "@/components/app/plan-gate";
import { useFeature, useSessionQuery } from "@/hooks/use-plan";

type MainTab = {
  to: "/home" | "/servicos" | "/financeiro" | "/veiculos";
  label: string;
  icon: ReactNode;
  locked?: boolean;
};

export function AppShell({
  title,
  back,
  children,
  action,
  wide = false,
}: {
  title: string;
  /** Telas secundárias mostram "voltar" e escondem a navegação principal. */
  back?: string;
  children: ReactNode;
  action?: ReactNode;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const financeiroLiberado = useFeature("financeiro");
  const demoBusiness = getDemoBusiness();
  const businessName = demoBusiness?.nome ?? sessionQuery.data?.tenant?.nome;

  const tabs: MainTab[] = [
    { to: "/home", label: "Operação", icon: <House /> },
    { to: "/servicos", label: "Serviços", icon: <Wrench /> },
    {
      to: "/financeiro",
      label: "Financeiro",
      icon: financeiroLiberado ? <WalletCards /> : <Lock />,
      locked: !financeiroLiberado,
    },
    { to: "/veiculos", label: "Veículos", icon: <Car /> },
  ];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (hasDemoSession()) endDemoSession();
    else await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-hero">
      <WashHoseBackdrop />
      <header className="wash-header sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          {back ? (
            <Link
              to={back}
              className="-ml-2 rounded-full p-2 transition-colors hover:bg-secondary"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : null}
          <Link to="/home" aria-label="Início" className="shrink-0">
            <TenantLogo
              url={sessionQuery.data?.tenant?.logo_url}
              name={businessName ?? "lava-jato"}
              className="size-8"
              fallback={<WashMark className="size-7 text-primary" />}
            />
          </Link>
          <div className="min-w-0 flex-1 md:flex-none">
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.08em]">{title}</h1>
            {businessName ? (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{businessName}</p>
            ) : null}
          </div>

          {!back && (
            <nav aria-label="Navegação principal" className="mx-auto hidden md:flex">
              <div className="flex items-center gap-1 rounded-full border border-border bg-card/70 p-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    activeProps={{ className: "text-primary-foreground" }}
                    inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                    className="relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors [&_svg]:size-4"
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <m.span
                            layoutId="desktop-nav-pill"
                            className="absolute inset-0 rounded-full bg-primary shadow-glow"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {tab.icon}
                          {tab.label}
                        </span>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <div className={back ? "ml-auto" : "md:ml-0"}>
            {action ?? (
              <AccountMenu
                businessName={businessName}
                isPlatformAdmin={Boolean(sessionQuery.data?.isPlatformAdmin)}
                onSignOut={() => void signOut()}
              />
            )}
          </div>
        </div>
      </header>

      {demoBusiness ? (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-primary">
          Ambiente de teste · dados simulados
        </div>
      ) : null}
      <SubscriptionBanner />

      <m.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`mx-auto w-full flex-1 px-4 py-6 md:px-6 md:py-8 ${wide ? "max-w-6xl" : "max-w-5xl"}`}
      >
        {children}
      </m.main>

      {!back && (
        <nav
          aria-label="Navegação principal"
          className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] backdrop-blur-md md:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex min-w-0 flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold uppercase tracking-wide transition-colors"
              >
                {({ isActive }) => (
                  <>
                    <m.span
                      whileTap={{ scale: 0.86 }}
                      className="relative flex h-8 w-14 items-center justify-center [&_svg]:size-5"
                    >
                      {isActive && (
                        <m.span
                          layoutId="mobile-tab-pill"
                          className="absolute inset-0 rounded-full bg-primary/15"
                        />
                      )}
                      <m.span
                        className="relative z-10"
                        animate={isActive ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                      >
                        {tab.icon}
                      </m.span>
                    </m.span>
                    <span className="max-w-full truncate">{tab.label}</span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

function AccountMenu({
  businessName,
  isPlatformAdmin,
  onSignOut,
}: {
  businessName: string | undefined;
  isPlatformAdmin: boolean;
  onSignOut: () => void;
}) {
  const itemClass = "rounded-xl px-3 py-3 focus:bg-primary/10 focus:text-primary";
  return (
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
          <span className="mt-0.5 block truncate text-sm">{businessName ?? "Minha empresa"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/perfil">
            <Building2 />
            Perfil do lava-jato
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/planos">
            <Crown />
            Planos e assinatura
          </Link>
        </DropdownMenuItem>
        {isPlatformAdmin ? (
          <DropdownMenuItem asChild className={itemClass}>
            <Link to="/admin">
              <ShieldCheck />
              Administração LavaPro
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={onSignOut}
        >
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
