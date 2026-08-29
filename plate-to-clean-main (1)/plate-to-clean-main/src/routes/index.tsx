import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Gauge, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LavaPro — Gestão de lava-jato pela placa do carro" },
      {
        name: "description",
        content:
          "Atenda em segundos: fotografe a placa, encontre o veículo, monte a ordem de serviço e receba o pagamento.",
      },
      { property: "og:title", content: "LavaPro — Gestão de lava-jato pela placa do carro" },
      {
        property: "og:description",
        content: "Do reconhecimento da placa ao pagamento, tudo em poucos toques.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-between px-5 py-10">
        <div>
          <p className="plate text-xs text-primary">LAVAPRO</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">
            O atendimento começa <span className="text-brand">na placa</span>.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Fotografe a placa, o sistema reconhece o veículo, carrega o histórico do cliente e cria
            a ordem de serviço em segundos.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Camera className="mt-0.5 size-5 text-primary" />
              Reconhecimento de placa por foto, com confirmação humana.
            </li>
            <li className="flex items-start gap-3">
              <Gauge className="mt-0.5 size-5 text-primary" />
              Status do veículo, pagamento e entrega em um só lugar.
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              Dados isolados por lava-jato, com permissões por função.
            </li>
          </ul>
        </div>

        <div className="mt-10">
          <Button asChild size="lg" className="h-14 w-full text-base font-semibold">
            <Link to="/auth">Entrar / Criar conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
