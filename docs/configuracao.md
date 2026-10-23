# Configuração do LavaPro (produção)

Passo a passo para colocar no ar o **site** (app dos lava-jatos + área do cliente) e o **painel admin**.
Siga na ordem: alguns passos dependem de outros.

> **Nunca** cole chaves secretas em chat, e-mail, código ou commit. Elas vão só nas variáveis de ambiente da hospedagem e no painel do Supabase.

## Resumo (checklist)

| # | Onde | O quê |
|---|------|-------|
| 1 | Supabase | Aplicar as migrations |
| 2 | Supabase | Autenticação: URLs, confirmação de e-mail, senha mínima, MFA |
| 3 | Provedor de e-mail | SMTP próprio (para o e-mail de confirmação chegar a todos) |
| 4 | Cloudflare | Criar o Turnstile (anti-robô) |
| 5 | Terminal | Gerar `CLIENT_PORTAL_SECRET` e as chaves de notificação (VAPID) |
| 6 | OpenAI (opcional) | Chave para o reforço da leitura de placa |
| 7 | Hospedagem | Publicar o **site** com as variáveis |
| 8 | Supabase | Ligar o Turnstile (**só depois** do passo 7) |
| 9 | Hospedagem | Publicar o **painel admin** (segundo projeto) |
| 10 | Supabase | Cadastrar o administrador e o Google Authenticator |
| 11 | — | Testar tudo (lista no fim) |

---

## 1. Supabase: banco de dados

### 1.1 Aplicar as migrations

