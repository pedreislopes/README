import { describe, expect, it } from "vitest";
import { MODELOS_CARACTERISTICAS, NAO_INFORMADO } from "@/config/caracteristicas";
import {
  custoPorM2Pintado,
  digitoEan,
  eanValido,
  formatarCaracteristica,
  lerCaracteristicas,
  linhasDaComparacao,
  maisBaratoPorMarca,
  marcasDasOfertas,
  normalizarEan,
  validarCaracteristicas,
  validarEscolha,
} from "./marcas";

describe("código de barras (EAN)", () => {
  it("confere o dígito verificador", () => {
    expect(eanValido("7891000315507")).toBe(true); // EAN-13 de exemplo
    expect(eanValido("7891000315508")).toBe(false); // último número errado
    expect(eanValido("96385074")).toBe(true); // EAN-8
    expect(eanValido("12345")).toBe(false);
    expect(eanValido("abc")).toBe(false);
  });

  it("aceita espaços e traços ao digitar; gera dígito para os dados de teste", () => {
    expect(normalizarEan("789 1000-315507")).toBe("7891000315507");
    expect(eanValido("200000000001" + digitoEan("200000000001"))).toBe(true);
  });
});

describe("características", () => {
  const martelo = MODELOS_CARACTERISTICAS.martelo;
  const tinta = MODELOS_CARACTERISTICAS.tinta;

  it("converte número com vírgula, sim/não e opção sem diferenciar acentos", () => {
    const r = validarCaracteristicas(tinta, { rendimento_m2: "380,5", lavavel: "Não", acabamento: "fosco", linha: "economica" });
    expect(r.erros).toEqual([]);
    expect(r.valores).toEqual({ rendimento_m2: 380.5, lavavel: false, acabamento: "Fosco", linha: "Econômica" });
  });

  it("campo vazio fica 'Não informado' (não é erro); valor inválido é erro claro", () => {
    const r = validarCaracteristicas(martelo, { peso_cabeca: "", material_cabo: "Plástico", comprimento: "abc", outro: "x" });
    expect(r.valores).toEqual({});
    expect(r.erros).toEqual([
      'Material do cabo: "Plástico" não é uma opção (Madeira, Fibra de vidro, Aço, Aço com empunhadura emborrachada).',
      'Comprimento: "abc" não é um número.',
    ]);
    expect(formatarCaracteristica(martelo.campos[0], undefined)).toBe(NAO_INFORMADO);
  });

  it("formata com unidade e sim/não", () => {
    expect(formatarCaracteristica(martelo.campos[0], 450)).toBe("450 g");
    expect(formatarCaracteristica(tinta.campos[2], true)).toBe("Sim");
    expect(formatarCaracteristica(tinta.campos[0], 380.5)).toBe("380,5 m²");
  });

  it("lê o JSON guardado sem quebrar", () => {
    expect(lerCaracteristicas('{"peso_cabeca":450}')).toEqual({ peso_cabeca: 450 });
    expect(lerCaracteristicas("estragado")).toEqual({});
    expect(lerCaracteristicas(null)).toEqual({});
  });
});

describe("tinta: custo por m² pintado", () => {
  it("preço ÷ rendimento", () => {
    expect(custoPorM2Pintado(38000, 380)).toBe(100); // R$ 380 / 380 m² = R$ 1,00 por m²
    expect(custoPorM2Pintado(38000, undefined)).toBeNull();
    expect(custoPorM2Pintado(38000, 0)).toBeNull();
  });
});

describe("marcas", () => {
  const o = (id: string, marca: string | null, priceCents: number, baseQuantity = 1) => ({ id, marca, priceCents, baseQuantity });
  const ofertas = [o("a1", "Alfa", 5000), o("a2", "Alfa", 4500), o("b1", "Beta", 4000), o("c1", "Gama", 9000, 2), o("s", null, 100)];

  it("mais barato de cada marca, da marca mais barata para a mais cara (por unidade)", () => {
    expect(maisBaratoPorMarca(ofertas).map((m) => [m.marca, m.oferta.id])).toEqual([
      ["Beta", "b1"],
      ["Alfa", "a2"],
      ["Gama", "c1"],
    ]);
  });

  it("lista as marcas para o filtro, sem repetir", () => {
    expect(marcasDasOfertas(ofertas)).toEqual(["Alfa", "Beta", "Gama"]);
  });
});

describe("comparação lado a lado", () => {
  it("de 2 a 3 produtos do mesmo tipo", () => {
    expect(validarEscolha([{ productId: "m" }])).toMatch(/pelo menos 2/);
    expect(validarEscolha([{ productId: "m" }, { productId: "m" }, { productId: "m" }, { productId: "m" }])).toMatch(/no máximo 3/);
    expect(validarEscolha([{ productId: "m" }, { productId: "t" }])).toMatch(/mesmo tipo/);
    expect(validarEscolha([{ productId: "m" }, { productId: "m" }])).toBeNull();
  });

  it("uma linha por característica; o que falta aparece como 'Não informado'", () => {
    const item = (id: string, caracteristicas: Record<string, number | string>) => ({
      id, productId: "m", marca: id, modelo: "X", caracteristicas, menorPreco: null,
    });
    const linhas = linhasDaComparacao(MODELOS_CARACTERISTICAS.martelo, [
      item("A", { peso_cabeca: 450, material_cabo: "Madeira" }),
      item("B", { peso_cabeca: 600 }),
    ]);
    expect(linhas[0]).toEqual({ rotulo: "Peso da cabeça", valores: ["450 g", "600 g"] });
    expect(linhas[1]).toEqual({ rotulo: "Material do cabo", valores: ["Madeira", NAO_INFORMADO] });
    expect(linhas.map((l) => l.rotulo)).toEqual(["Peso da cabeça", "Material do cabo", "Comprimento", "Garantia"]);
  });
});
