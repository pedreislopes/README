import { describe, expect, it } from "vitest";
import { escolherAnunciosEmRodizio, montarResultados, type OfertaDaBusca } from "./resultados";

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
    expect(r.destaque?.candidatas.map((o) => o.id)).toEqual(["c50-destaque"]);
  });

  it("NÃO mostra patrocinado se a loja em destaque não tem o produto buscado", () => {
    const r = montarResultados([areia], ofertas, { ordem: "preco" });
    expect(r.destaque).toBeNull();
  });

  it("NÃO mostra patrocinado se o filtro de região esconde a loja", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco", regiao: "Asa Norte" });
    expect(r.destaque).toBeNull();
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

describe("Oferta destaque com várias lojas", () => {
  const destaque = (id: string, priceCents: number) =>
    oferta(id, "cimento", priceCents, 50, { featured: true });

  it("mostra todas as lojas em destaque, da mais barata para a mais cara (por unidade)", () => {
    const r = montarResultados([cimento], [destaque("d3", 4500), destaque("d1", 4100), destaque("d2", 4300)], { ordem: "unidade" });
    expect(r.destaque?.candidatas.map((o) => o.id)).toEqual(["d1", "d2", "d3"]);
    expect(escolherAnunciosEmRodizio(r.destaque!.candidatas, 3, 7).map((o) => o.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("usa só a melhor oferta de cada loja (a loja não ocupa duas vagas)", () => {
    const a = { ...destaque("a50", 4000), store: { id: "loja-A", region: "Gama", featured: true } };
    const a25 = { ...oferta("a25", "cimento", 2300, 25), store: { id: "loja-A", region: "Gama", featured: true } };
    const r = montarResultados([cimento], [a, a25], { ordem: "unidade" });
    expect(r.destaque?.candidatas.map((o) => o.id)).toEqual(["a50"]);
  });

  it("com mais de 3 lojas, faz rodízio e cada uma aparece com a mesma frequência", () => {
    const candidatas = ["d1", "d2", "d3", "d4", "d5"].map((id, i) => destaque(id, 4000 + i * 100));
    const vezes = new Map<string, number>();
    for (let rodada = 0; rodada < 5 * 4; rodada++) {
      const escolhidas = escolherAnunciosEmRodizio(candidatas, 3, rodada);
      expect(escolhidas).toHaveLength(3);
      // Sempre mostradas da mais barata para a mais cara
      const precos = escolhidas.map((o) => o.priceCents);
      expect(precos).toEqual([...precos].sort((x, y) => x - y));
      for (const o of escolhidas) vezes.set(o.id, (vezes.get(o.id) ?? 0) + 1);
    }
    // 20 rodadas × 3 vagas = 60 aparições ÷ 5 lojas = 12 para cada uma
    expect([...vezes.values()]).toEqual([12, 12, 12, 12, 12]);
  });
});
