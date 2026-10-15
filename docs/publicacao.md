# Publicação e configuração

Este guia leva o LavaPro de um projeto Supabase vazio até a produção na Vercel.

## 1. Supabase

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Aplique as migrations deste repositório:

   ```sh
   npx supabase login
   npx supabase link --project-ref <referencia-do-projeto>
   npx supabase db push --dry-run   # lista o que será aplicado, sem alterar nada
   npx supabase db push
   ```

3. Em **Authentication → Rate Limits**, ajuste os limites de login e cadastro. Se possível, ative também o CAPTCHA (Cloudflare Turnstile). O login fala direto com o Supabase, então a proteção contra força bruta fica configurada lá.

> **Ordem importa.** Toda versão nova do código que acompanha uma migration só pode ir para produção **depois** que a migration for aplicada. Caso contrário, o app tenta usar colunas ou funções que ainda não existem.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env` no desenvolvimento. Na Vercel, cadastre as mesmas variáveis em **Settings → Environment Variables**.

| Variável                        | Onde é usada | Observação                                                                                                                     |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | navegador    | URL do projeto                                                                                                                 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navegador    | Chave publicável (`sb_publishable_…`)                                                                                          |
| `SUPABASE_URL`                  | servidor     | Mesma URL                                                                                                                      |
| `SUPABASE_PUBLISHABLE_KEY`      | servidor     | Mesma chave publicável                                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | servidor     | **Obrigatória.** Usada pelo portal do cliente, pelos planos e pelo painel admin. Nunca coloque em uma variável `VITE_`.        |
| `CLIENT_PORTAL_SECRET`          | servidor     | Pelo menos 32 caracteres aleatórios. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `OPENAI_API_KEY`                | servidor     | Opcional. Liga a leitura da placa pela foto (plano Max).                                                                       |
| `OPENAI_VISION_MODEL`           | servidor     | Opcional. O padrão é `gpt-4.1-mini`.                                                                                           |
| `DEMO_MODE` / `VITE_DEMO_MODE`  | ambos        | **Nunca** `true` em produção. O modo demonstração desliga a autenticação.                                                      |

## 3. Vercel

- Framework: **TanStack Start** (já definido em `vercel.json`).
- Root Directory: a raiz do repositório (campo vazio).
- A branch `main` publica em produção, e cada PR gera uma prévia.

Em produção, o servidor envia os cabeçalhos CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy (veja `src/server.ts`).

## 4. Administrador da plataforma

O painel `/admin` libera planos manualmente. Para cadastrar um administrador, rode uma vez no **SQL Editor** do Supabase:

```sql
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = '<e-mail do administrador>';
```

## 5. Checklist de cada publicação

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build` passam
- [ ] Migrations novas aplicadas com `npx supabase db push` **antes** do merge
- [ ] Variáveis novas cadastradas na Vercel
- [ ] Merge na `main` e conferência da prévia ou da produção
