import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTenant, getSession } from "@/lib/lavajato.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Cadastrar lava-jato — LavaPro" },
      { name: "description", content: "Cadastre seu lava-jato para começar a atender." },
      { property: "og:title", content: "Cadastrar lava-jato — LavaPro" },
      { property: "og:description", content: "Cadastre seu lava-jato para começar a atender." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useServerFn(getSession);
  const create = useServerFn(createTenant);

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: () => session() });

  useEffect(() => {
    if (sessionQuery.data?.membership) navigate({ to: "/home", replace: true });
  }, [sessionQuery.data, navigate]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const mutation = useMutation({
    mutationFn: () => create({ data: { nome, telefone, endereco, logo_url: logoUrl } }),
    onSuccess: async () => {
      toast.success("Lava-jato criado!");
      await queryClient.invalidateQueries();
      navigate({ to: "/home", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Seu lava-jato">
      <p className="text-sm text-muted-foreground">
        Só precisamos de alguns dados para liberar o atendimento.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do lava-jato</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tel">Telefone</Label>
          <Input id="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">Endereço (opcional)</Label>
          <Input id="end" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo">Link do logo (opcional)</Label>
          <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </div>
        <Button type="submit" size="lg" className="h-13 w-full text-base" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-5 animate-spin" /> : "Criar e começar"}
        </Button>
      </form>
    </AppShell>
  );
}
