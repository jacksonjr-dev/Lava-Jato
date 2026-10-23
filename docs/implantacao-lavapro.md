# Implantação do LavaPro

Tudo o que precisa ser configurado **fora do código** para colocar no ar a versão nova do site (lava-jatos e área do cliente) e o painel administrativo. O código já está pronto na branch `main` do repositório `jacksonjr-dev/Lava-Jato`.

- **Atualizado:** 22/10/2026
- **Tempo estimado:** 2 a 3 horas
- **Guia técnico com mais detalhes:** `docs/configuracao.md` no repositório

> **Situação hoje:** o site `lava-pro.vercel.app` ainda roda a versão de 15/10. A causa mais provável é que o app mudou para a pasta `lava-jato-clean/` e a Vercel continua apontando para a pasta antiga. O banco também está sem as 8 migrations novas.

> **Antes de começar:** chaves secretas (service role, chaves VAPID, OpenAI, senha do SMTP, secret do Turnstile) vão **só** nos painéis da Vercel e do Supabase. Nunca em chat, e-mail, código ou commit. Guarde tudo num gerenciador de senhas.

## Ordem dos passos

1. Supabase: migrations e chaves
2. Supabase: autenticação
3. Provedor de e-mail (SMTP)
4. Cloudflare Turnstile (anti-robô)
5. Gerar os segredos
6. Vercel: publicar o site
7. Supabase: ligar o Turnstile
8. Vercel: publicar o painel admin
9. Criar o Dono do painel
10. Testar tudo

---

## 1. Supabase: migrations e chaves

*Onde: supabase.com → projeto do LavaPro*

Cria as tabelas e regras novas no banco. Sem isso, o envio de logo, o painel admin, os avisos no celular e a suspensão de empresas dão erro.

- [ ] Na pasta `lava-jato-clean/`, aplicar as migrations com a CLI:

  ```bash
  npx supabase login
  npx supabase link --project-ref SEU_PROJECT_REF
  npx supabase db push
  ```

- [ ] Conferir no **Table Editor** se apareceram `subscription_events`, `subscription_payments`, `tenant_notes`, `portal_push_subscriptions` e `platform_admin_events`.
- [ ] Em **Project Settings → API**, anotar: Project URL, Publishable key (`sb_publishable_…`) e Secret / service_role key.
- [ ] Abrir o **Security Advisor** do Supabase e conferir se não há alertas.

| Migration | Para quê |
|---|---|
| `20261016120000_tenant_logos` | Pasta dos logos dos lava-jatos |
| `20261016150000_subscription_events` | Histórico de mudanças de plano (painel) |
| `20261016170000_admin_billing_and_notes` | Pagamentos das assinaturas e notas internas (painel) |
| `20261019120000_trial_3_dias` | Teste grátis de 3 dias para empresas novas |
| `20261020120000_portal_push_subscriptions` | Aviso no celular do cliente quando o carro fica pronto |
| `20261020150000_tenant_suspension` | Suspensão de empresas (bloqueio no banco) |
| `20261021120000_platform_admins_team` | Equipe do painel e registro de acessos |
| `20261021150000_platform_admins_owner` | Papel "Dono do painel" |

## 2. Supabase: autenticação

*Onde: Authentication*

Cadastro com confirmação de e-mail, links de convite do painel e o Google Authenticator dos administradores.

- [ ] **URL Configuration → Site URL:** o endereço do site (ex.: `https://seudominio.com.br`).
- [ ] **Redirect URLs:** adicionar `https://seudominio.com.br/**` e `https://painel.seudominio.com.br/**`.
- [ ] **Providers → Email:** ligar **Confirm email**.
- [ ] **Password:** tamanho mínimo **8**.
- [ ] **Multi-Factor:** deixar **TOTP (App Authenticator)** ligado.
- [ ] **Emails → Templates:** traduzir para português **Confirm signup**, **Invite user** e **Reset password**. No **Confirm signup**, usar o link `{{ .SiteURL }}/confirmar-email?token_hash={{ .TokenHash }}&type=email` (a confirmação fica pelo servidor; o modelo está em `docs/configuracao.md`, passo 2.4). No **Reset password**, usar `{{ .SiteURL }}/redefinir-senha?token_hash={{ .TokenHash }}&type=recovery`.
- [ ] **Rate Limits:** conferir os limites de cadastro, login e renovação de sessão. O login passa pelo servidor do site, então muitos acessos chegam dos mesmos endereços da Vercel: se aparecer "Muitas tentativas" para pessoas diferentes, aumente os limites.

