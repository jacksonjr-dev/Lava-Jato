import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FREE_MONTHLY_ORDER_LIMIT,
  GRACE_DAYS,
  TRIAL_DAYS,
  applyAdminSubscriptionAction,
  assertFeature,
  hasFeature,
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
    expect(migration).toContain(`now() + interval '${TRIAL_DAYS} days'`);
    expect(migration).toContain(`plan_expires_at + interval '${GRACE_DAYS} days'`);
    expect(migration).toContain(`IF used >= ${FREE_MONTHLY_ORDER_LIMIT} THEN`);
    expect(migration).toContain("PERFORM app.assert_order_quota(tenant);");
  });
});
