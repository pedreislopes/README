import { describe, expect, it } from "vitest";
import { formatarReais, reaisParaCentavos } from "./dinheiro";

describe("dinheiro", () => {
  it("formata centavos como reais", () => {
    // O Intl usa um espaço especial (não separável) depois do "R$"
    expect(formatarReais(4090).replace(/\s/g, " ")).toBe("R$ 40,90");
    expect(formatarReais(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });

  it("converte o texto digitado em centavos", () => {
    expect(reaisParaCentavos("40,90")).toBe(4090);
    expect(reaisParaCentavos("R$ 1.234,56")).toBe(123456);
    expect(reaisParaCentavos("40.9")).toBe(4090);
    expect(reaisParaCentavos("33")).toBe(3300);
  });

  it("recusa valores inválidos", () => {
    expect(reaisParaCentavos("")).toBeNull();
    expect(reaisParaCentavos("abc")).toBeNull();
    expect(reaisParaCentavos("-5")).toBeNull();
  });
});