## 3. Provedor de e-mail (SMTP)

*Onde: Resend, Brevo ou Amazon SES*

O e-mail que vem de fábrica no Supabase só entrega para quem é da equipe do projeto e manda poucos por hora. Sem um SMTP próprio, os lava-jatos não recebem a confirmação de cadastro e os administradores não recebem o convite.

- [ ] Criar a conta no provedor e **verificar o domínio** (registros DNS que ele informar).
- [ ] No Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**, com host, porta, usuário, senha e remetente (ex.: `nao-responda@seudominio.com.br`).
- [ ] Criar uma conta de teste com um e-mail de fora da equipe e conferir que a confirmação chega e não cai no spam.

## 4. Cloudflare Turnstile (anti-robô)

*Onde: dash.cloudflare.com → Turnstile*

Verificação anti-robô no cadastro e no login. É gratuita e quase sempre passa sozinha para pessoas.

- [ ] **Add widget**, modo **Managed**, com os domínios do site e do painel.
- [ ] Anotar a **Site Key** (vai na Vercel) e a **Secret Key** (vai no Supabase, no passo 7).

> **Ainda não ligue no Supabase.** Se o Turnstile for ligado antes do site novo estar no ar, o login da versão antiga (sem o widget) para de funcionar.

## 5. Gerar os segredos

*Onde: terminal, com Node instalado*

A chave da sessão da área do cliente e as chaves dos avisos no celular ("Me avise quando ficar pronto").

```bash
# CLIENT_PORTAL_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY
npx web-push generate-vapid-keys
```

- [ ] Gerar o `CLIENT_PORTAL_SECRET`.
- [ ] Gerar o par `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`. Gere uma vez só: trocar depois desativa os avisos de quem já ativou.
- [ ] (Opcional) Criar a chave da **OpenAI** para o reforço da leitura de placa, com **limite de gasto mensal** em Billing → Limits.

## 6. Vercel: publicar o site

*Onde: projeto atual (lava-pro)*

