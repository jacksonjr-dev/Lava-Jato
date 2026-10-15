import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("migrações de integridade", () => {
  it("não mantém a antiga exclusão fixa de tenant", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20260824221455_ee612832-f912-4625-babc-c9ca01746b4c.sql"),
      "utf8",
    );
    expect(migration).not.toMatch(/DELETE\s+FROM/i);
  });

  it("inclui transações e proteção de status no banco", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013120000_harden_business_workflows.sql"),
      "utf8",
    );
    expect(migration).toContain("quick_register_atomic");
    expect(migration).toContain("create_order_atomic");
    expect(migration).toContain("register_order_payment_atomic");
    expect(migration).toContain("enforce_order_status_transition");
    expect(migration).toContain("service_orders_tenant_numero_unique");
  });

  it("consolida a etapa de finalização no status em serviço", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013130000_simplify_service_status.sql"),
      "utf8",
    );
    expect(migration).toContain("SET status = 'EM_LAVAGEM'");
    expect(migration).toContain(
      "OLD.status = 'EM_LAVAGEM' AND NEW.status IN ('FINALIZADO', 'CANCELADO')",
    );
  });

  it("une serviço pronto e pagamento pendente", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013140000_merge_ready_and_payment_status.sql"),
      "utf8",
    );
    expect(migration).toContain("SET status = 'AGUARDANDO_PAGAMENTO'");
    expect(migration).toContain(
      "OLD.status = 'EM_LAVAGEM' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO')",
    );
  });

  it("mantém apenas um tipo de lavagem por ordem no banco", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013150000_service_catalog_and_selection_rules.sql"),
      "utf8",
    );
    expect(migration).toContain("prevent_multiple_washes_per_order");
    expect(migration).toContain("Escolha apenas uma lavagem: simples ou completa.");
    expect(migration).toContain("Lavagem simples (apenas externa)");
    expect(migration).toContain("Lavagem completa (externa e interna)");
  });

  it("isola a identidade pública e as integrações de cada empresa", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013160000_public_tenant_identity.sql"),
      "utf8",
    );
    expect(migration).toContain("tenants_slug_unique");
    expect(migration).toContain("tenant_integrations");
    expect(migration).toContain("notification_outbox");
    expect(migration).toContain("UNIQUE (tenant_id, order_id, event_type, channel)");
    expect(migration).toContain("customer.whatsapp_opt_in");
    expect(migration).toContain("customer.web_push_opt_in");
  });

  it("impede vínculos cruzados entre empresas e cria o atendimento inicial em uma transação", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261013155000_multitenant_relational_integrity.sql"),
      "utf8",
    );
    expect(migration).toContain("create_intake_atomic");
    expect(migration).toContain("vehicles_customer_same_tenant_fkey");
    expect(migration).toContain("service_orders_vehicle_same_tenant_fkey");
    expect(migration).toContain("payments_order_same_tenant_fkey");
    expect(migration).toContain("app.current_tenant()");
    expect(migration).toContain("app.current_role_in_tenant()");
    expect(migration).not.toContain("public.current_role()");
  });

  it("mantém catálogo e categorias de serviço separados por empresa", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261014130000_multitenant_service_catalog.sql"),
      "utf8",
    );
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS categoria");
    expect(migration).toContain("service.tenant_id = item.tenant_id");
    expect(migration).toContain("item.tenant_id = NEW.tenant_id");
    expect(migration).toContain("'LAVAGEM'");
    expect(migration).toContain("'ADICIONAL'");
  });
});
