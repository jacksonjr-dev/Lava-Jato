import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppShell({
  title,
  back,
  children,
  action,
}: {
  title: string;
  back?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-hero">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
        {back ? (
          <Link to={back} className="rounded-full p-2 hover:bg-secondary" aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </Link>
        ) : null}
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        {action ?? (
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut className="size-5" />
          </Button>
        )}
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-5 safe-bottom">{children}</main>
    </div>
  );
}
