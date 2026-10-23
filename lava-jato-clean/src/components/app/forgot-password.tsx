import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/app/turnstile";
import { requestPasswordReset } from "@/lib/auth.functions";
import { authErrorMessage, turnstileSiteKey } from "@/lib/captcha";
import { isDemoEnabled } from "@/lib/demo-auth";

/** "Esqueci minha senha": pede o e-mail e manda o link de recuperação. */
export function ForgotPassword({
  initialEmail,
  onBack,
}: {
  initialEmail: string;
  onBack: () => void;
}) {
  const request = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const captchaRequired = turnstileSiteKey() !== null && !isDemoEnabled();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isDemoEnabled()) {
      toast.error("A recuperação de senha não funciona no modo demonstração.");
      return;
    }
    setLoading(true);
    try {
      await request({ data: { email, captchaToken } });
      setSentTo(email.trim());
    } catch (err) {
      toast.error(authErrorMessage(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      setCaptchaReset((value) => value + 1);
    }
  }

  if (sentTo) {
    return (
      <div className="mt-6 space-y-4" role="status">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MailCheck className="size-6" />
        </span>
        <h1 className="text-2xl font-bold">Veja seu e-mail</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Se existir uma conta com <strong className="text-foreground">{sentTo}</strong>, enviamos
          um link para criar uma senha nova. O link vale por 1 hora.
        </p>
        <p className="text-xs text-muted-foreground">
          Não chegou? Veja a caixa de spam ou promoções.
        </p>
        <Button type="button" className="h-11 w-full rounded-2xl" onClick={onBack}>
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <KeyRound className="size-6" />
      </span>
      <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Informe o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.
      </p>
      <div className="space-y-2">
        <Label htmlFor="reset-email">E-mail</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
      <Button
        type="submit"
        className="h-11 w-full rounded-2xl"
        disabled={loading || (captchaRequired && !captchaToken)}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : "Enviar link"}
      </Button>
      <button
        type="button"
        className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={onBack}
      >
        Lembrei a senha — voltar
      </button>
    </form>
  );
}
