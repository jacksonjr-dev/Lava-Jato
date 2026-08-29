# Plate Perfect

# Projeto: SaaS de Gestão para Lava-Jatos

Quero desenvolver uma aplicação web SaaS para gestão de lava-jatos de pequeno e médio porte.

A ideia principal é criar um sistema extremamente simples e rápido de usar no dia a dia, principalmente em celular ou tablet. O grande diferencial será permitir que o funcionário tire uma foto da placa do veículo e, a partir dela, o sistema identifique o veículo, encontre seu histórico e inicie um novo atendimento.

O sistema deverá ser desenvolvido pensando desde o início em MULTI-TENANCY, pois a mesma aplicação será utilizada por vários lava-jatos diferentes. Cada lava-jato deve ter seus próprios usuários, clientes, veículos, serviços, atendimentos, pagamentos e configurações, sem acesso aos dados de outros estabelecimentos.

## Objetivo do produto

Criar um sistema moderno de gestão para lava-jatos que substitua fichas de papel, planilhas e controles manuais.

O fluxo principal deve ser:

1. Funcionário entra no sistema.

2. Clica em "Novo Atendimento".

3. Abre a câmera do celular/tablet.

4. Fotografa a placa do veículo.

5. O sistema utiliza OCR/LPR para identificar a placa.

6. Exibe a placa reconhecida para confirmação.

7. Procura o veículo no banco de dados.

8. Se o veículo já existir, mostra cliente, veículo e histórico.

9. Se não existir, permite cadastrar rapidamente.

10. Funcionário seleciona os serviços.

11. Atendimento é criado.

12. Veículo entra no fluxo de atendimento.

13. Funcionário altera o status conforme o serviço avança.

14. Ao finalizar, registra pagamento.

15. Atendimento fica salvo no histórico do cliente e veículo.

## Experiência principal

A aplicação deve ser MOBILE FIRST.

O funcionário não deve precisar navegar por vários menus para iniciar um atendimento.

A tela inicial deve ter como ação principal:

"NOVO ATENDIMENTO"

Ao clicar:

"CÂMERA / FOTOGRAFAR PLACA"

Depois do reconhecimento:

"Placa identificada: ABC1D23"

Botões:

[CONFIRMAR]

[CORRIGIR]

Depois da confirmação, procurar automaticamente o veículo.

Caso exista:

Veículo:

Honda Civic

ABC1D23

Cliente:

João da Silva

Último atendimento:

12/08/2026

Total de atendimentos:

7

Botão:

[INICIAR NOVO ATENDIMENTO]

Caso não exista:

"Veículo não cadastrado"

Permitir cadastro rápido de:

- placa

- marca

- modelo

- cor

- ano

- cliente

- telefone

Não obrigar o funcionário a preencher informações desnecessárias durante o atendimento.

## Atendimento

Após selecionar o veículo, abrir uma Ordem de Serviço.

Exemplo:

ATENDIMENTO #1842

Veículo:

Honda Civic

ABC1D23

Cliente:

João da Silva

Serviços:

[ ] Lavagem simples - R$ 35

[ ] Lavagem completa - R$ 60

[ ] Higienização - R$ 90

[ ] Polimento - R$ 150

Permitir adicionar múltiplos serviços.

Também permitir:

- desconto

- acréscimo

- observações

- fotos do veículo

- observações sobre danos existentes

Calcular automaticamente o total.

## Status do atendimento

Cada atendimento deve possuir um status:

AGUARDANDO

EM_LAVAGEM

EM_FINALIZACAO

FINALIZADO

AGUARDANDO_PAGAMENTO

PAGO

ENTREGUE

CANCELADO

O lava-jato deve conseguir visualizar um painel Kanban ou equivalente mostrando os veículos em cada etapa.

Exemplo:

AGUARDANDO

- ABC1D23

- DEF4G56

EM LAVAGEM

- HIJ7K89

FINALIZAÇÃO

- LMN1O23

PRONTO

- PQR4S56

## Cadastro de veículos

Cada veículo deve possuir:

- id

- tenant_id

- placa

- marca

- modelo

- versão

- ano

- cor

- observações

- created_at

- updated_at

A placa deve possuir índice e ser pesquisável rapidamente.

Também considerar normalização da placa para evitar problemas com:

- espaços

- hífens

- letras minúsculas

- letras maiúsculas

Exemplo:

"abc-1d23"

"ABC1D23"

devem ser tratados como a mesma placa.

## Clientes

Campos:

- id

- tenant_id

- nome

- telefone

- email

- CPF opcional

- observações

- created_at

- updated_at

Um cliente pode possuir vários veículos.

## Serviços

Cada lava-jato deve poder cadastrar seus próprios serviços.

Campos:

- id

- tenant_id

- nome

- descrição

- preço

- duração estimada

- ativo

- created_at

- updated_at

Exemplos:

Lavagem simples

Lavagem completa

Lavagem premium

Higienização interna

Polimento

Cristalização

Enceramento

O preço deve ser configurável individualmente por cada lava-jato.

## Ordem de serviço

Campos principais:

- id

- tenant_id

- customer_id

- vehicle_id

- employee_id

- status

- subtotal

- desconto

- acréscimo

- total

- observações

- started_at

- finished_at

- created_at

- updated_at

Criar também uma tabela de itens da ordem de serviço para registrar exatamente quais serviços foram realizados e seus preços no momento da venda.

Não depender apenas do preço atual do serviço, pois o preço pode mudar no futuro e o histórico financeiro precisa permanecer correto.

## Pagamento

Permitir:

- dinheiro

- PIX

- cartão de débito

- cartão de crédito

- outros

Uma ordem pode possuir um ou mais pagamentos se necessário.