- [ ] **Settings → General → Root Directory:** `lava-jato-clean`.
- [ ] **Settings → Git:** repositório `jacksonjr-dev/Lava-Jato`, branch de produção `main`.
- [ ] **Environment Variables** (Production): cadastrar as variáveis da coluna "Site" na [tabela de variáveis](#variáveis-de-ambiente).
- [ ] Confirmar que **não** existem `DEMO_MODE` nem `VITE_DEMO_MODE` (elas ligam dados fictícios).
- [ ] **Deployments → Redeploy** (variáveis `VITE_` só valem depois de um build novo).
- [ ] **Settings → Domains:** adicionar `seudominio.com.br` e configurar o DNS conforme a Vercel indicar.

## 7. Supabase: ligar o Turnstile

*Onde: Authentication → Attack Protection*

- [ ] **Enable Captcha protection**, provider **Turnstile**, colar a **Secret Key** do passo 4.
- [ ] Abrir o site, criar uma conta e entrar: o widget aparece e os dois funcionam.

## 8. Vercel: publicar o painel admin

*Onde: projeto novo na mesma conta*

- [ ] **Add New → Project**, importar o mesmo repositório.
- [ ] **Root Directory:** `admin`, com a opção **Include files outside the root directory in the Build Step** ligada (o painel usa arquivos de `lava-jato-clean/src`).
- [ ] Cadastrar as variáveis da coluna "Painel" na [tabela de variáveis](#variáveis-de-ambiente). **Não** cadastrar `ADMIN_DEMO_MODE` nem `VITE_ADMIN_DEMO_MODE`.
- [ ] **Domains:** `painel.seudominio.com.br`.

## 9. Criar o Dono do painel

*Onde: Supabase, uma vez só*

O Dono é o único que vê a aba **Equipe** e convida ou remove administradores. Só se define pelo SQL, nunca pelo painel.

- [ ] **Authentication → Users → Add user:** o e-mail do Dono, marcado como confirmado. **A senha quem escolhe é o próprio Dono.**
- [ ] **SQL Editor:** rodar o comando abaixo com o nome e o e-mail do Dono.

  ```sql
  insert into platform_admins (user_id, nome, role)
  select id, 'NOME DO DONO', 'DONO' from auth.users where email = 'EMAIL-DO-DONO';
  ```

- [ ] O Dono entra no painel e lê o QR Code no **Google Authenticator**. Recomendado: ler também num segundo aparelho, de reserva.
- [ ] Os outros administradores: o Dono convida pela aba **Equipe** (chega um e-mail para criarem a senha).

## 10. Testar tudo

### Site

- [ ] Criar conta com e-mail de fora da equipe → chega a confirmação → o link ativa a conta.
- [ ] Cadastrar o lava-jato e ver o teste de 3 dias do Max.
- [ ] Enviar o logo no perfil.
- [ ] Novo atendimento pela foto da placa (no celular).
- [ ] Perfil → Link para seus clientes → abrir o link e o QR Code no celular.
- [ ] Área do cliente → "Me avise quando ficar pronto" → no app do dono, "Marcar como pronto" → a notificação chega.
- [ ] Planos: os botões abrem o WhatsApp com o plano e o período certos.
- [ ] DevTools → Sources: os arquivos em `assets/` têm nomes aleatórios.

### Painel admin

- [ ] Login com senha + Google Authenticator.
- [ ] Equipe: convidar um administrador → o e-mail chega → criar a senha → primeiro login com o QR Code.
- [ ] Empresas: ativar um plano e registrar um pagamento.
- [ ] Suspender uma empresa de teste → o dono vê "Empresa suspensa" → reativar.

---

## Variáveis de ambiente

| Variável | Site | Painel | Tipo | De onde vem |
|---|:---:|:---:|---|---|
| `VITE_SUPABASE_URL` | | ✓ | pública | Passo 1 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | | ✓ | pública | Passo 1 |
| `SUPABASE_URL` | ✓ | ✓ | pública | Passo 1 |
| `SUPABASE_PUBLISHABLE_KEY` | ✓ | ✓ | pública | Passo 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | **secreta** | Passo 1 |
| `CLIENT_PORTAL_SECRET` | ✓ | | **secreta** | Passo 5 |
| `VITE_TURNSTILE_SITE_KEY` | ✓ | ✓ | pública | Passo 4 |
| `VAPID_PUBLIC_KEY` | ✓ | | pública | Passo 5 |
| `VAPID_PRIVATE_KEY` | ✓ | | **secreta** | Passo 5 |
| `VAPID_SUBJECT` | ✓ | | pública | Endereço do site |
| `OPENAI_API_KEY` | opcional | | **secreta** | Passo 5 |
| `OPENAI_VISION_MODEL` | opcional | | pública | Ex.: `gpt-4.1-mini` |

O site **não** usa `VITE_SUPABASE_URL` nem `VITE_SUPABASE_PUBLISHABLE_KEY`: o login passa pelo servidor e o navegador não fala com o Supabase. Se essas variáveis já existirem no projeto do site, podem ser apagadas.

Ficam fora da Vercel: a **Secret Key do Turnstile** (no Supabase, passo 7) e a **senha do SMTP** (no Supabase, passo 3).

---

## Segurança das contas e próximos passos

- [ ] **Verificação em duas etapas** em todas as contas com acesso: GitHub, Vercel, Supabase, Cloudflare, provedor de e-mail e registro do domínio.
- [ ] **GitHub** (só o dono do repositório consegue): proteger a `main` (tudo por PR, com revisão) e ligar Secret scanning, Dependabot e CodeQL.
- [ ] **GitHub:** fechar o PR #5 (reorganização antiga, já substituída) e apagar as branches já juntadas.
- [ ] **Supabase Pro** para ter backups automáticos antes de ter muitos clientes.
- [ ] (Opcional) **Cloudflare Access** na frente do painel admin.

Para depois, quando decidirem: WhatsApp automático (conta Meta Business com CNPJ e número exclusivo) e cobrança automática das assinaturas (Asaas ou Mercado Pago).
