import { describe, expect, it } from "vitest";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "./captcha";

describe("mensagens do cadastro e login", () => {
  it("traduz os erros do Supabase Auth", () => {
    expect(authErrorMessage("Invalid login credentials")).toContain("incorretos");
    expect(authErrorMessage("Email not confirmed")).toContain("Confirme seu e-mail");
    expect(
      authErrorMessage("captcha protection: request disallowed (invalid-input-response)"),
    ).toContain("robô");
    expect(authErrorMessage("User already registered")).toContain("já tem conta");
    expect(authErrorMessage("Password should be at least 8 characters.")).toContain(
      String(MIN_PASSWORD_LENGTH),
    );
    expect(authErrorMessage("email rate limit exceeded")).toContain("Muitas tentativas");
  });

  it("mantém mensagens que já estão em português", () => {
    expect(authErrorMessage("Use uma senha com pelo menos 8 caracteres.")).toBe(
      "Use uma senha com pelo menos 8 caracteres.",
    );
  });
});
