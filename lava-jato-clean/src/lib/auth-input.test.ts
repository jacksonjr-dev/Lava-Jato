import { describe, expect, it } from "vitest";
import { parseConfirmation, parseCredentials, parseResend, parseSignUp } from "./auth-input";

describe("entrar", () => {
  it("normaliza o e-mail e descarta captcha vazio", () => {
    expect(
      parseCredentials({
        email: " Dono@LavaPro.com.br ",
        password: "segredo12",
        captchaToken: null,
      }),
    ).toEqual({ email: "dono@lavapro.com.br", password: "segredo12" });
  });

  it("recusa e-mail inválido, senha vazia e dados que não são objeto", () => {
    expect(() => parseCredentials({ email: "dono@", password: "x" })).toThrow("e-mail");
    expect(() => parseCredentials({ email: "a@b.com", password: "" })).toThrow("senha");
    expect(() => parseCredentials({ email: "a@b.com", password: "x".repeat(129) })).toThrow(
      "senha",
    );
    expect(() => parseCredentials("a@b.com")).toThrow("Dados inválidos");
  });
});

describe("criar conta", () => {
  it("exige nome e senha mínima", () => {
    expect(
      parseSignUp({
        email: "a@b.com",
        password: "12345678",
        nome: "  Ana   Souza ",
        captchaToken: "t",
      }),
    ).toEqual({ email: "a@b.com", password: "12345678", nome: "Ana Souza", captchaToken: "t" });
    expect(() => parseSignUp({ email: "a@b.com", password: "1234567", nome: "Ana" })).toThrow("8");
    expect(() => parseSignUp({ email: "a@b.com", password: "12345678", nome: "A" })).toThrow(
      "nome",
    );
  });

  it("reenvio só precisa do e-mail", () => {
    expect(parseResend({ email: "A@B.com" })).toEqual({ email: "a@b.com" });
  });
});

describe("link de confirmação", () => {
  it("aceita token_hash ou refresh_token e recusa lixo", () => {
    expect(parseConfirmation({ tokenHash: "pkce_abc12345" })).toEqual({
      tokenHash: "pkce_abc12345",
    });
    expect(parseConfirmation({ refreshToken: "abcdefgh123" })).toEqual({
      refreshToken: "abcdefgh123",
    });
    expect(() => parseConfirmation({ tokenHash: "a b<script>" })).toThrow("inválido");
    expect(() => parseConfirmation({})).toThrow("inválido");
  });
});
