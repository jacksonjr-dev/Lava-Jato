# LavaPro

Sistema de gestão para lava-jatos. O atendimento começa pela placa e segue com ordens de serviço por etapa, cobrança PIX, painel financeiro e uma área em que o cliente acompanha o próprio carro pelo celular.

Desenvolvido por [JPGLabs](https://jpglabs.netlify.app/).

## Funcionalidades

| Área                             | O que faz                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Atendimento**                  | Placa digitada ou lida pela foto, cadastro rápido do cliente na primeira visita e escolha de serviços (uma lavagem e quantos adicionais quiser). |
| **Ordens de serviço**            | Linha do tempo Chegou → Lavando → Pronto → Pago → Entregue. Cancelamento só para proprietário ou gerente.                                        |
| **Financeiro**                   | Faturamento do dia, da semana e do mês, ticket médio, receita por forma de pagamento e exportação em PDF ou Excel.                               |
| **PIX**                          | QR Code e código copia e cola gerados com a chave do lava-jato e o valor exato da OS.                                                            |
| **Área do cliente** (`/cliente`) | O cliente entra com a placa e o telefone e vê o status ao vivo, o histórico e o PIX.                                                             |
| **Planos**                       | Grátis (até 30 atendimentos por mês), Básico e Max, com 7 dias de teste do Max. Painel `/admin` para liberar planos.                             |
| **Página de apresentação** (`/`) | Landing page com funcionalidades, planos e perguntas frequentes.                                                                                 |

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 com SSR) e Vite, publicado na Vercel
- [Supabase](https://supabase.com) para Postgres, autenticação, RLS e storage
- Tailwind CSS 4, componentes Radix/shadcn e animações com [Motion](https://motion.dev)
- Vitest para os testes

## Como rodar

Requer **Node.js 24+**.

```sh
npm install
npm run dev:demo     # modo demonstração, sem Supabase e com dados fictícios
```

Abra http://localhost:3000 e entre com `demo@lavapro.local` / `LavaPro@2026`.

Para usar um Supabase de verdade, copie `.env.example` para `.env`, preencha as variáveis e rode `npm run dev`. O passo a passo completo está em [docs/publicacao.md](docs/publicacao.md).

| Comando            | Para quê                                                |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento usando o Supabase do `.env` |
| `npm run dev:demo` | Servidor de desenvolvimento no modo demonstração        |
| `npm test`         | Testes (Vitest)                                         |
| `npm run lint`     | ESLint                                                  |
| `npx tsc --noEmit` | Checagem de tipos                                       |
| `npm run build`    | Build de produção                                       |

## Estrutura

```
├── docs/                    Documentação (publicação e arquitetura)
├── public/                  Arquivos estáticos
├── src/
│   ├── components/
│   │   ├── app/             Componentes do LavaPro (layout, planos, placa, animações…)
│   │   └── ui/              Componentes base (shadcn/Radix)
│   ├── hooks/               Hooks React (sessão, plano, mobile)
│   ├── integrations/
│   │   └── supabase/        Clientes do Supabase, middleware de autenticação e tipos
│   ├── lib/                 Regras de negócio e server functions (*.functions.ts, *.server.ts)
│   ├── routes/              Páginas (roteamento por arquivo do TanStack Router)
│   │   └── _authenticated/  Telas que exigem login
│   ├── server.ts            Entrada do servidor (cabeçalhos de segurança e página de erro)
│   └── start.ts             Middlewares globais (CSRF e autenticação)
└── supabase/
    └── migrations/          Esquema do banco, políticas RLS e funções
```

Os detalhes de cada camada estão em [docs/arquitetura.md](docs/arquitetura.md).

## Documentação

- [Publicação e configuração](docs/publicacao.md): Supabase, variáveis de ambiente, Vercel e administrador
- [Arquitetura](docs/arquitetura.md): camadas, segurança, planos e modo demonstração
