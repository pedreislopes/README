import { describe, expect, it } from "vitest";
import { montarResultados, type OfertaDaBusca } from "./resultados";

function oferta(
  id: string,
  productId: string,
  priceCents: number,
  baseQuantity: number,
  loja: { region?: string; featured?: boolean } = {},
): OfertaDaBusca {
  return {
    id,
    productId,
    priceCents,
    baseQuantity,
    tiersForCpf: false,
    tiers: [],
    store: { id: `loja-${id}`, region: loja.region ?? "Gama", featured: loja.featured ?? false },
  };
}

const cimento = { id: "cimento" };
const areia = { id: "areia" };

const ofertas = [
  oferta("c50-barato", "cimento", 3890, 50), // R$ 0,778/kg
  oferta("c25", "cimento", 2110, 25, { region: "Asa Norte" }), // R$ 0,844/kg
  oferta("c50-destaque", "cimento", 4400, 50, { featured: true, region: "Sobradinho" }), // R$ 0,88/kg
  oferta("areia-1", "areia", 14000, 1),
];

describe("montarResultados", () => {
  it("ordena por menor preço da embalagem", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco" });
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c25", "c50-barato", "c50-destaque"]);
  });

  it("ordena por menor preço por unidade padronizada (padrão do site)", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "unidade" });
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c50-barato", "c25", "c50-destaque"]);
  });

  it("na ordem padrão, o primeiro resultado é sempre o Melhor preço", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "unidade" });
    expect(r.grupos[0].ofertas[0].id).toBe(r.grupos[0].melhorPrecoId);
  });

  it("dá o selo Melhor preço pelo preço por unidade, não pelo preço da embalagem", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco" });
    expect(r.grupos[0].melhorPrecoId).toBe("c50-barato");
  });

  it("mostra o patrocinado quando a loja em destaque tem o produto", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco" });
    expect(r.patrocinado?.oferta.id).toBe("c50-destaque");
  });

  it("NÃO mostra patrocinado se a loja em destaque não tem o produto buscado", () => {
    const r = montarResultados([areia], ofertas, { ordem: "preco" });
    expect(r.patrocinado).toBeNull();
  });

  it("NÃO mostra patrocinado se o filtro de região esconde a loja", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco", regiao: "Asa Norte" });
    expect(r.patrocinado).toBeNull();
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c25"]);
  });

  it("aplica a faixa de preço e remove produtos sem ofertas", () => {
    const r = montarResultados([cimento, areia], ofertas, {
      ordem: "preco",
      precoMin: 3000,
      precoMax: 4000,
    });
    expect(r.grupos).toHaveLength(1);
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c50-barato"]);
  });
});
