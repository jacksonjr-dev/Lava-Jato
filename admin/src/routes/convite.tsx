import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WashMark } from "@core/components/app/wash-brand";
import { supabase } from "@/integrations/supabase/client";
import { isAdminDemo } from "@/lib/demo-flag";
import { ADMIN_MIN_PASSWORD, validatePassword } from "@/lib/team";

/**
 * Destino do link do e-mail de convite: o Supabase já abre a sessão pelo link;
 * aqui a pessoa cria a senha e segue para o login (onde configura o Google
 * Authenticator no primeiro acesso).
 */
export const Route = createFileRoute("/convite")({
  ssr: false,
  head: () => ({ meta: [{ title: "Criar senha — LavaPro Admin" }] }),
  component: InvitePage,
});

type State = "checking" | "ready" | "invalid" | "demo";

function InvitePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminDemo()) {
      setState("demo");
      return;
    }
    let cancelled = false;
    // O cliente do Supabase lê o token do link (#access_token=...) ao carregar.
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user.email) {
        setEmail(data.session.user.email);
        setState("ready");
      } else {
        setState("invalid");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      validatePassword(password, confirmation);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error("Não foi possível salvar a senha. Peça um novo convite.");
      await supabase.auth.signOut();
      toast.success("Senha criada. Entre e configure o Google Authenticator.");
      await navigate({ to: "/login", replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <div className="flex items-center gap-2.5">
          <WashMark className="size-8 text-primary" />
          <span className="plate text-sm text-primary">LAVAPRO / ADMIN</span>
        </div>

        {state === "checking" && (
          <div className="mt-10 flex justify-center text-primary">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {state === "invalid" && (
          <div className="mt-8 space-y-3">
            <h1 className="text-xl font-bold">Link inválido ou expirado</h1>
            <p className="text-sm text-muted-foreground">
              Peça para um administrador do LavaPro enviar um novo convite.
            </p>
          </div>
        )}

        {state === "demo" && (
          <div className="mt-8 space-y-3">
            <h1 className="text-xl font-bold">Convite</h1>
            <p className="text-sm text-muted-foreground">
              Na demonstração nenhum e-mail é enviado. Em produção, a pessoa convidada chega aqui
              pelo link do e-mail para criar a senha.
            </p>
          </div>
        )}

        {state === "ready" && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <h1 className="text-xl font-bold">Criar sua senha</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Acesso ao painel para <strong className="text-foreground">{email}</strong>.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={ADMIN_MIN_PASSWORD}
                required
              />
              <p className="text-xs text-muted-foreground">
                Pelo menos {ADMIN_MIN_PASSWORD} caracteres, com letras e números.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Repita a senha</Label>
              <Input
                id="confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={busy}>
              {busy ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="size-4" /> Salvar senha
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
