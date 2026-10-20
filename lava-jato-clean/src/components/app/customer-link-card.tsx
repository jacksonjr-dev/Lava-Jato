import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Endereço que leva o cliente direto à área do cliente deste lava-jato. */
function customerPortalUrl(origin: string, slug: string): string {
  return `${origin}/cliente?empresa=${encodeURIComponent(slug)}`;
}

/**
 * Link e QR Code da área do cliente do lava-jato: o dono compartilha no WhatsApp
 * ou imprime para o balcão; o cliente abre já com a empresa escolhida.
 */
export function CustomerLinkCard({ slug, name }: { slug: string; name: string }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const link = customerPortalUrl(window.location.origin, slug);
    setUrl(link);
    let cancelled = false;
    void import("qrcode").then(({ toDataURL }) =>
      toDataURL(link, { width: 640, margin: 2, errorCorrectionLevel: "M" }).then((data) => {
        if (!cancelled) setQr(data);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function printPoster() {
    const page = window.open("", "_blank", "width=700,height=900");
    if (!page) return;
    const safeName = name.replace(/[<>&"]/g, "");
    page.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>QR Code — ${safeName}</title>
<style>
  body{font-family:system-ui,sans-serif;text-align:center;margin:40px;color:#111}
  h1{font-size:34px;margin:0 0 6px} p{font-size:18px;margin:6px 0}
  img{width:340px;height:340px;margin:24px auto;display:block}
  small{color:#555;font-size:13px;word-break:break-all}
</style></head><body>
  <h1>Acompanhe seu carro</h1>
  <p><strong>${safeName}</strong></p>
  <img src="${qr}" alt="QR Code da área do cliente">
  <p>Aponte a câmera do celular para o código.</p>
  <p>Depois informe a placa e o telefone do atendimento.</p>
  <small>${url}</small>
</body></html>`);
    page.document.close();
    page.focus();
    page.onload = () => page.print();
  }

  return (
    <section className="interactive-panel border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">Link para seus clientes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Envie no WhatsApp ou imprima o QR Code para o balcão. O cliente abre já com o seu
            lava-jato escolhido.
          </p>
        </div>
        <QrCode className="size-5 shrink-0 text-primary" />
      </div>

      {qr ? (
        <img
          src={qr}
          alt={`QR Code da área do cliente de ${name}`}
          className="mx-auto mt-4 size-40 rounded-xl bg-white p-2"
        />
      ) : (
        <div className="mx-auto mt-4 size-40 animate-pulse rounded-xl bg-secondary" />
      )}

      <p className="mt-3 break-all rounded-xl bg-secondary/60 p-2.5 text-center text-[11px] text-muted-foreground">
        {url}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" asChild disabled={!qr}>
          <a href={qr || undefined} download={`qrcode-${slug}.png`}>
            <Download className="size-4" /> Baixar
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={printPoster}
          disabled={!qr}
        >
          <Printer className="size-4" /> Imprimir
        </Button>
      </div>
    </section>
  );
}
