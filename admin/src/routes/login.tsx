import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WashMark } from "@/components/app/wash-brand";
import { supabase } from "@/integrations/supabase/client";
import { whoAmI } from "@/lib/admin.functions";
import { DEMO_ADMIN, DEMO_SESSION_KEY, isAdminDemo } from "@/lib/demo-flag";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — LavaPro Admin" }] }),
  component: LoginPage,
});

type Step = "senha" | "codigo" | "configurar";

function LoginPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(whoAmI);
  const demo = isAdminDemo();
  const [step, setStep] = useState<Step>("senha");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    try {
      await checkAdmin();
    } catch (err) {
      if (!demo) await supabase.auth.signOut();
      throw err;
    }
    await navigate({ to: "/empresas", replace: true });
  }

  /** Depois da senha: pede o código, ou configura o autenticador na primeira vez. */
  async function afterPassword() {
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel === "aal2") return finish();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp.find((factor) => factor.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStep("codigo");
      return;
    }
    // Primeira vez: remove tentativas antigas não concluídas e cadastra o autenticador.
    for (const factor of factors?.all ?? []) {
      if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "LavaPro Admin",
    });
    if (enrollError || !data) throw new Error("Não foi possível configurar o autenticador.");
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("configurar");
  }

  function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (demo) {
        if (email !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
          throw new Error("E-mail ou senha incorretos.");
        }
        setStep("codigo");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("E-mail ou senha incorretos.");
      await afterPassword();
    });
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (!/^\d{6}$/.test(code)) throw new Error("Digite os 6 números do autenticador.");
      if (demo) {
        if (code !== DEMO_ADMIN.code) throw new Error("Código incorreto.");
        localStorage.setItem(DEMO_SESSION_KEY, "1");
        return finish();
      }
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw new Error("Código incorreto ou expirado.");
      await finish();
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <div className="flex items-center gap-2.5">
          <WashMark className="size-8 text-primary" />
          <span className="plate text-sm text-primary">LAVAPRO / ADMIN</span>
        </div>

        {step === "senha" && (
          <form onSubmit={submitPassword} className="mt-8 space-y-4">
            <div>
              <h1 className="text-xl font-bold">Entrar</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Acesso restrito à equipe LavaPro.
              </p>
            </div>
            {demo && (
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_ADMIN.email);
                  setPassword(DEMO_ADMIN.password);
                }}
                className="w-full rounded-2xl border border-primary/40 bg-primary/10 p-3 text-left text-xs"
              >
                <span className="font-semibold text-primary">Modo demonstração</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Clique para preencher; o código é {DEMO_ADMIN.code}.
                </span>
              </button>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Feedback error={error} />
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : "Continuar"}
            </Button>
          </form>
        )}

        {step !== "senha" && (
          <form onSubmit={submitCode} className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              {step === "configurar" ? (
                <KeyRound className="mt-0.5 size-5 shrink-0 text-primary" />
              ) : (
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-bold">
                  {step === "configurar" ? "Configure o autenticador" : "Código de verificação"}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {step === "configurar"
                    ? "Escaneie o QR Code com o Google Authenticator, Authy ou similar e digite o código gerado."
                    : "Digite o código de 6 números do seu aplicativo autenticador."}
                </p>
              </div>
            </div>
            {step === "configurar" && qrCode && (
              <div className="space-y-2 text-center">
                <img
                  src={qrCode}
                  alt="QR Code para o aplicativo autenticador"
                  className="mx-auto size-44 rounded-xl bg-white p-2"
                />
                <p className="break-all text-[10px] text-muted-foreground">
                  Sem câmera? Use a chave: <span className="font-semibold">{secret}</span>
                </p>
              </div>
            )}
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="h-14 text-center text-2xl tracking-[0.5em]"
              aria-label="Código de 6 números"
              autoFocus
            />
            <Feedback error={error} />
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : "Confirmar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Feedback({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
      {error}
    </p>
  );
}
