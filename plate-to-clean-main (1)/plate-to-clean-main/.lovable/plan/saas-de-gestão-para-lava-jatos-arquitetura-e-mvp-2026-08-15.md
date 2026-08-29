# SaaS de Gestão para Lava-Jatos — Arquitetura e MVP

## 1. Decisões técnicas

- **Stack**: TanStack Start (React 19 + SSR) + Tailwind, backend em server functions tipadas, banco PostgreSQL gerenciado pelo Lovable Cloud (auth, storage e migrations inclusos).
- **Mobile first**: layout de app (bottom nav), botões grandes, fluxo de atendimento em passos únicos por tela.
- **Autorização no backend**: toda leitura/escrita passa por políticas de banco (RLS) + verificação de papel no servidor. O frontend só esconde botões; nunca é a barreira de segurança.

## 2. Riscos técnicos identificados

| Risco | Mitigação |
|---|---|
| OCR de placa com baixa precisão | Confirmação humana obrigatória + edição manual sempre disponível |
| Vazamento entre lava-jatos | tenant_id em todas as tabelas + RLS baseada em função `current_tenant()` |
| Preço de serviço muda e quebra histórico | Itens da OS gravam nome e preço no momento da venda |
| Placa escrita de formas diferentes | Coluna normalizada (`plate_normalized`) com índice único por tenant |
| Recursão em políticas de acesso | Papéis em tabela separada + função `security definer` |

## 3. Modelo de dados

```text
tenants(id, nome, logo_url, telefone, endereco, horario, tema, created_at)
tenant_members(id, tenant_id, user_id, role: OWNER|MANAGER|EMPLOYEE)
customers(id, tenant_id, nome, telefone, email, cpf, obs)
vehicles(id, tenant_id, customer_id, plate, plate_normalized, marca, modelo,
         versao, ano, cor, obs)              -- UNIQUE(tenant_id, plate_normalized)
services(id, tenant_id, nome, descricao, preco, duracao_min, ativo)
service_orders(id, tenant_id, numero, customer_id, vehicle_id, employee_id,
               status, subtotal, desconto, acrescimo, total, obs,
               started_at, finished_at)
service_order_items(id, order_id, service_id, nome_snapshot, preco_snapshot, qtd)
payments(id, tenant_id, order_id, valor, metodo, pago_em, user_id)
order_photos(id, tenant_id, order_id, url, tipo: PLACA|FRENTE|TRASEIRA|LATERAL|DANO)
```

Status: AGUARDANDO, EM_LAVAGEM, EM_FINALIZACAO, FINALIZADO, AGUARDANDO_PAGAMENTO, PAGO, ENTREGUE, CANCELADO.

## 4. Isolamento entre tenants

1. Toda tabela de negócio tem `tenant_id NOT NULL`.
2. Funções de banco `security definer`: `current_tenant(uid)` e `has_role(uid, tenant, role)`.
3. RLS: `USING (tenant_id = current_tenant(auth.uid()))` em SELECT/INSERT/UPDATE/DELETE.
4. Server functions autenticadas derivam o tenant do token — nunca de dados enviados pelo cliente.
5. Ações sensíveis (financeiro, usuários, configurações) exigem OWNER/MANAGER verificado no servidor.

## 5. Reconhecimento de placa

Camada abstrata `PlateRecognitionService`:

```text
recognizePlate(imagemBase64) -> { plate: "ABC1D23", confidence: 0.96 }
```

- Implementação inicial: provider de visão via IA (server function), sem acoplar a app ao fornecedor.
- Sempre exibe a placa reconhecida para CONFIRMAR / CORRIGIR.
- Falha ou baixa confiança → entrada manual, mesmo fluxo daí em diante.
- Foto original salva em storage e vinculada à OS como tipo PLACA.

## 6. Rotas / telas

```text
/                      landing + login
/auth                  entrar / criar conta
/onboarding            criar o lava-jato (primeiro acesso)
/app                   home: botão gigante NOVO ATENDIMENTO
/app/atendimento/novo  câmera → OCR → confirmação → veículo → serviços
/app/os/$id            ordem de serviço, status, fotos, pagamento
/app/painel            kanban por status
/app/veiculos          busca por placa + histórico
/app/clientes          clientes e seus veículos
/app/servicos          catálogo e preços
/app/dashboard         faturamento, ticket médio, top serviços, métodos
/app/config            dados do lava-jato + usuários e papéis
```

Server functions por domínio em `src/lib/*.functions.ts` (vehicles, orders, services, payments, plate, dashboard).

## 7. Entrega em etapas

1. **Base**: design system (visual SaaS moderno, mobile first), Cloud ativado, migração com todas as tabelas, RLS, grants e serviços padrão de exemplo.
2. **Auth + onboarding**: login, criação do lava-jato, papéis.
3. **Fluxo principal**: câmera → OCR → confirmação → busca de veículo → cadastro rápido → seleção de serviços → OS criada.
4. **Operação**: kanban de status, fotos do veículo, desconto/acréscimo, finalização e pagamento.
5. **Consulta**: busca por placa com histórico completo do veículo e cliente.
6. **Gestão**: dashboard com gráficos, catálogo de serviços, configurações e usuários.

Fora do MVP: WhatsApp, fidelidade, cupons, estoque, fiscal, integrações.
