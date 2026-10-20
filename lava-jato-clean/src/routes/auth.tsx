import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
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
import { TRIAL_DAYS } from "@/lib/plans";
import { authErrorMessage, MIN_PASSWORD_LENGTH, turnstileSiteKey } from "@/lib/captcha";
import { Turnstile } from "@/components/app/turnstile";
import { AnimatePresence, m } from "motion/react";

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
  // Verificação anti-robô: o token só vale uma vez, então troca a cada tentativa.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const captchaRequired = turnstileSiteKey() !== null && !isDemoEnabled();
  // Conta criada aguardando a confirmação do e-mail.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = window.setTimeout(() => setResendWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  const captchaOption = captchaToken ? { captchaToken } : {};

  async function resendConfirmation(target: string) {
    if (resendWait > 0) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/home`, ...captchaOption },
    });
    setCaptchaReset((value) => value + 1);
    if (error) {
      toast.error(authErrorMessage(error.message));
      return;
    }
    setResendWait(60);
    toast.success("Enviamos o link de novo. Veja também a caixa de spam.");
  }

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
        if (password.length < MIN_PASSWORD_LENGTH) {
          throw new Error(`Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
        }
        const { data: created, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { nome },
            ...captchaOption,
          },
        });
        if (error) throw error;
        // Com a confirmação de e-mail ligada, a conta só entra depois do link.
        if (!created.session) {
          setPendingEmail(email);
          setResendWait(60);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: captchaOption,
        });
        if (error) {
          if (/email not confirmed/i.test(error.message)) setPendingEmail(email);
          throw error;
        }
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
      toast.error(authErrorMessage(message));
    } finally {
      setLoading(false);
      if (captchaRequired) setCaptchaReset((value) => value + 1);
    }
  }

  return (
    <div className="page-enter flex min-h-screen min-h-dvh items-center bg-hero px-4 py-6 sm:px-5 sm:py-10">
      <WashHoseBackdrop />
      <m.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card md:grid-cols-[1fr_1.1fr]"
      >
        <div className="relative hidden overflow-hidden border-r border-border bg-brand p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
          <span
            aria-hidden="true"
            className="glow-breathe absolute -right-24 -bottom-24 size-72 rounded-full bg-white/15 blur-2xl"
          />
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
          {pendingEmail ? (
            <div className="mt-6 space-y-4" role="status">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <MailCheck className="size-6" />
              </span>
              <h1 className="text-2xl font-bold">Confirme seu e-mail</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Enviamos um link para <strong className="text-foreground">{pendingEmail}</strong>.
                Abra o link para ativar a conta e depois entre com seu e-mail e senha.
              </p>
              <p className="text-xs text-muted-foreground">
                Não chegou? Veja a caixa de spam ou promoções.
              </p>
              <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl"
                disabled={resendWait > 0 || (captchaRequired && !captchaToken)}
                onClick={() => void resendConfirmation(pendingEmail)}
              >
                {resendWait > 0 ? `Reenviar em ${resendWait}s` : "Reenviar o link"}
              </Button>
              <Button
                type="button"
                className="h-11 w-full rounded-2xl"
                onClick={() => {
                  setPendingEmail(null);
                  setMode("login");
                }}
              >
                Já confirmei — entrar
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={mode}
                initial={{ opacity: 0, x: mode === "signup" ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signup" ? -24 : 24 }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              >
                <h1 className="mt-3 text-2xl font-bold">
                  {mode === "login" ? "Entrar" : "Criar conta"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Acesse o painel do seu lava-jato."
                    : `Crie sua conta e ganhe ${TRIAL_DAYS} dias do plano Max.`}
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
                      minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : 6}
                      required
                    />
                    {mode === "signup" ? (
                      <p className="text-xs text-muted-foreground">
                        Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
                      </p>
                    ) : null}
                  </div>
                  <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-13 w-full rounded-2xl text-base shadow-glow transition-transform active:scale-[0.98]"
                    disabled={loading || (captchaRequired && !captchaToken)}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : mode === "login" ? (
                      "Entrar"
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </m.div>
            </AnimatePresence>
          )}

          {pendingEmail ? null : (
            <button
              type="button"
              className="mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
            </button>
          )}
        </div>
      </m.div>
    </div>
  );
}
