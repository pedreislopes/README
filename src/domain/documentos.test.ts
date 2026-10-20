import { describe, expect, it } from "vitest";
import { cnpjValido, cpfValido, formatarCnpj, formatarCpf } from "./documentos";

describe("CPF", () => {
  it("aceita CPF válido, com ou sem pontuação", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });

  it("recusa dígito verificador errado, tamanho errado e números repetidos", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cpfValido("5299822472")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
  });

  it("formata", () => {
    expect(formatarCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("CNPJ", () => {
  it("aceita CNPJ válido, com ou sem pontuação", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado, tamanho errado e números repetidos", () => {
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("00.000.000/0000-00")).toBe(false);
  });

  it("formata", () => {
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});
