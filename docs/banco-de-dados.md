# Banco de dados do LavaPro: conferir e atualizar

O site novo já está no ar em **https://lava-pro.vercel.app**, mas o banco no Supabase ainda não tem todas as atualizações (migrations). Sem elas, várias partes dão erro: logo da empresa, painel admin, aviso de "carro pronto", suspensão de empresas, teste grátis de 3 dias e equipe do painel.

Este guia é para quem tem o projeto do Supabase na própria conta. **Tempo estimado:** 20 a 40 minutos.

> **Segurança:** a senha do banco e as chaves do Supabase não devem ser enviadas por chat ou e-mail. Tudo abaixo é feito no seu computador e no painel do Supabase.

---

## 1. Ver como o banco está hoje

No painel do Supabase, abra **SQL Editor** e rode as consultas abaixo. Elas **só leem**, não alteram nada.

```sql
-- Quais migrations o banco registra como aplicadas
select version, name
from supabase_migrations.schema_migrations
order by version;
```

```sql
-- Quais tabelas existem e se estão protegidas (rowsecurity deve ser true)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

**Guarde o resultado das duas** (print ou copiar o texto). Ele decide o caminho do passo 4.

Se a primeira consulta der erro *"relation does not exist"*, as migrations foram aplicadas à mão pelo SQL Editor e o Supabase não tem o registro delas. Tudo bem: o passo 4 trata esse caso.

## 2. Cópia de segurança (se já houver clientes reais)

Se o banco tiver **só dados de teste**, pule este passo.

Se tiver dados reais, faça uma cópia antes de mexer:

- **Plano Pro:** **Database → Backups** já guarda cópias diárias. Confira se há uma recente.
- **Plano gratuito:** pelo terminal, depois do passo 3, rode o comando abaixo (precisa do Docker Desktop aberto):
  ```
  npx.cmd supabase db dump --linked -f backup-lavapro.sql
  npx.cmd supabase db dump --linked --data-only -f backup-lavapro-dados.sql
  ```
  Guarde os dois arquivos fora do repositório. Eles contêm dados de clientes.

## 3. Ligar o código ao projeto

Pré-requisitos: **Node.js** instalado e o repositório `jacksonjr-dev/Lava-Jato` atualizado (`git pull` na branch `main`).

No PowerShell:

```
cd CAMINHO\DO\REPOSITORIO\lava-jato-clean
npx.cmd supabase login
npx.cmd supabase link --project-ref SEU_PROJECT_REF
```

- No Windows, use `npx.cmd` em vez de `npx`. O `npx` puro costuma ser bloqueado pelo PowerShell.
- O **project ref** fica em **Project Settings → General → Reference ID** (também aparece no endereço do painel).
- O `link` pede a **senha do banco**. Se não lembrar: **Project Settings → Database → Reset database password**.

## 4. Comparar e aplicar as migrations

Primeiro, compare o que existe no código com o que o banco registra:

```
npx.cmd supabase migration list
```

A tabela mostra duas colunas, **Local** (código) e **Remote** (banco). O código tem **25 migrations** (lista completa no fim deste guia).

### Caso A: o banco registra parte delas e só faltam as últimas

É o caso normal. As que aparecem só na coluna Local são as que faltam.

```
npx.cmd supabase db push --dry-run
```

O `--dry-run` mostra o que **seria** aplicado, sem aplicar. Se a lista bater com as que faltam, aplique:

```
npx.cmd supabase db push
```

### Caso B: a coluna Remote está vazia, mas as tabelas já existem

Isso acontece quando as migrations antigas foram rodadas à mão no SQL Editor. **Não rode o `db push` direto**: ele tentaria criar de novo o que já existe e pararia com erro *"already exists"*.

O caminho é marcar como aplicadas **só as que realmente já estão no banco**, e depois aplicar o resto:

```
npx.cmd supabase migration repair --status applied 20260815030115
```

(Um comando por versão já aplicada.)

Para saber quais já estão no banco, **mande o resultado do passo 1 e do `migration list`** para o Gabriel. Com isso, a gente indica a lista exata de versões para marcar. Marcar uma versão que não foi aplicada de verdade deixa o banco incompleto sem avisar.

### Caso C: o banco está vazio (nenhuma tabela do LavaPro)

Pode aplicar tudo de uma vez:

```
npx.cmd supabase db push
```

### Se o `db push` der erro

Ele para na migration que falhou e não aplica as seguintes. **Não tente corrigir apagando tabelas.** Copie a mensagem de erro inteira e mande para o Gabriel.

## 5. Conferir depois de aplicar

Rode de novo no **SQL Editor**:

```sql
-- As 8 mais recentes precisam aparecer
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 8;
```

```sql
-- Nenhuma tabela pode aparecer com rowsecurity = false
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and rowsecurity = false;
```

A segunda consulta deve voltar **vazia**.

```sql
-- As tabelas novas existem (deve voltar 6 linhas)
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('subscription_events','subscription_payments','tenant_notes',
                     'portal_push_subscriptions','platform_admin_events','platform_admins');