Registrar:

- valor

- método

- data

- usuário responsável

## Histórico

Ao pesquisar uma placa, mostrar:

- dados do veículo

- proprietário

- quantidade de atendimentos

- último atendimento

- serviços mais utilizados

- histórico de atendimentos

- valores pagos anteriormente

Exemplo:

ABC1D23

7 atendimentos

Último:

12/08/2026

Histórico:

12/08/2026 - Lavagem completa - R$ 60

02/08/2026 - Lavagem simples - R$ 35

20/07/2026 - Higienização - R$ 90

## Dashboard

Criar dashboard para o proprietário do lava-jato.

Mostrar:

- faturamento do dia

- faturamento da semana

- faturamento do mês

- quantidade de veículos atendidos

- ticket médio

- serviços mais vendidos

- atendimentos em andamento

- atendimentos finalizados

- pagamentos por método

Criar gráficos simples e fáceis de entender.

## Multi-tenancy

Esta é uma exigência fundamental.

A aplicação deverá permitir que vários lava-jatos utilizem o mesmo sistema.

Estrutura conceitual:

Tenant

├── Users

├── Customers

├── Vehicles

├── Services

├── ServiceOrders

├── Payments

└── Settings

Todo dado pertencente a um lava-jato deve possuir tenant_id quando aplicável.

Um usuário de um tenant jamais poderá acessar dados de outro tenant.

Implementar isolamento de dados no backend e não confiar apenas no frontend.

## Usuários e permissões

Criar pelo menos:

OWNER

MANAGER

EMPLOYEE

OWNER:

- acesso total

- configurações

- financeiro

- usuários

- relatórios

MANAGER:

- atendimento

- clientes

- veículos

- serviços

- relatórios

EMPLOYEE:

- iniciar atendimento

- visualizar veículos

- atualizar status

- finalizar atendimento

- registrar pagamento

As permissões devem ser verificadas no backend.

## Configuração do lava-jato

Cada tenant deve poder configurar:

- nome

- logo

- telefone

- endereço

- horário de funcionamento

- serviços

- preços

- formas de pagamento

- usuários

- configurações gerais

Pensar desde o início em possibilidade futura de personalização visual/white-label.

## Reconhecimento da placa

Criar uma camada de abstração para reconhecimento de placas.

Não acoplar toda a aplicação diretamente a um único fornecedor.

Criar algo conceitualmente semelhante a:

PlateRecognitionService

Entrada:

- imagem

Saída:

{

  plate: "ABC1D23",

  confidence: 0.96

}

Se o reconhecimento falhar, permitir entrada manual.

O sistema deve sempre mostrar a placa reconhecida para confirmação humana antes de criar/buscar o veículo.

Salvar a imagem original do atendimento quando apropriado.

## Fotos

Permitir tirar fotos do veículo durante o atendimento.

Exemplos:

- frente

- traseira

- lateral

- danos existentes

As imagens devem ser armazenadas em object storage, e o banco deve guardar apenas os metadados/URLs necessárias.

## Arquitetura

Priorizar:

- código limpo

- TypeScript

- componentes reutilizáveis

- separação clara entre frontend/backend

- validação de dados

- tratamento de erros

- logs

- autenticação segura

- autorização no backend

- isolamento multi-tenant

- banco relacional

- migrations

- testes

Não criar uma arquitetura excessivamente complexa para o MVP.

O objetivo é conseguir colocar o primeiro lava-jato utilizando o sistema rapidamente.

## UX/UI

A interface deve parecer um produto SaaS moderno.

Características:

- mobile first

- responsiva

- botões grandes

- poucos passos

- visual limpo

- fácil para funcionários que não são técnicos

- navegação rápida

- feedback visual para cada ação

- estados de loading

- mensagens de erro amigáveis

- confirmação de ações importantes

Priorizar velocidade de atendimento em vez de quantidade de funcionalidades.

## MVP

Não implementar tudo de uma vez.

Primeiro construir apenas:

1. Autenticação

2. Multi-tenancy

3. Cadastro do lava-jato

4. Usuários e permissões

5. Clientes

6. Veículos

7. Serviços

8. Foto/reconhecimento da placa

9. Busca automática pela placa

10. Novo atendimento

11. Seleção de serviços

12. Status do atendimento

13. Finalização

14. Pagamento

15. Histórico

16. Dashboard básico

Funcionalidades como marketing, WhatsApp automático, fidelidade, cupons, estoque, emissão fiscal e integrações devem ficar para fases futuras.

## Importante

Antes de começar a escrever uma grande quantidade de código:

1. Analise os requisitos.

2. Identifique possíveis problemas técnicos.

3. Proponha a arquitetura.

4. Defina o modelo de dados.

5. Defina as principais rotas da API.

6. Defina a estrutura de pastas.

7. Defina as telas.

8. Explique como será implementado o reconhecimento da placa.

9. Explique como será garantido o isolamento entre tenants.

10. Depois disso, implemente o MVP em etapas pequenas e testáveis.

Não invente funcionalidades desnecessárias.

Sempre priorize o fluxo:

FOTO DA PLACA

→ RECONHECIMENTO

→ CONFIRMAÇÃO

→ BUSCA DO VEÍCULO

→ CLIENTE

→ SERVIÇOS

→ ATENDIMENTO

→ PAGAMENTO

→ HISTÓRICO

Quero que você atue como arquiteto de software e desenvolvedor full-stack sênior durante a construção deste projeto, tomando decisões técnicas justificadas e mantendo o projeto simples, escalável e pronto para ser utilizado por vários lava-jatos.

:::

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://plate-to-clean.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c30a739-4004-4357-8a25-ddab87c65fd4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
