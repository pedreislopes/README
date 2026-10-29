import { describe, expect, it } from "vitest";
import { escolherAnuncios, escolherAnunciosEmRodizio, montarResultados, type OfertaDaBusca } from "./resultados";

function oferta(
  id: string,
  productId: string,
  priceCents: number,
  baseQuantity: number,
  loja: { region?: string; plano?: "NENHUM" | "DESTAQUE" | "PREMIUM"; storeId?: string } = {},
): OfertaDaBusca {
  return {
    id,
    productId,
    priceCents,
    baseQuantity,
    tiersForCpf: false,
    tiers: [],
    store: { id: loja.storeId ?? `loja-${id}`, region: loja.region ?? "Gama", adPlan: loja.plano ?? "NENHUM" },
  };
}

const cimento = { id: "cimento" };
const areia = { id: "areia" };

const ofertas = [
  oferta("c50-barato", "cimento", 3890, 50), // R$ 0,778/kg
  oferta("c25", "cimento", 2110, 25, { region: "Asa Norte" }), // R$ 0,844/kg
  oferta("c50-destaque", "cimento", 4400, 50, { plano: "DESTAQUE", region: "Sobradinho" }), // R$ 0,88/kg
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
    expect(r.destaque?.destaque.map((o) => o.id)).toEqual(["c50-destaque"]);
  });

  it("NÃO mostra patrocinado se a loja em destaque não tem o produto buscado", () => {
    const r = montarResultados([areia], ofertas, { ordem: "preco" });
    expect(r.destaque).toBeNull();
  });

  it("NÃO mostra patrocinado se o filtro de região esconde a loja", () => {
    const r = montarResultados([cimento], ofertas, { ordem: "preco", regioes: ["Asa Norte"] });
    expect(r.destaque).toBeNull();
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c25"]);
  });

  it("filtra por grupo de regiões (ex.: todo o Entorno)", () => {
    const comEntorno = [...ofertas, oferta("c50-valparaiso", "cimento", 3990, 50, { region: "Valparaíso de Goiás" })];
    const r = montarResultados([cimento], comEntorno, { ordem: "unidade", regioes: ["Valparaíso de Goiás", "Luziânia"] });
    expect(r.grupos[0].ofertas.map((o) => o.id)).toEqual(["c50-valparaiso"]);
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
  const destaque = (id: string, priceCents: number) => oferta(id, "cimento", priceCents, 50, { plano: "DESTAQUE" });

  it("mostra todas as lojas em destaque, da mais barata para a mais cara (por unidade)", () => {
    const r = montarResultados([cimento], [destaque("d3", 4500), destaque("d1", 4100), destaque("d2", 4300)], { ordem: "unidade" });
    expect(r.destaque?.destaque.map((o) => o.id)).toEqual(["d1", "d2", "d3"]);
    expect(escolherAnunciosEmRodizio(r.destaque!.destaque, 3, 7).map((o) => o.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("usa só a melhor oferta de cada loja (a loja não ocupa duas vagas)", () => {
    const a = oferta("a50", "cimento", 4000, 50, { plano: "DESTAQUE", storeId: "loja-A" });
    const a25 = oferta("a25", "cimento", 2300, 25, { plano: "DESTAQUE", storeId: "loja-A" });
    const r = montarResultados([cimento], [a, a25], { ordem: "unidade" });
    expect(r.destaque?.destaque.map((o) => o.id)).toEqual(["a50"]);
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

describe("Planos Premium e Destaque", () => {
  const anuncio = (id: string, priceCents: number, plano: "DESTAQUE" | "PREMIUM") =>
    oferta(id, "cimento", priceCents, 50, { plano });
  const ids = (l: { oferta: OfertaDaBusca; plano: string }[]) => l.map((a) => `${a.plano[0]}:${a.oferta.id}`);

  it("separa as lojas por plano, cada grupo da mais barata para a mais cara", () => {
    const r = montarResultados(
      [cimento],
      [anuncio("d1", 4000, "DESTAQUE"), anuncio("p2", 4600, "PREMIUM"), anuncio("p1", 4500, "PREMIUM"), anuncio("d2", 4100, "DESTAQUE")],
      { ordem: "unidade" },
    );
    expect(r.destaque?.premium.map((o) => o.id)).toEqual(["p1", "p2"]);
    expect(r.destaque?.destaque.map((o) => o.id)).toEqual(["d1", "d2"]);
  });

  it("Premium vem primeiro, mesmo mais caro; vagas que sobram vão para o Destaque", () => {
    const premium = [anuncio("p1", 4500, "PREMIUM")];
    const destaque = [anuncio("d1", 4000, "DESTAQUE"), anuncio("d2", 4100, "DESTAQUE"), anuncio("d3", 4200, "DESTAQUE")];
    // 1 Premium + 2 vagas para 3 lojas Destaque (rodízio entre elas)
    expect(ids(escolherAnuncios(premium, destaque, 3, 0, 0))).toEqual(["P:p1", "D:d1", "D:d2"]);
    expect(ids(escolherAnuncios(premium, destaque, 3, 0, 1))).toEqual(["P:p1", "D:d2", "D:d3"]);
    expect(ids(escolherAnuncios(premium, destaque, 3, 0, 2))).toEqual(["P:p1", "D:d1", "D:d3"]);
  });

  it("com 3 ou mais Premium, as lojas Destaque não entram", () => {
    const premium = ["p1", "p2", "p3", "p4"].map((id, i) => anuncio(id, 4000 + i * 100, "PREMIUM"));
    const destaque = [anuncio("d1", 3000, "DESTAQUE")];
    const vezes = new Map<string, number>();
    for (let rodada = 0; rodada < 4; rodada++) {
      const escolhidos = escolherAnuncios(premium, destaque, 3, rodada, 0);
      expect(escolhidos.every((a) => a.plano === "PREMIUM")).toBe(true);
      for (const a of escolhidos) vezes.set(a.oferta.id, (vezes.get(a.oferta.id) ?? 0) + 1);
    }
    // Rodízio justo entre as 4 Premium: 4 rodadas × 3 vagas ÷ 4 lojas = 3 vezes cada
    expect([...vezes.values()]).toEqual([3, 3, 3, 3]);
  });

  it("rodízio justo dentro do Destaque quando sobram poucas vagas", () => {
    const premium = [anuncio("p1", 4500, "PREMIUM"), anuncio("p2", 4600, "PREMIUM")];
    const destaque = ["d1", "d2", "d3"].map((id, i) => anuncio(id, 4000 + i * 100, "DESTAQUE"));
    const vezes = new Map<string, number>();
    for (let rodada = 0; rodada < 3; rodada++) {
      const doDestaque = escolherAnuncios(premium, destaque, 3, 0, rodada).filter((a) => a.plano === "DESTAQUE");
      expect(doDestaque).toHaveLength(1); // sobra 1 vaga
      for (const a of doDestaque) vezes.set(a.oferta.id, (vezes.get(a.oferta.id) ?? 0) + 1);
    }
    expect([...vezes.values()]).toEqual([1, 1, 1]);
  });
});
