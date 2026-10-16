# LavaPro Admin

Painel interno da equipe LavaPro para administrar as empresas (lava-jatos) e os planos. É um app separado do LavaPro, mas usa o **mesmo projeto Supabase**.

## O que faz

- **Empresas**: busca por nome, código, e-mail do dono ou telefone; filtros por situação (teste, ativa, vencida, grátis, vencendo em 7 dias) e por plano; uso do mês.
- **Ações de plano**: ativar ou renovar Básico ou Max por 1, 3, 6 ou 12 meses, estender o teste em 7 ou 14 dias e voltar ao Grátis. Toda ação exige um **motivo** e fica no histórico (`subscription_events`) com quem fez e quando.
- As regras de plano (prazos, recursos, tolerância) vêm do app principal (`src/lib/plans.ts`), pelo apelido `@core`, então os dois apps nunca divergem.

## Segurança

- Login com e-mail e senha da conta Supabase **mais código de um app autenticador** (verificação em duas etapas, TOTP). Na primeira entrada o painel mostra o QR Code para configurar.
- O servidor só atende sessões com verificação em duas etapas concluída (`aal2`) **e** cujo usuário esteja em `platform_admins`.
- Todas as leituras e escritas acontecem no servidor, com a service role. A chave nunca vai para o navegador.
- Cabeçalhos de segurança em produção, sem indexação por buscadores e com a sessão separada da do app dos lava-jatos.

## Rodar localmente

Requer Node.js 24+.

```sh
cd admin
npm install
npm run dev:demo   # dados fictícios, sem Supabase — http://localhost:3100
```

Acesso de demonstração: `admin@lavapro.local` / `Admin@2026`, código `123456`.

Com o Supabase de verdade, copie `.env.example` para `.env`, preencha as chaves e rode `npm run dev`.

## Colocar no ar

1. Aplique as migrations do app principal (inclui `subscription_events`):
   `npx supabase db push`
2. Cadastre-se como administrador (SQL Editor do Supabase):
   ```sql
   INSERT INTO public.platform_admins (user_id)
   SELECT id FROM auth.users WHERE email = '<seu e-mail>';
   ```
3. Confira se o **MFA (TOTP)** está habilitado em *Authentication → Multi-Factor* no Supabase.
4. Na Vercel, crie um **segundo projeto** a partir deste repositório:
   - Root Directory: `admin`
   - Variáveis: as do `.env.example` (sem `ADMIN_DEMO_MODE`)
   - Domínio próprio, por exemplo `admin.seudominio.com.br`

## Comandos

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Painel com o Supabase do `.env` (porta 3100) |
| `npm run dev:demo` | Painel com dados fictícios |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Checagem de tipos |
| `npm run build` | Build de produção |
