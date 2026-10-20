import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WashMark } from "@/components/app/wash-brand";
import { TenantLogo } from "@/components/app/tenant-logo";
import { setTenantLogo } from "@/lib/lavajato.functions";

const MAX_SIDE = 512;

/** Reduz a imagem (máx. 512px) e converte para WebP, mantendo a transparência. */
async function toLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = canvas.toDataURL("image/webp", 0.9);
  // Navegadores sem WebP devolvem PNG; ambos são aceitos pelo servidor.
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}

export function LogoUploader({
  logoUrl,
  name,
  onChange,
}: {
  logoUrl: string;
  name: string;
  onChange: (logoUrl: string | null) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const saveLogo = useServerFn(setTenantLogo);
  const mutation = useMutation({
    mutationFn: async (file: File | null) =>
      saveLogo({ data: { image: file ? await toLogoDataUrl(file) : null } }),
    onSuccess: async (result, file) => {
      await onChange(result.logo_url);
      toast.success(file ? "Logo atualizado." : "Logo removido.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <p className="text-sm font-medium">Logo do lava-jato</p>
      <div className="mt-2 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background/40 p-4">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary">
          <TenantLogo
            url={logoUrl || null}
            name={name || "lava-jato"}
            className="size-full rounded-none p-1.5"
            fallback={<WashMark className="size-9 text-primary" />}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-5 text-muted-foreground">
            Aparece no topo do sistema e na área do cliente. PNG, JPG ou WebP; de preferência
            quadrado e com fundo transparente.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) mutation.mutate(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {mutation.isPending && mutation.variables !== null ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              {logoUrl ? "Trocar logo" : "Enviar logo"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                {mutation.isPending && mutation.variables === null ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
