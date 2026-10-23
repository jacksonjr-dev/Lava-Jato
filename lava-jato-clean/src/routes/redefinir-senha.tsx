import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WashMark } from "@/components/app/wash-brand";
import { resetPassword } from "@/lib/auth.functions";
import { forgetOwner } from "@/lib/auth-client";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "@/lib/captcha";
import { readEmailLinkTokens } from "@/lib/email-link";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({ meta: [{ title: "Criar senha nova — LavaPro" }] }),
  component: ResetPasswordPage,
});

type LinkToken = { tokenHash: string } | { refreshToken: string };

function ResetPasswordPage() {
  const reset = useServerFn(resetPassword);
  // O token fica só na memória da página; é usado uma vez, ao salvar a senha.
  const [token, setToken] = useState<LinkToken | null>(null);
  const [status, setStatus] = useState<"lendo" | "formulario" | "expirado" | "pronto">("lendo");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tokens = readEmailLinkTokens();
    if ("error" in tokens) {
      setStatus("expirado");
      return;
    }
    setToken(tokens);
    setStatus("formulario");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      await reset({ data: { ...token, password } });
      forgetOwner();
      setStatus("pronto");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/expirado/i.test(message)) setStatus("expirado");
      else toast.error(authErrorMessage(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <WashMark className="mx-auto size-10 text-primary" />
        {status === "lendo" ? (
          <Loader2 className="mx-auto mt-6 size-8 animate-spin text-primary" />
        ) : null}

        {status === "expirado" ? (
          <div className="mt-5 text-center">
            <MailX className="mx-auto size-8 text-warning" />
            <h1 className="mt-3 text-2xl font-bold">Link expirado ou já usado</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Peça um link novo na tela de login, em "Esqueci minha senha". Cada link vale por 1
              hora e só pode ser usado uma vez.
            </p>
            <Button asChild className="mt-6 h-11 w-full rounded-2xl">
              <Link to="/auth">Ir para o login</Link>
            </Button>
          </div>
        ) : null}

        {status === "pronto" ? (
          <div className="mt-5 text-center" role="status">
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <h1 className="mt-3 text-2xl font-bold">Senha alterada</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Por segurança, saímos da sua conta em todos os aparelhos. Entre com a senha nova.
            </p>
            <Button asChild className="mt-6 h-11 w-full rounded-2xl">
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        ) : null}

        {status === "formulario" ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="text-center">
              <KeyRound className="mx-auto size-8 text-primary" />
              <h1 className="mt-3 text-2xl font-bold">Criar senha nova</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha nova</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Repita a senha nova</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-2xl" disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : "Salvar senha nova"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
