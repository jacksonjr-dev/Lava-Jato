import { describe, expect, it } from "vitest";
import {
  emptyBusinessHours,
  formatBusinessDay,
  normalizeBusinessHours,
  validateBusinessHours,
} from "./business-hours";

describe("business hours", () => {
  it("normalizes a partial weekly schedule", () => {
    const hours = normalizeBusinessHours({
      monday: { enabled: true, open: "08:00", close: "18:00" },
    });
    expect(hours?.monday).toEqual({ enabled: true, open: "08:00", close: "18:00" });
    expect(hours?.sunday.enabled).toBe(false);
  });

  it("rejects an invalid time range", () => {
    const hours = emptyBusinessHours();
    hours.saturday = { enabled: true, open: "18:00", close: "08:00" };
    expect(() => validateBusinessHours(hours)).toThrow(/fechamento/);
  });

  it("formats open and closed days", () => {
    expect(formatBusinessDay({ enabled: true, open: "09:00", close: "17:30" })).toBe(
      "09:00 às 17:30",
    );
    expect(formatBusinessDay({ enabled: false, open: "08:00", close: "18:00" })).toBe("Fechado");
  });
});
