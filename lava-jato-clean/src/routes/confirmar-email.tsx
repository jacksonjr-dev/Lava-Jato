import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WashMark } from "@/components/app/wash-brand";
import { confirmEmail } from "@/lib/auth.functions";
import { forgetOwner } from "@/lib/auth-client";
import { readEmailLinkTokens } from "@/lib/email-link";

export const Route = createFileRoute("/confirmar-email")({
  ssr: false,
  head: () => ({ meta: [{ title: "Confirmando e-mail — LavaPro" }] }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const confirm = useServerFn(confirmEmail);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tokens = readEmailLinkTokens();
    if ("error" in tokens) {
      setFailed(true);
      return;
    }
    confirm({ data: tokens })
      .then(() => {
        forgetOwner();
        navigate({ to: "/home", replace: true });
      })
      .catch(() => setFailed(true));
  }, [confirm, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-card md:p-8">
        <WashMark className="mx-auto size-10 text-primary" />
        {failed ? (
          <>
            <MailX className="mx-auto mt-5 size-8 text-warning" />
            <h1 className="mt-3 text-2xl font-bold">Link expirado ou já usado</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Se você já confirmou o e-mail, é só entrar com seu e-mail e senha. Se não, entre para
              receber um link novo.
            </p>
            <Button asChild className="mt-6 h-11 w-full rounded-2xl">
              <Link to="/auth">Ir para o login</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-5 size-8 animate-spin text-primary" />
            <h1 className="mt-3 text-2xl font-bold">Confirmando seu e-mail…</h1>
          </>
        )}
      </div>
    </div>
  );
}
