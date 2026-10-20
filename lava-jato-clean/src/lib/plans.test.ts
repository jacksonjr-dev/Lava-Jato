import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  periodPrice,
  FREE_MONTHLY_ORDER_LIMIT,
  GRACE_DAYS,
  TRIAL_DAYS,
  applyAdminSubscriptionAction,
  assertFeature,
  hasFeature,
  minimumPlanFor,
  PLANS,
  resolveSubscription,
} from "./plans";

const NOW = new Date("2026-10-15T12:00:00.000Z");
const days = (count: number) => new Date(NOW.getTime() + count * 86_400_000).toISOString();

describe("assinatura e planos", () => {
  it("dá o plano Max durante o teste grátis", () => {
    const sub = resolveSubscription({ plan: "GRATIS", trial_ends_at: days(3) }, NOW);
    expect(sub.status).toBe("TESTE");
    expect(sub.effectivePlan).toBe("MAX");
    expect(sub.daysLeft).toBe(3);
    expect(hasFeature(sub, "placa_foto")).toBe(true);
    expect(sub.monthlyOrderLimit).toBeNull();
  });

  it("volta ao Grátis quando o teste termina sem assinatura", () => {
    const sub = resolveSubscription({ plan: "GRATIS", trial_ends_at: days(-1) }, NOW);
    expect(sub.status).toBe("GRATIS");
    expect(sub.features).toEqual([]);
    expect(sub.monthlyOrderLimit).toBe(FREE_MONTHLY_ORDER_LIMIT);
    expect(() => assertFeature(sub, "financeiro")).toThrow("a partir do plano Básico");
  });

  it("libera os recursos do plano pago enquanto vigente", () => {
    const sub = resolveSubscription({ plan: "BASICO", plan_expires_at: days(10) }, NOW);
    expect(sub.status).toBe("ATIVA");
    expect(hasFeature(sub, "pix")).toBe(true);
    expect(hasFeature(sub, "exportacao")).toBe(false);
    expect(() => assertFeature(sub, "placa_foto")).toThrow("a partir do plano Max");
  });

  it("mantém o plano durante a tolerância e depois rebaixa", () => {
    const inGrace = resolveSubscription({ plan: "MAX", plan_expires_at: days(-1) }, NOW);
    expect(inGrace.status).toBe("TOLERANCIA");
    expect(inGrace.effectivePlan).toBe("MAX");

    const expired = resolveSubscription(
      { plan: "MAX", plan_expires_at: days(-(GRACE_DAYS + 1)) },
      NOW,
    );
    expect(expired.status).toBe("GRATIS");
    expect(expired.effectivePlan).toBe("GRATIS");
  });

  it("trata dados ausentes ou inválidos como Grátis", () => {
    expect(resolveSubscription(null, NOW).effectivePlan).toBe("GRATIS");
    expect(resolveSubscription({ plan: "OURO" }, NOW).plan).toBe("GRATIS");
  });
});

describe("liberação manual pelo administrador", () => {
  it("renovação do mesmo plano soma ao vencimento atual", () => {
    const next = applyAdminSubscriptionAction(
      { plan: "BASICO", plan_expires_at: days(5) },
      { action: "ATIVAR", plan: "BASICO", days: 30 },
      NOW,
    );
    expect(next).toEqual({ plan: "BASICO", trial_ends_at: null, plan_expires_at: days(35) });
  });

  it("troca de plano começa a contar hoje e encerra o teste", () => {
    const next = applyAdminSubscriptionAction(
      { plan: "BASICO", plan_expires_at: days(5), trial_ends_at: days(2) },
      { action: "ATIVAR", plan: "MAX", days: 30 },
      NOW,
    );
    expect(next).toEqual({ plan: "MAX", trial_ends_at: null, plan_expires_at: days(30) });
  });

  it("estende o teste a partir do fim atual", () => {
    const next = applyAdminSubscriptionAction(
      { plan: "GRATIS", trial_ends_at: days(2) },
      { action: "ESTENDER_TESTE", days: 7 },
      NOW,
    );
    expect(next.trial_ends_at).toBe(days(9));
  });

  it("volta ao Grátis limpando teste e vencimento", () => {
    expect(
      applyAdminSubscriptionAction(
        { plan: "MAX", plan_expires_at: days(20) },
        { action: "GRATIS" },
        NOW,
      ),
    ).toEqual({ plan: "GRATIS", trial_ends_at: null, plan_expires_at: null });
  });

  it("rejeita quantidade de dias inválida", () => {
    expect(() =>
      applyAdminSubscriptionAction({}, { action: "ATIVAR", plan: "MAX", days: 0 }, NOW),
    ).toThrow("entre 1 e 400");
  });
});