```

Depois, abra **Advisors → Security Advisor**. Não deve haver alertas vermelhos.

## 6. Ajustes no Supabase para o endereço novo

O site mudou para `lava-pro.vercel.app`. Em **Authentication → URL Configuration**:

- **Site URL:** `https://lava-pro.vercel.app`
- **Redirect URLs:** adicionar `https://lava-pro.vercel.app/**`

Sem isso, o link de confirmação de cadastro não volta para o site.

Recomendado também: em **Authentication → Emails → Templates → Confirm signup**, trocar o link por

```
{{ .SiteURL }}/confirmar-email?token_hash={{ .TokenHash }}&type=email
```

E em **Reset password** ("Esqueci minha senha"):

```
{{ .SiteURL }}/redefinir-senha?token_hash={{ .TokenHash }}&type=recovery
```

Assim a confirmação é feita pelo servidor e nenhum token aparece no endereço. O link padrão também funciona.

## 7. Criar o Dono do painel admin (se ainda não existir)

Só depois das migrations aplicadas:

1. **Authentication → Users → Add user** com o e-mail do Dono, marcado como confirmado. A senha quem escolhe é o próprio Dono.
2. No **SQL Editor**:
   ```sql
   insert into platform_admins (user_id, nome, role)
   select id, 'NOME DO DONO', 'DONO' from auth.users where email = 'EMAIL-DO-DONO';
   ```
3. Os outros administradores são convidados pelo próprio painel, na aba **Equipe**.

## 8. Teste final no site

Em **https://lava-pro.vercel.app**:

- [ ] Criar uma conta com e-mail de teste → o e-mail de confirmação chega → o link entra no sistema.
- [ ] Cadastrar o lava-jato → aparece o teste grátis de 3 dias do plano Max.
- [ ] Enviar um logo no Perfil.
- [ ] Cadastrar um serviço e abrir um atendimento.
- [ ] Sair, entrar de novo e conferir que os dados continuam lá.

Se algo falhar, veja **Logs → API / Postgres / Auth** no Supabase. A mensagem costuma dizer o motivo: *"permission denied"* indica regra de acesso, *"relation does not exist"* indica migration faltando.

---

## Migrations do projeto (25)

As 8 últimas são as novas desta versão.

| Versão | Nome |
|---|---|
| 20260815030115 | (inicial) |
| 20260815030136 | (inicial) |
| 20260821061610 | (inicial) |
| 20260821071507 | (inicial) |
| 20260824221455 | (inicial) |
| 20260824230330 | (inicial) |
| 20261013090000 | add_pix_settings |
| 20261013120000 | harden_business_workflows |
| 20261013130000 | simplify_service_status |
| 20261013140000 | merge_ready_and_payment_status |
| 20261013150000 | service_catalog_and_selection_rules |
| 20261013155000 | multitenant_relational_integrity |
| 20261013160000 | public_tenant_identity |
| 20261014120000 | add_business_hours |
| 20261014130000 | multitenant_service_catalog |
| 20261015120000 | security_hardening |
| 20261015140000 | subscription_plans |
| **20261016120000** | **tenant_logos** |
| **20261016150000** | **subscription_events** |
| **20261016170000** | **admin_billing_and_notes** |
| **20261019120000** | **trial_3_dias** |
| **20261020120000** | **portal_push_subscriptions** |
| **20261020150000** | **tenant_suspension** |
| **20261021120000** | **platform_admins_team** |
| **20261021150000** | **platform_admins_owner** |

Os arquivos estão em `lava-jato-clean/supabase/migrations/`.
