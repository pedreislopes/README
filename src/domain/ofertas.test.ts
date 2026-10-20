import { describe, expect, it } from "vitest";
import { PROXIMO_STATUS, reajustarPreco, validarOferta, validarPercentual, type DadosOferta } from "./ofertas";

const base: DadosOferta = {
  productId: "cimento-cp2",
  packageLabel: "Saco 50 kg",
  baseQuantity: 50,
  priceCents: 4000,
  quantityStep: 1,
  tiers: [
    { minQuantity: 50, priceCents: 3600 },
    { minQuantity: 200, priceCents: 3300 },
  ],
};

describe("validarOferta", () => {
  it("aceita um produto correto", () => {
    expect(validarOferta(base)).toEqual({});
  });

  it("exige material, embalagem, quantidade e preço", () => {
    const e = validarOferta({ ...base, productId: "", packageLabel: " ", baseQuantity: 0, priceCents: 0 });
    expect(Object.keys(e).sort()).toEqual(["baseQuantity", "packageLabel", "priceCents", "productId"]);
  });

  it("recusa faixa mais cara que o preço normal ou que a faixa anterior", () => {
    expect(validarOferta({ ...base, tiers: [{ minQuantity: 50, priceCents: 4100 }] }).tiers).toBeDefined();
    expect(
      validarOferta({ ...base, tiers: [{ minQuantity: 50, priceCents: 3300 }, { minQuantity: 200, priceCents: 3600 }] }).tiers,
    ).toBeDefined();
  });

  it("recusa faixa a partir de 1 ou repetida", () => {
    expect(validarOferta({ ...base, tiers: [{ minQuantity: 1, priceCents: 3900 }] }).tiers).toBeDefined();
    expect(
      validarOferta({ ...base, tiers: [{ minQuantity: 50, priceCents: 3600 }, { minQuantity: 50, priceCents: 3500 }] }).tiers,
    ).toBeDefined();
  });
});

describe("reajuste em massa", () => {
  it("aplica aumento e desconto em %", () => {
    expect(reajustarPreco(4000, 5)).toBe(4200);
    expect(reajustarPreco(4000, -10)).toBe(3600);
    expect(reajustarPreco(3890, 3)).toBe(4007); // 40,067 -> R$ 40,07
  });

  it("valida a porcentagem", () => {
    expect(validarPercentual(5)).toBeNull();
    expect(validarPercentual(0)).not.toBeNull();
    expect(validarPercentual(-95)).not.toBeNull();
    expect(validarPercentual(150)).not.toBeNull();
  });
});

describe("status do pedido", () => {
  it("segue a ordem Novo → Recebido → Separado → Entregue", () => {
    expect(PROXIMO_STATUS.NOVO).toBe("RECEBIDO");
    expect(PROXIMO_STATUS.RECEBIDO).toBe("SEPARADO");
    expect(PROXIMO_STATUS.SEPARADO).toBe("ENTREGUE");
    expect(PROXIMO_STATUS.ENTREGUE).toBeNull();
  });
});
