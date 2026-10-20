import { describe, expect, it } from "vitest";
import { validarCadastro, type DadosCadastro } from "./cadastro";

const base: DadosCadastro = {
  tipo: "CPF",
  nome: "  Ana   Oliveira ",
  documento: "529.982.247-25",
  email: " Ana@Teste.COM ",
  telefone: "(61) 99812-3344",
  senha: "obra2026",
  confirmacao: "obra2026",
  aceiteTermos: true,
};

describe("validarCadastro", () => {
  it("aceita um cadastro CPF correto e limpa os dados", () => {
    const r = validarCadastro(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.dados).toMatchObject({
        nome: "Ana Oliveira",
        documento: "52998224725",
        email: "ana@teste.com",
        telefone: "61998123344",
      });
    }
  });

  it("exige CNPJ para empresa e lojista", () => {
    const r = validarCadastro({ ...base, tipo: "CNPJ" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.documento).toMatch(/CNPJ inválido/);

    expect(validarCadastro({ ...base, tipo: "CNPJ", documento: "11.222.333/0001-81" }).ok).toBe(true);
  });

  it("recusa CPF com dígito errado", () => {
    const r = validarCadastro({ ...base, documento: "529.982.247-26" });
    expect(r.ok).toBe(false);
  });

  it("exige o aceite dos termos (LGPD)", () => {
    const r = validarCadastro({ ...base, aceiteTermos: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.aceiteTermos).toBeDefined();
  });

  it("exige senha com 8+ caracteres, letra e número, e confirmação igual", () => {
    const curta = validarCadastro({ ...base, senha: "a1", confirmacao: "a1" });
    const soLetras = validarCadastro({ ...base, senha: "obraobra", confirmacao: "obraobra" });
    const diferente = validarCadastro({ ...base, confirmacao: "outra123" });
    for (const r of [curta, soLetras]) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.erros.senha).toBeDefined();
    }
    expect(diferente.ok).toBe(false);
    if (!diferente.ok) expect(diferente.erros.confirmacao).toBeDefined();
  });

  it("exige os dados da loja para lojista", () => {
    const semLoja = validarCadastro({ ...base, tipo: "LOJISTA", documento: "11222333000181" });
    expect(semLoja.ok).toBe(false);
    if (!semLoja.ok) expect(Object.keys(semLoja.erros).sort()).toEqual(["endereco", "nomeLoja", "regiao"]);

    const completo = validarCadastro({
      ...base,
      tipo: "LOJISTA",
      documento: "11222333000181",
      nomeLoja: "Depósito Exemplo",
      regiao: "Gama",
      endereco: "Quadra 1, Lote 2",
    });
    expect(completo.ok).toBe(true);
    if (completo.ok) expect(completo.dados.loja?.regiao).toBe("Gama");
  });
});
