import { describe, expect, it } from "vitest";
import { montarCarrinho } from "./carrinho";
import { calcularComissao } from "./comissao";
import { calcularItem, fotoDoPreco, precoNaQuantidade, type OfertaPrecificavel } from "./precos";
import { ajustarAoPasso, nomeDaEmbalagem, validarQuantidade } from "./quantidades";

// Exemplo do pedido: 1–49 sacos a R$ 40; 50–199 a R$ 36; 200+ a R$ 33
const cimento: OfertaPrecificavel = {
  priceCents: 4000,
  baseQuantity: 50,
  tiersForCpf: false,
  tiers: [
    { minQuantity: 200, priceCents: 3300 },
    { minQuantity: 50, priceCents: 3600 },
  ],
};
const PERTO = 0.7;

describe("faixas de preço", () => {
  it("aplica a faixa certa conforme a quantidade (CNPJ)", () => {
    expect(precoNaQuantidade(cimento, "CNPJ", 1).unitCents).toBe(4000);
    expect(precoNaQuantidade(cimento, "CNPJ", 49).unitCents).toBe(4000);
    expect(precoNaQuantidade(cimento, "CNPJ", 50).unitCents).toBe(3600);
    expect(precoNaQuantidade(cimento, "CNPJ", 199).unitCents).toBe(3600);
    expect(precoNaQuantidade(cimento, "CNPJ", 200).unitCents).toBe(3300);
    expect(precoNaQuantidade(cimento, "CNPJ", 5000).unitCents).toBe(3300);
  });

  it("CPF paga o preço normal quando as faixas são só para CNPJ", () => {
    expect(precoNaQuantidade(cimento, "CPF", 300).unitCents).toBe(4000);
    expect(precoNaQuantidade(cimento, null, 300).unitCents).toBe(4000);
  });

  it("CPF usa as faixas quando a loja liberou", () => {
    expect(precoNaQuantidade({ ...cimento, tiersForCpf: true }, "CPF", 60).unitCents).toBe(3600);
  });

  it("calcula total e economia", () => {
    const c = calcularItem(cimento, "CNPJ", 60, PERTO);
    expect(c.totalCents).toBe(60 * 3600);
    expect(c.economiaCents).toBe(60 * 400); // R$ 4,00 a menos por saco
  });

  it("aceita quantidades com fração (areia em m³)", () => {
    const areia: OfertaPrecificavel = { priceCents: 14000, baseQuantity: 1, tiersForCpf: false, tiers: [] };
    expect(calcularItem(areia, "CPF", 2.5, PERTO).totalCents).toBe(35000);
  });
});

describe("incentivo da próxima faixa", () => {
  it("mostra quando está perto: 42 sacos -> faltam 8 para R$ 36", () => {
    const { proximaFaixa } = calcularItem(cimento, "CNPJ", 42, PERTO);
    expect(proximaFaixa).toEqual({
      faltam: 8,
      minQuantity: 50,
      unitCents: 3600,
      economiaCents: 50 * 400, // pagar 50 sacos a R$ 36 em vez de R$ 40
    });
  });

  it("não mostra quando ainda está longe", () => {
    expect(calcularItem(cimento, "CNPJ", 10, PERTO).proximaFaixa).toBeNull();
  });

  it("aponta a faixa seguinte quando já está numa faixa", () => {
    const { proximaFaixa } = calcularItem(cimento, "CNPJ", 150, PERTO);
    expect(proximaFaixa?.minQuantity).toBe(200);
    expect(proximaFaixa?.economiaCents).toBe(200 * 300);
  });

  it("não mostra para CPF quando as faixas são só de CNPJ", () => {
    expect(calcularItem(cimento, "CPF", 45, PERTO).proximaFaixa).toBeNull();
  });
});

describe("comissão", () => {
  it("calcula a % sobre o subtotal, arredondando o centavo", () => {
    expect(calcularComissao(100_000, 3)).toBe(3_000);
    expect(calcularComissao(100_000, 0)).toBe(0);
    expect(calcularComissao(12_345, 5)).toBe(617); // 617,25 -> 617
    expect(calcularComissao(99_999, 4.5)).toBe(4_500); // 4499,955 -> 4500
  });

  it("recusa percentuais impossíveis", () => {
    expect(() => calcularComissao(1000, -1)).toThrow();
    expect(() => calcularComissao(1000, 101)).toThrow();
  });
});

