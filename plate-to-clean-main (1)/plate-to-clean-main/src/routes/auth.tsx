import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  hasDemoSession,
  isDemoOnboardingPending,
  isDemoEnabled,
  endDemoSession,
  startDemoBusinessSignup,
  startDemoSession,
} from "@/lib/demo-auth";
import { getDemoOwnerLoginHint, verifyOwnerBusiness } from "@/lib/lavajato.functions";
import { WashBrand, WashMark } from "@/components/app/wash-brand";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — LavaPro" },
      { name: "description", content: "Acesse o painel do seu lava-jato." },
      { property: "og:title", content: "Entrar — LavaPro" },
      { property: "og:description", content: "Acesse o painel do seu lava-jato." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { modo?: "cadastro" } =>
    search["modo"] === "cadastro" ? { modo: "cadastro" } : {},
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const getDemoLoginHint = useServerFn(getDemoOwnerLoginHint);
  const verifyBusiness = useServerFn(verifyOwnerBusiness);
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(
    search.modo === "cadastro" ? "signup" : "login",
  );
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasDemoSession()) {
      navigate({ to: isDemoOnboardingPending() ? "/onboarding" : "/home", replace: true });
      return;
    }
    // No modo demonstração o Supabase não é configurado.
    if (isDemoEnabled()) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login" && isDemoEnabled()) {
        if (!startDemoSession(email, password)) {
          throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
        }
        try {
          await verifyBusiness({ data: { businessName } });
          navigate({ to: "/home", replace: true });
          return;
        } catch {
          endDemoSession();
          throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
        }
      }

      if (mode === "signup") {
        if (isDemoEnabled()) {
          startDemoBusinessSignup(nome, email);
          toast.success("Conta de teste criada. Agora cadastre sua empresa.");
          navigate({ to: "/onboarding", replace: true });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { nome },
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast.success("Conta criada! Confirme seu e-mail para entrar.");
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        try {
          const verification = await verifyBusiness({ data: { businessName } });
          if (verification.needsOnboarding) {
            navigate({ to: "/onboarding", replace: true });
            return;
          }
        } catch {
          await supabase.auth.signOut();
          throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
        }
      }
      navigate({ to: "/home", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível entrar.";
      toast.error(
        message.includes("Invalid login credentials")
          ? "Nome do lava-jato, e-mail ou senha incorretos."
          : message === "Failed to fetch"
            ? "Não foi possível conectar ao serviço de cadastro. Verifique a configuração do Supabase."
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter flex min-h-screen min-h-dvh items-center bg-hero px-4 py-6 sm:px-5 sm:py-10">
      <WashHoseBackdrop />
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden border border-border bg-card md:grid-cols-[1fr_1.1fr]">
        <div className="hidden border-r border-border bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
          <span className="inline-flex items-center gap-2.5">
            <WashMark className="size-8 text-primary-foreground" />
            <span className="plate text-xs">LAVAPRO / OPERAÇÃO</span>
          </span>
          <div>
            <p className="text-5xl font-bold leading-[0.95]">Controle o pátio. Feche o caixa.</p>
            <p className="mt-5 text-sm leading-6 opacity-75">
              Atendimentos, veículos e financeiro em um fluxo único.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-widest">
            Sistema operacional para lava-jato
          </p>
        </div>
        <div className="p-6 md:p-10">
          <WashBrand />
          <h1 className="mt-3 text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse o painel do seu lava-jato."
              : "Crie sua conta para cadastrar o lava-jato."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "login" && isDemoEnabled() && (
              <button
                type="button"
                className="interactive-panel w-full border border-primary/40 bg-primary/10 p-4 text-left text-sm"
                onClick={async () => {
                  const hint = await getDemoLoginHint();
                  setBusinessName(hint?.businessName ?? "");
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                <span className="font-semibold text-primary">Acesso de demonstração</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Clique para preencher as credenciais fictícias.
                </span>
              </button>
            )}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do proprietário ou responsável</Label>
                <Input
                  id="nome"
                  autoComplete="name"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  O nome do lava-jato será informado na próxima etapa.
                </p>
              </div>
            )}
            {mode === "login" && (
              <div className="space-y-2">
                <Label htmlFor="businessName">Nome do lava-jato</Label>
                <Input
                  id="businessName"
                  autoComplete="organization"
                  placeholder="Nome cadastrado da empresa"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Informe o nome usado no cadastro do lava-jato.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" size="lg" className="h-13 w-full text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <button
            type="button"
            className="mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