Na pasta `lava-jato-clean/`, com a [CLI do Supabase](https://supabase.com/docs/guides/cli) ligada ao projeto:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O `db push` aplica só as que faltam. As novas desde a última publicação são:

| Migration | Para quê |
|-----------|----------|
| `20261016120000_tenant_logos.sql` | Pasta (bucket) dos logos dos lava-jatos |
| `20261016150000_subscription_events.sql` | Histórico de mudanças de plano (painel) |
| `20261016170000_admin_billing_and_notes.sql` | Pagamentos de assinatura e notas internas (painel) |
| `20261019120000_trial_3_dias.sql` | Teste grátis de 3 dias para empresas novas |
| `20261020120000_portal_push_subscriptions.sql` | Avisos no celular do cliente |
| `20261020150000_tenant_suspension.sql` | Suspensão de empresas (trava no banco) |
| `20261021120000_platform_admins_team.sql` | Equipe do painel (nome, papel e registro de quem liberou/removeu acesso) |
| `20261021150000_platform_admins_owner.sql` | Papel "Dono do painel" (só ele gerencia a equipe) |

Confira em **Table Editor** se apareceram as tabelas `subscription_events`, `subscription_payments`, `tenant_notes` e `portal_push_subscriptions`.

### 1.2 Chaves do projeto

Em **Project Settings → API** (ou **API Keys**) você encontra:

- **Project URL** → vai em `SUPABASE_URL` (site e painel) e `VITE_SUPABASE_URL` (só no painel).
- **Publishable key** (`sb_publishable_…`) → vai em `SUPABASE_PUBLISHABLE_KEY` (site e painel) e `VITE_SUPABASE_PUBLISHABLE_KEY` (só no painel).

> O site não fala com o Supabase pelo navegador: entrar, criar conta e sair passam pelo servidor, e a sessão fica num cookie que o JavaScript não lê. Por isso o site não usa as variáveis `VITE_SUPABASE_…`.
- **Secret / service_role key** → vai **só** em `SUPABASE_SERVICE_ROLE_KEY`. **Nunca** em variável que começa com `VITE_` (essas vão para o navegador).

---

## 2. Supabase: autenticação

Em **Authentication**:

### 2.1 URLs (URL Configuration)

- **Site URL**: o endereço do site, ex.: `https://seudominio.com.br`.
- **Redirect URLs**: adicione
  - `https://seudominio.com.br/**`
  - `https://painel.seudominio.com.br/**` (painel admin)
  - `http://localhost:3000/**` (só se for testar localmente com o Supabase de verdade)

O link do e-mail de confirmação leva para `/confirmar-email`; sem essas URLs, o Supabase recusa o redirecionamento.

### 2.2 Cadastro e senha

- **Sign In / Providers → Email**: ligar **Confirm email**.
- **Password**: tamanho mínimo **8** (o site já pede 8 para contas novas).
- **Rate Limits**: confira os limites de cadastro, login e renovação de sessão. Como o login passa pelo servidor do site, o Supabase pode ver muitos acessos vindo dos mesmos endereços da Vercel: se aparecer "Muitas tentativas" para usuários diferentes ao mesmo tempo, aumente esses limites. O site envia o IP real de cada pessoa no cabeçalho `Sb-Forwarded-For`.

### 2.3 Verificação em duas etapas (painel admin)

- **Multi-Factor**: deixe **TOTP (App Authenticator)** ligado. É ele que funciona com o Google Authenticator.

### 2.4 Modelos de e-mail (opcional, recomendado)

Em **Emails → Templates**, traduza para português pelo menos **Confirm signup**, **Invite user** (convite do painel admin) e **Reset password**. Exemplo para a confirmação:

> **Assunto:** Confirme seu cadastro no LavaPro
> **Corpo:** Olá! Clique no link para ativar sua conta no LavaPro: `{{ .SiteURL }}/confirmar-email?token_hash={{ .TokenHash }}&type=email`

No **Confirm signup**, use esse link com `token_hash` em vez de `{{ .ConfirmationURL }}`: assim a confirmação é feita pelo servidor e nenhum token aparece no endereço. O link padrão também funciona, mas é menos limpo.

No **Reset password** ("Esqueci minha senha"), o mesmo princípio:

> **Assunto:** Crie uma senha nova no LavaPro
> **Corpo:** Recebemos um pedido para trocar a senha da sua conta. Clique no link para criar uma senha nova: `{{ .SiteURL }}/redefinir-senha?token_hash={{ .TokenHash }}&type=recovery`. Se não foi você, ignore este e-mail: sua senha continua a mesma.

O link vale por 1 hora e só pode ser usado uma vez. Depois da troca, o sistema encerra a sessão em todos os aparelhos.

> Personalizar os modelos exige o **SMTP próprio** (passo 3); no plano gratuito, o Supabase recusa a alteração enquanto o e-mail padrão estiver em uso.

---

## 3. Provedor de e-mail (SMTP próprio)

O e-mail que vem de fábrica no Supabase **só entrega para os membros da equipe do projeto** e tem limite de poucos e-mails por hora. Para os lava-jatos receberem a confirmação de cadastro, configure um provedor próprio:

1. Crie conta num provedor (ex.: **Resend**, **Brevo**, **Amazon SES**) e verifique o domínio (registros DNS que o provedor informa).
2. No Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP** e preencha host, porta, usuário, senha e remetente (ex.: `nao-responda@seudominio.com.br`).
3. Mande um cadastro de teste para um e-mail de fora da equipe e confira se chega (e se não cai no spam).

---

## 4. Cloudflare Turnstile (anti-robô)

1. Em [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile → Add widget** (gratuito).
2. **Domínios**: o do site e o do painel (ex.: `seudominio.com.br` e `painel.seudominio.com.br`).
3. Modo: **Managed**.
4. Anote:
   - **Site Key** (pública) → variável `VITE_TURNSTILE_SITE_KEY` no site **e** no painel.
   - **Secret Key** → vai **no Supabase** (passo 8), não na hospedagem.

> Ainda **não** ligue no Supabase. Veja o passo 8.

---

## 5. Segredos gerados por você

Rode no terminal (Node instalado):

```bash
# Segredo da sessão da área do cliente (CLIENT_PORTAL_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Chaves dos avisos no celular (VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY)
npx web-push generate-vapid-keys
```

- `VAPID_SUBJECT`: o endereço do site (ex.: `https://seudominio.com.br`).
- Gere uma vez e guarde num gerenciador de senhas. Trocar as chaves VAPID depois desativa os avisos de quem já tinha ativado.

---

## 6. OpenAI (opcional: reforço da leitura de placa)

A leitura da placa acontece no próprio celular. A OpenAI só entra quando o celular não acha a placa.

1. Em [platform.openai.com](https://platform.openai.com): crie uma chave em **API keys**.
2. Defina um **limite de gastos mensal** em **Billing → Limits**.
3. Variáveis: `OPENAI_API_KEY` e `OPENAI_VISION_MODEL` (um modelo com visão, ex.: `gpt-4.1-mini`).

Sem essas variáveis, o sistema funciona; só não tem o reforço.

---

## 7. Publicar o site

O site fica na pasta **`lava-jato-clean/`** e é publicado na **Vercel** (hoje em `lava-pro.vercel.app`).

### Na Vercel

1. **Project → Settings → General → Root Directory**: `lava-jato-clean`.
2. **Settings → Git**: repositório `jacksonjr-dev/Lava-Jato`, branch de produção `main`.
3. **Settings → Environment Variables** (ambiente *Production*):

| Variável | Valor |
|----------|-------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / service_role key |
| `CLIENT_PORTAL_SECRET` | Gerado no passo 5 |
| `VITE_TURNSTILE_SITE_KEY` | Site Key do Turnstile |
| `VAPID_PUBLIC_KEY` | Gerado no passo 5 |
| `VAPID_PRIVATE_KEY` | Gerado no passo 5 |
| `VAPID_SUBJECT` | `https://seudominio.com.br` |
| `OPENAI_API_KEY` | (opcional) |
| `OPENAI_VISION_MODEL` | (opcional) |

**Não** cadastre `DEMO_MODE` nem `VITE_DEMO_MODE` em produção: elas ligam a demonstração com dados fictícios.

4. **Deployments → Redeploy** (variáveis `VITE_` só valem depois de um novo build).
5. **Settings → Domains**: adicione `seudominio.com.br` e siga as instruções de DNS.

---

## 8. Ligar o Turnstile no Supabase

**Só depois** que o site do passo 7 estiver no ar com a `VITE_TURNSTILE_SITE_KEY`. Se ligar antes, o login de quem estiver na versão antiga (sem o widget) passa a falhar.

1. **Authentication → Attack Protection** (ou **Bot and Abuse Protection**) → **Enable Captcha protection**.
2. Provider: **Turnstile**. Cole a **Secret Key** do passo 4.
3. Teste: abra o site, crie uma conta e entre. Os dois devem funcionar com o widget aparecendo.

> A partir daqui, **todo login** no projeto (site e painel) precisa do widget. Por isso o painel também usa a mesma Site Key.

---

## 9. Publicar o painel admin

O painel fica na pasta **`admin/`** e usa código de `lava-jato-clean/src` (planos, tipos, logo). Ele deve ser um **segundo projeto** na hospedagem, com **domínio próprio** (ex.: `painel.seudominio.com.br`).

### Na Vercel

1. **Add New → Project**, importe o mesmo repositório.
2. **Root Directory**: `admin`.
3. Deixe ligada a opção **Include files outside the root directory in the Build Step**, porque o painel lê `../lava-jato-clean/src`.
4. **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / service_role key |
| `VITE_TURNSTILE_SITE_KEY` | Site Key do Turnstile |

**Não** cadastre `ADMIN_DEMO_MODE` nem `VITE_ADMIN_DEMO_MODE`.

5. **Domains**: `painel.seudominio.com.br`.
6. **Opcional, camada extra**: colocar o painel atrás do **Cloudflare Access** (grátis até 50 pessoas), que pede um código no seu e-mail antes mesmo da tela de login.

---

## 10. Administradores do painel e Google Authenticator

### 10.1 O dono do painel (só uma vez, pelo Supabase)

O **Dono** é o único que vê a aba **Equipe** e convida ou remove administradores. Ninguém consegue se tornar Dono pelo painel: só por este SQL.

1. **Supabase → Authentication → Users → Add user**: seu e-mail e uma senha forte (marque como já confirmado).
2. **SQL Editor**:

   ```sql
   insert into platform_admins (user_id, nome, role)
   select id, 'SEU NOME', 'DONO' from auth.users where email = 'SEU-EMAIL-AQUI';
   ```

3. Abra o painel, entre com e-mail e senha. Aparece um **QR Code**:
   - no **Google Authenticator**: **+ → Ler código QR**;
   - digite o código de 6 números para concluir.
4. **Recomendado**: no mesmo momento, leia o QR Code também num **segundo aparelho** (reserva). O Supabase não tem códigos de recuperação.

### 10.2 Os outros administradores (pelo próprio painel)

1. O Dono, no painel: **Equipe → Convidar administrador**, com nome e e-mail. Quem é convidado entra como **Administrador**: usa todo o painel, menos a aba Equipe.
2. A pessoa recebe o e-mail de convite (modelo **Invite user** do passo 2.4), abre o link e cria a senha (mínimo de 10 caracteres, com letras e números) na página `/convite` do painel.
3. Ela entra no painel e lê o QR Code no Google Authenticator.
4. Na tela **Equipe** dá para ver quem está com convite pendente ou sem autenticador, e **remover acesso**. Ninguém remove o próprio acesso e o painel nunca fica sem administrador. Cada liberação e remoção fica registrada.

> O link do convite volta para `https://painel.seudominio.com.br/convite`: por isso o endereço do painel precisa estar nas **Redirect URLs** (passo 2.1).
> Se a pessoa já tem conta no LavaPro (ex.: também é dona de lava-jato), ela não recebe convite: só ganha o acesso e entra com a senha que já usa.

**Perdeu o celular?** Outro administrador remove o acesso da pessoa e convida de novo (o autenticador antigo é apagado ao remover). Ou alguém com acesso ao Supabase abre **Authentication → Users → (o usuário) → Factors** e apaga o autenticador. No próximo login aparece um QR Code novo.

---

## 11. Testes depois de publicar

**Site**
- [ ] Criar conta com um e-mail de fora da equipe → chega o e-mail de confirmação → o link ativa a conta.
- [ ] Login com o widget anti-robô aparecendo.
- [ ] Cadastrar o lava-jato (onboarding) e ver o teste de **3 dias** do Max.
- [ ] Enviar o logo (perfil).
- [ ] Novo atendimento pela **foto da placa**.
- [ ] Perfil → **Link para seus clientes** → abrir o link no celular.
- [ ] Área do cliente: entrar com placa e telefone → **Me avise quando ficar pronto** → no app do dono, **Marcar como pronto** → a notificação chega no celular.
- [ ] Planos: os botões abrem o WhatsApp.
- [ ] DevTools → Sources: arquivos em `assets/` com nomes aleatórios.

**Painel**
- [ ] Login com senha + Google Authenticator.
- [ ] Equipe: convidar um administrador → o e-mail chega → criar a senha em /convite → primeiro login com o QR Code.
- [ ] Empresas: ativar plano, registrar pagamento, nota interna.
- [ ] Suspender uma empresa de teste → o dono vê "Empresa suspensa" → reativar.
- [ ] Ficar 30 minutos parado → o painel sai sozinho.

---

## Referência rápida: variáveis por app

| Variável | Site | Painel | Pública? |
|----------|:----:|:------:|:--------:|
| `VITE_SUPABASE_URL` | | ✔ | sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | | ✔ | sim |
| `SUPABASE_URL` | ✔ | ✔ | — |
| `SUPABASE_PUBLISHABLE_KEY` | ✔ | ✔ | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✔ | ✔ | **secreta** |
| `CLIENT_PORTAL_SECRET` | ✔ | | **secreta** |
| `VITE_TURNSTILE_SITE_KEY` | ✔ | ✔ | sim |
| `VAPID_PUBLIC_KEY` | ✔ | | sim |
| `VAPID_PRIVATE_KEY` | ✔ | | **secreta** |
| `VAPID_SUBJECT` | ✔ | | — |
| `OPENAI_API_KEY` | ✔ (opcional) | | **secreta** |
| `OPENAI_VISION_MODEL` | ✔ (opcional) | | — |

Fora da hospedagem: a **Secret Key do Turnstile** fica só no Supabase (passo 8), e a senha do **SMTP** só no Supabase (passo 3).