describe("montarCarrinho", () => {
  const lojaA = { id: "A", status: "APROVADA", commissionPercent: 3 };
  const lojaB = { id: "B", status: "APROVADA", commissionPercent: 0 };
  const item = (id: string, oferta: OfertaPrecificavel, loja: typeof lojaA, quantity: number, foto?: string) => ({
    id,
    quantity,
    priceSnapshot: foto ?? fotoDoPreco(oferta),
    offer: { ...oferta, id: `o-${id}`, active: true, store: loja },
  });
  const areia: OfertaPrecificavel = { priceCents: 14000, baseQuantity: 1, tiersForCpf: false, tiers: [] };

  it("separa por loja e soma subtotal, economia e comissão", () => {
    const c = montarCarrinho([item("1", cimento, lojaA, 50), item("2", areia, lojaB, 2.5)], "CNPJ", PERTO);
    expect(c.lojas.map((g) => g.loja.id)).toEqual(["A", "B"]);
    expect(c.lojas[0].subtotalCents).toBe(180_000);
    expect(c.lojas[0].economiaCents).toBe(20_000);
    expect(c.lojas[0].comissaoCents).toBe(5_400);
    expect(c.lojas[1].comissaoCents).toBe(0);
    expect(c.totalCents).toBe(215_000);
  });

  it("avisa quando o preço mudou desde que o item entrou no carrinho", () => {
    const fotoAntiga = fotoDoPreco({ ...cimento, priceCents: 3800 });
    const c = montarCarrinho([item("1", cimento, lojaA, 10, fotoAntiga)], "CPF", PERTO);
    expect(c.precosMudaram).toBe(1);
    expect(c.lojas[0].itens[0].precoMudou).toEqual({ antesUnitCents: 3800, agoraUnitCents: 4000 });
  });

  it("não avisa se a mudança não afeta o preço desta quantidade", () => {
    // A loja mudou só a faixa de 200+, e o cliente leva 10 sacos
    const fotoAntiga = fotoDoPreco({ ...cimento, tiers: [{ minQuantity: 200, priceCents: 3000 }, cimento.tiers[1]] });
    const c = montarCarrinho([item("1", cimento, lojaA, 10, fotoAntiga)], "CNPJ", PERTO);
    expect(c.precosMudaram).toBe(0);
  });

  it("marca indisponível e não soma quando a loja saiu do ar", () => {
    const fora = { id: "C", status: "BLOQUEADA", commissionPercent: 5 };
    const c = montarCarrinho([item("1", areia, fora, 1)], "CPF", PERTO);
    expect(c.indisponiveis).toBe(1);
    expect(c.totalCents).toBe(0);
  });
});

describe("quantidades", () => {
  it("cimento só inteiro; areia de 0,5 em 0,5", () => {
    expect(validarQuantidade(3, 1)).toBeNull();
    expect(validarQuantidade(2.5, 1)).toMatch(/inteiras/);
    expect(validarQuantidade(0.5, 0.5)).toBeNull();
    expect(validarQuantidade(1.3, 0.5)).toMatch(/0,5 em 0,5/);
    expect(validarQuantidade(0, 1)).toMatch(/maior que zero/);
  });

  it("ajusta ao passo", () => {
    expect(ajustarAoPasso(1.3, 0.5)).toBe(1.5);
    expect(ajustarAoPasso(0, 1)).toBe(1);
  });

  it("escreve o nome da embalagem no plural", () => {
    expect(nomeDaEmbalagem("Saco 50 kg", 8)).toBe("sacos");
    expect(nomeDaEmbalagem("Saco 50 kg", 1)).toBe("saco");
    expect(nomeDaEmbalagem("m³", 2)).toBe("m³");
    expect(nomeDaEmbalagem("Painel 2x3 m", 3)).toBe("painéis");
    expect(nomeDaEmbalagem("Milheiro", 2)).toBe("milheiros");
  });
});