describe("sincronia com o banco", () => {
  it("usa no SQL os mesmos prazos e limite do código", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20261015140000_subscription_plans.sql"),
      "utf8",
    );
    expect(migration).toContain(`plan_expires_at + interval '${GRACE_DAYS} days'`);
    expect(migration).toContain(`IF used >= ${FREE_MONTHLY_ORDER_LIMIT} THEN`);
    expect(migration).toContain("PERFORM app.assert_order_quota(tenant);");
    // O prazo do teste foi alterado depois; vale a migration mais recente.
    const trial = readFileSync(
      resolve("supabase/migrations/20261019120000_trial_3_dias.sql"),
      "utf8",
    );
    expect(trial).toContain(`SET DEFAULT (now() + interval '${TRIAL_DAYS} days')`);
  });
});

describe("o que cada plano libera", () => {
  it("segue a divisão equilibrada", () => {
    expect(PLANS.GRATIS.features).toEqual([]);
    expect(PLANS.BASICO.features).toEqual(["area_cliente", "pix", "financeiro", "logo"]);
    expect(PLANS.MAX.features).toEqual([
      "area_cliente",
      "pix",
      "financeiro",
      "logo",
      "analise",
      "exportacao",
      "placa_foto",
    ]);
  });

  it("indica o menor plano de cada recurso", () => {
    expect(minimumPlanFor("logo").id).toBe("BASICO");
    expect(minimumPlanFor("financeiro").id).toBe("BASICO");
    expect(minimumPlanFor("analise").id).toBe("MAX");
    expect(minimumPlanFor("placa_foto").id).toBe("MAX");
  });

  it("o teste grátis libera tudo do Max", () => {
    const sub = resolveSubscription({ plan: "GRATIS", trial_ends_at: days(2) }, NOW);
    expect(hasFeature(sub, "analise")).toBe(true);
    expect(hasFeature(sub, "logo")).toBe(true);
  });
});

describe("preços", () => {
  it("Básico R$ 79,90 e Max R$ 99,90 por mês", () => {
    expect(PLANS.BASICO.preco).toBe("R$ 79,90");
    expect(PLANS.BASICO.precoMensal).toBe(79.9);
    expect(PLANS.MAX.preco).toBe("R$ 99,90");
    expect(PLANS.MAX.precoMensal).toBe(99.9);
    expect(PLANS.GRATIS.precoMensal).toBe(0);
  });
});

describe("desconto por período", () => {
  it("calcula total, valor por mês e economia", () => {
    expect(periodPrice("MAX", 1)).toEqual({ total: 99.9, perMonth: 99.9, discount: 0, savings: 0 });
    expect(periodPrice("MAX", 12)).toEqual({
      total: 1018.98,
      perMonth: 84.92,
      discount: 0.15,
      savings: 179.82,
    });
    // Trimestral sem desconto: o desconto começa no semestral.
    expect(periodPrice("BASICO", 3)).toEqual({
      total: 239.7,
      perMonth: 79.9,
      discount: 0,
      savings: 0,
    });
    expect(periodPrice("BASICO", 6)?.total).toBe(431.46);
    expect(periodPrice("GRATIS", 12)?.total).toBe(0);
  });
});
