# LavaPro

Sistema SaaS para gestão de lava-jatos: clientes, veículos, serviços, ordens de serviço, pagamentos e histórico.

## Desenvolvimento

Requer Node.js 20+ e npm.

```sh
npm install
npm run dev
```

## Configuração do Supabase

1. Crie uma conta e um novo projeto em [Supabase](https://supabase.com/dashboard).
2. Copie `.env.example` para `.env`.
3. Em **Project Settings > API**, copie a URL e a chave publicável para as variáveis correspondentes em `.env`.
4. Instale a CLI do Supabase, autentique e aplique o banco deste repositório:

```sh
supabase login
supabase link --project-ref <referencia-do-seu-projeto>
supabase db push
```

As migrations em `supabase/migrations` criam tabelas, tipos e políticas RLS. Não versione `.env` e nunca use a `SUPABASE_SERVICE_ROLE_KEY` em uma variável `VITE_`.

## Reconhecimento de placa

O preenchimento automático pela foto é opcional e usa a API da OpenAI. Para habilitá-lo, configure `OPENAI_API_KEY` no ambiente do servidor. Sem essa chave o atendimento continua funcionando com digitação manual da placa.
