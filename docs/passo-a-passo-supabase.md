# LavaPro: próximos passos no Supabase

O site já está no ar em **https://lava-pro.vercel.app**, com o "Esqueci minha senha" novo. Faltam alguns ajustes no painel do Supabase, todos feitos por quem tem acesso ao projeto **LAVAPRO**.

**Tempo estimado:** 30 a 40 minutos. Siga na ordem e marque cada item.

> **Segurança:** senhas, chaves e o código do projeto não devem ser enviados por chat ou e-mail. Tudo abaixo é feito direto no painel do Supabase.

---

## 1. Modelos de e-mail em português

Agora que o e-mail sai pelo Gmail do sistema (SMTP próprio), o Supabase aceita modelos personalizados.

Em **Authentication → Emails → Templates**:

### 1.1 Reset password (Esqueci minha senha), novo

- [ ] **Subject:** `Crie uma senha nova no LavaPro`
- [ ] **Body:**

```html
<h2>Trocar a senha do LavaPro</h2>
<p>Recebemos um pedido para trocar a senha da sua conta.</p>
<p><a href="{{ .SiteURL }}/redefinir-senha?token_hash={{ .TokenHash }}&type=recovery">Criar senha nova</a></p>
<p>Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
```

### 1.2 Confirm signup (se ainda não foi feito)

- [ ] **Subject:** `Confirme seu cadastro no LavaPro`
- [ ] **Body:**

```html
<h2>Bem-vindo ao LavaPro!</h2>
<p>Clique no botão abaixo para ativar sua conta:</p>
<p><a href="{{ .SiteURL }}/confirmar-email?token_hash={{ .TokenHash }}&type=email">Confirmar meu e-mail</a></p>
<p>Se você não criou uma conta no LavaPro, ignore este e-mail.</p>
```

### 1.3 Invite user (convite do painel admin), se ainda não foi feito

- [ ] **Subject:** `Convite para o painel do LavaPro`
- [ ] **Body:**

```html
<h2>Você foi convidado para o painel do LavaPro</h2>
<p>Clique no botão abaixo para criar sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Criar minha senha</a></p>
<p>Se você não esperava este convite, ignore este e-mail.</p>
```

Aqui o link continua `{{ .ConfirmationURL }}`, sem troca.

Clique em **Save** em cada modelo.

## 2. Testar o "Esqueci minha senha"

Use uma conta de teste que já exista no site.

- [ ] Em https://lava-pro.vercel.app/auth, clique em **Esqueci minha senha** (ao lado do campo "Senha").
- [ ] Informe o e-mail da conta de teste e clique em **Enviar link**.
- [ ] O e-mail **"Crie uma senha nova no LavaPro"** chega (confira também o spam).
- [ ] O botão do e-mail abre a página **"Criar senha nova"**.
- [ ] Digite uma senha nova (mínimo 8 caracteres) duas vezes e salve → aparece **"Senha alterada"**.
- [ ] Entre com a **senha nova**: funciona.
- [ ] Tente com a **senha antiga**: não entra mais.
- [ ] Clique no **mesmo link do e-mail** de novo: aparece **"Link expirado ou já usado"** (é o esperado).

Se algo falhar, veja **Logs → Auth** e mande o print da mensagem de erro para o Gabriel.

## 3. Definir o Dono do painel admin

O Dono é o único que vê a aba **Equipe** do painel e convida ou remove administradores. Hoje existem 2 administradores e nenhum é o Dono.

**O nome e o e-mail do Dono são definidos pelo Gabriel.**

Em **SQL Editor**:

- [ ] Ver quem são os administradores (só leitura):

```sql
select au.email, pa.nome, pa.role, pa.created_at
from public.platform_admins pa
join auth.users au on au.id = pa.user_id
order by pa.created_at;
```

- [ ] Definir o Dono (trocar o nome e o e-mail):

```sql
update public.platform_admins as pa
set nome = 'NOME DO DONO',
    role = 'DONO'
from auth.users as au
where pa.user_id = au.id
  and au.email = 'EMAIL-DO-DONO';
```

  O resultado precisa ser **"1 row affected"**. Se for 0, o e-mail está diferente do cadastrado.

- [ ] Dar nome ao outro administrador:

```sql
update public.platform_admins as pa
set nome = 'NOME DO OUTRO ADMIN'
from auth.users as au
where pa.user_id = au.id
  and au.email = 'EMAIL-DO-OUTRO';
```

- [ ] Rodar a primeira consulta de novo: deve haver **exatamente 1 linha com `DONO`**.

## 4. Conferir os limites de tentativas

O login agora passa pelo servidor do site, então muitos acessos chegam ao Supabase pelos mesmos endereços da Vercel.

Em **Authentication → Rate Limits**:

- [ ] **Rate limit for sending emails:** pelo menos **30 por hora** (o Gmail aceita cerca de 500 por dia).
- [ ] **Sign-ups and sign-ins** e **Token refreshes:** manter os padrões por enquanto. Se aparecer "Muitas tentativas" para pessoas diferentes ao mesmo tempo, aumentar.

## 5. Anti-robô (Turnstile)

Só se o Cloudflare Turnstile estiver configurado. Combine com quem tem a conta do Cloudflare.

- [ ] No **Cloudflare → Turnstile → widget do LavaPro → Settings**, a lista de domínios inclui `lava-pro.vercel.app` (e `lava-pro-admin.vercel.app`, para o painel).
- [ ] No Supabase, **Authentication → Attack Protection → Enable Captcha protection**, provider **Turnstile**, colando a **Secret Key** do widget.
- [ ] Testar: em https://lava-pro.vercel.app/auth o quadrinho de verificação aparece, e o login continua funcionando.

> Se o login parar de funcionar depois disso, desligue o captcha no Supabase e avise o Gabriel. Provavelmente a Secret Key ou o domínio do widget está errado.

## 6. Cópia de segurança do banco

O projeto está no plano gratuito, que não guarda backups, e já há dados reais.

- [ ] Instalar e abrir o **Docker Desktop**.
- [ ] No PowerShell, dentro da pasta `lava-jato-clean` do repositório:

```
npx.cmd supabase db dump --linked -f backup-lavapro.sql
npx.cmd supabase db dump --linked --data-only -f backup-lavapro-dados.sql
```

- [ ] Guardar os dois arquivos **fora do repositório** (eles contêm dados de clientes). Repetir de tempos em tempos, por exemplo uma vez por semana.

---

## Ao terminar

Avise o Gabriel com:

- [ ] quais itens foram feitos;
- [ ] o resultado do teste do item 2;
- [ ] prints de qualquer erro (sem senhas ou chaves).
