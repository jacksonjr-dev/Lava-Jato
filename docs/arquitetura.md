# Arquitetura

## Camadas

```
Navegador (React)
   │  useServerFn(...)                     ← chamadas RPC do TanStack Start
   ▼
Server functions  src/lib/lavajato.functions.ts
   │  middleware requireSupabaseAuth        ← valida o JWT do usuário
   │  regras de plano (src/lib/plans.ts)
   ▼
Supabase (Postgres)
   ├─ RLS por empresa (tenant_id = app.current_tenant())
   ├─ GRANTs por coluna                     ← o que a API REST pode alterar
   └─ RPCs SECURITY DEFINER                 ← operações atômicas (atendimento, pagamento…)
```

- **`src/lib/*.functions.ts`**: server functions chamadas pelas telas. Rodam no servidor, mas o arquivo é importado pelo cliente, então qualquer código só de servidor entra via `import()` dinâmico ou fica em `*.server.ts`.
- **`src/lib/*.server.ts`**: código exclusivo do servidor (consultas, leitura de placa, segurança do portal).
- **`src/lib/plans.ts`**: fonte única dos planos, recursos e prazos, usada pelo servidor, pelas telas e pela landing.
- **`src/routes/`**: uma página por arquivo. As telas de `_authenticated/` exigem login.

## Segurança

O navegador conhece a chave publicável e o JWT do usuário, então **tudo que a política RLS permite pode ser feito direto pela API REST**. Por isso as regras de negócio ficam no banco, não só no servidor:

| Regra                                               | Onde é imposta                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Uma empresa não vê os dados de outra                | RLS `tenant_id = app.current_tenant()` em todas as tabelas                 |
| Pagamentos e itens da OS não são editáveis pela API | `REVOKE INSERT/UPDATE/DELETE`; a gravação acontece só pelas RPCs           |
| Valores da OS (total, desconto)                     | Só pelas RPCs; a API altera apenas `status`, `finished_at` e `observacoes` |
| `PAGO` exige pagamento registrado                   | Trigger `enforce_order_status_transition`                                  |
| Funcionário não cancela                             | Mesma trigger                                                              |
| Plano e slug da empresa                             | Fora do `GRANT UPDATE` por coluna; só o service role altera                |
| Limite de 30 atendimentos no Grátis                 | `app.assert_order_quota` dentro das RPCs de atendimento                    |
| Força bruta no portal do cliente                    | Tabela `portal_login_attempts` (por IP, por placa e por placa + telefone)  |

O teste `src/lib/workflow-migration.test.ts` confere essas regras no texto das migrations. O teste `src/lib/plans.test.ts` garante que os prazos e o limite do SQL são os mesmos do código.

## Planos e assinatura

- Colunas em `tenants`: `plan` (`GRATIS` | `BASICO` | `MAX`), `trial_ends_at` e `plan_expires_at`.
- Plano em vigor: durante o teste é o Max; com um plano pago vencido há até 3 dias, o próprio plano pago; depois disso, Grátis. O cálculo é feito por `resolveSubscription` no código e por `app.tenant_effective_plan` no SQL.
- Os recursos pagos são verificados no servidor (`requireFeature`). As telas só mostram cadeados e o aviso de upgrade.
- Liberação: manual pelo painel `/admin` (tabela `platform_admins`). A integração com um gateway (Asaas) é a próxima etapa.

## Modo demonstração

`npm run dev:demo` define `DEMO_MODE` e `VITE_DEMO_MODE`. As server functions passam a usar dados fictícios (`src/lib/demo-data.server.ts`, gravados em `.data/`) e o navegador não chama o Supabase. **Nunca habilite em produção**, porque a autenticação fica desligada.
