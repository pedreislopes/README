import { describe, expect, it } from "vitest";
import { PERDA_PADRAO, SERVICOS } from "@/config/calculadora";
import { MATERIAIS } from "../../prisma/dados-teste";
import {
  arredondarParaCima,
  calcularServico,
  escolherLojaUnica,
  escolherOfertaMaisBarata,
  type OfertaCandidata,
} from "./calculadora";

const servico = (id: string) => SERVICOS.find((s) => s.id === id)!;
const qtd = (r: ReturnType<typeof calcularServico>, produtoId: string) =>
  r.ok ? r.materiais.find((m) => m.material.produtoId === produtoId)?.exato : undefined;

describe("calculadora — serviços", () => {
  it("muro 10 m × 2 m: 20 m² → 25 tijolos/m² + 10% = 550 tijolos", () => {
    const r = calcularServico(servico("muro"), { comprimento: "10", altura: "2" }, PERDA_PADRAO);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.medida.valor).toBe(20);
    expect(r.medida.texto).toBe("Muro de alvenaria: 10 m × 2 m = 20 m²");
    expect(qtd(r, "tijolo-8-furos")).toBeCloseTo(550);
    const tijolo = r.materiais.find((m) => m.material.produtoId === "tijolo-8-furos")!;
    expect(tijolo.explicacao).toBe("20 m² × 25 tijolos/m² = 500 + 10% de perda = 550 tijolos");
    expect(qtd(r, "cimento-cp2")).toBeCloseTo(20 * 1.92 * 1.1); // 42,24 kg
    const areia = r.materiais.find((m) => m.material.produtoId === "areia-media")!;
    expect(areia.explicacao).toBe("20 m² × 0,0132 m³/m² = 0,264 + 10% de perda = 0,2904 m³");
  });

  it("aceita vírgula como decimal", () => {
    const r = calcularServico(servico("muro"), { comprimento: "7,5", altura: "2" }, PERDA_PADRAO);
    expect(r.ok && r.medida.valor).toBe(15);
  });

  it("contrapiso: área × espessura em cm vira m³", () => {
    const r = calcularServico(servico("contrapiso"), { area: "40", espessura: "5" }, PERDA_PADRAO);
    expect(r.ok && r.medida.valor).toBeCloseTo(2); // 40 × 0,05
    expect(qtd(r, "cimento-cp2")).toBeCloseTo(2 * 300 * 1.1); // 660 kg
    expect(qtd(r, "areia-media")).toBeCloseTo(2 * 1.15 * 1.1); // 2,53 m³
  });

  it("laje: concreto com cimento, areia grossa e brita", () => {
    const r = calcularServico(servico("laje"), { area: "30", espessura: "10" }, PERDA_PADRAO);
    expect(qtd(r, "cimento-cp2")).toBeCloseTo(3 * 350 * 1.1);
    expect(qtd(r, "brita-1")).toBeCloseTo(3 * 0.84 * 1.1);
  });

  it("piso: troca o material conforme o tipo escolhido", () => {
    const ceramico = calcularServico(servico("piso"), { area: "20", tipo: "ceramico" }, PERDA_PADRAO);
    const porcelanato = calcularServico(servico("piso"), { area: "20", tipo: "porcelanato" }, PERDA_PADRAO);
    expect(qtd(ceramico, "argamassa-ac1")).toBeCloseTo(110);
    expect(qtd(ceramico, "argamassa-ac3")).toBeUndefined();
    expect(qtd(porcelanato, "argamassa-ac3")).toBeCloseTo(176);
    expect(qtd(porcelanato, "porcelanato-60")).toBeCloseTo(22);
  });

  it("usa o valor padrão quando o campo vem vazio e recusa valores fora do limite", () => {
    const comPadrao = calcularServico(servico("contrapiso"), { area: "10" }, PERDA_PADRAO);
    expect(comPadrao.ok && comPadrao.medida.valor).toBeCloseTo(0.5); // espessura padrão 5 cm
    const errado = calcularServico(servico("muro"), { comprimento: "0", altura: "50" }, PERDA_PADRAO);
    expect(errado.ok).toBe(false);
    if (!errado.ok) {
      expect(Object.keys(errado.erros).sort()).toEqual(["altura", "comprimento"]);
      expect(errado.erros.comprimento).toMatch(/entre 0,1 e 1.000 m/);
    }
  });

  it("todo material da calculadora existe no catálogo", () => {
    const ids = new Set(MATERIAIS.map((m) => m.id));
    for (const s of SERVICOS) for (const m of s.materiais) expect(ids, `${s.id}: ${m.produtoId}`).toContain(m.produtoId);
  });

  it("todo coeficiente tem fonte indicada", () => {
    for (const s of SERVICOS) for (const m of s.materiais) expect(m.fonte.length, m.produtoId).toBeGreaterThan(10);
  });
});

describe("calculadora — arredondamento e escolha da oferta", () => {
  it("arredonda sempre para cima no passo vendido", () => {
    expect(arredondarParaCima(10.4, 1)).toBe(11); // sacos inteiros
    expect(arredondarParaCima(2.53, 0.5)).toBe(3); // m³ de 0,5 em 0,5
    expect(arredondarParaCima(2.2, 0.5)).toBe(2.5);
    expect(arredondarParaCima(0.55, 1)).toBe(1); // 550 tijolos = 1 milheiro
    expect(arredondarParaCima(2.0000000001, 1)).toBe(2); // erro de conta não vira 3
  });

  const oferta = (id: string, priceCents: number, baseQuantity: number, quantityStep = 1, tiers: OfertaCandidata["tiers"] = []): OfertaCandidata => ({
    id,
    priceCents,
    baseQuantity,
    quantityStep,
    tiersForCpf: false,
    tiers,
  });

  it("550 tijolos: avulso sai mais barato que 1 milheiro", () => {
    const milheiro = oferta("milheiro", 85000, 1000);
    const avulso = oferta("avulso", 98, 1);
    const e = escolherOfertaMaisBarata(550, [milheiro, avulso], "CPF")!;
    expect(e.oferta.id).toBe("avulso");
    expect(e.embalagens).toBe(550);
    expect(e.totalCents).toBe(53900);
  });

  it("4.800 tijolos: milheiro sai mais barato", () => {
    const e = escolherOfertaMaisBarata(4800, [oferta("milheiro", 85000, 1000), oferta("avulso", 98, 1)], "CPF")!;
    expect(e.oferta.id).toBe("milheiro");
    expect(e.embalagens).toBe(5);
    expect(e.embalagensExatas).toBeCloseTo(4.8);
  });

  it("cimento: 520 kg em sacos de 50 kg = 11 sacos (10,4 exatos)", () => {
    const e = escolherOfertaMaisBarata(520, [oferta("saco50", 3890, 50)], "CPF")!;
    expect(e.embalagens).toBe(11);
    expect(e.embalagensExatas).toBeCloseTo(10.4);
  });

  it("considera as faixas de atacado do CNPJ ao comparar lojas", () => {
    const semFaixa = oferta("A", 3900, 50);
    const comFaixa = oferta("B", 4000, 50, 1, [{ minQuantity: 50, priceCents: 3600 }]);
    expect(escolherOfertaMaisBarata(60 * 50, [semFaixa, comFaixa], "CNPJ")!.oferta.id).toBe("B");
    expect(escolherOfertaMaisBarata(60 * 50, [semFaixa, comFaixa], "CPF")!.oferta.id).toBe("A");
  });

  it("devolve null quando nenhuma loja vende o material", () => {
    expect(escolherOfertaMaisBarata(10, [], "CPF")).toBeNull();
  });
});

describe("calculadora — tudo numa loja só", () => {
  const of = (id: string, storeId: string, priceCents: number) => ({
    id,
    storeId,
    priceCents,
    baseQuantity: 1,
    quantityStep: 1,
    tiersForCpf: false,
    tiers: [],
  });
  const materiais = [
    { produtoId: "tijolo", exato: 100 },
    { produtoId: "cimento", exato: 2 },
  ];

  it("prefere a loja que tem todos os itens, mesmo que outra seja mais barata em parte", () => {
    const ofertas = new Map([
      ["tijolo", [of("t-A", "A", 90), of("t-B", "B", 100)]],
      ["cimento", [of("c-B", "B", 4000)]], // só a loja B tem cimento
    ]);
    const r = escolherLojaUnica(materiais, ofertas, "CPF")!;
    expect(r.storeId).toBe("B");
    expect(r.cobertos).toBe(2);
    expect(r.totalCents).toBe(100 * 100 + 2 * 4000);
  });

  it("entre lojas completas, escolhe a de menor total", () => {
    const ofertas = new Map([
      ["tijolo", [of("t-A", "A", 90), of("t-B", "B", 100)]],
      ["cimento", [of("c-A", "A", 4200), of("c-B", "B", 4000)]],
    ]);
    // A: 9000 + 8400 = 17400 · B: 10000 + 8000 = 18000
    expect(escolherLojaUnica(materiais, ofertas, "CPF")!.storeId).toBe("A");
  });

  it("se nenhuma loja tem tudo, usa a mais completa e marca o que falta", () => {
    const ofertas = new Map([
      ["tijolo", [of("t-A", "A", 90)]],
      ["cimento", [] as ReturnType<typeof of>[]],
    ]);
    const r = escolherLojaUnica(materiais, ofertas, "CPF")!;
    expect(r.storeId).toBe("A");
    expect(r.cobertos).toBe(1);
    expect(r.escolhas.get("cimento")).toBeNull();
  });
});
