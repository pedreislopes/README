import { describe, expect, it } from "vitest";
import {
  centavosParaCsv,
  comissaoEfetiva,
  gerarCsv,
  intervaloDoPeriodo,
  montarMotivo,
  podeCancelar,
  resumirPedidos,
  validarComissao,
} from "./pedidos";

describe("cancelamento", () => {
  it("cliente e loja cancelam só antes de separar", () => {
    for (const quem of ["CLIENTE", "LOJA"] as const) {
      expect(podeCancelar("NOVO", quem)).toBe(true);
      expect(podeCancelar("RECEBIDO", quem)).toBe(true);
      expect(podeCancelar("SEPARADO", quem)).toBe(false);
      expect(podeCancelar("ENTREGUE", quem)).toBe(false);
    }
  });

  it("administrador cancela a qualquer momento, mas não cancela duas vezes", () => {
    expect(podeCancelar("SEPARADO", "ADMIN")).toBe(true);
    expect(podeCancelar("ENTREGUE", "ADMIN")).toBe(true);
    expect(podeCancelar("CANCELADO", "ADMIN")).toBe(false);
  });

  it("exige motivo; 'Outro' exige explicação", () => {
    expect(montarMotivo("", "")).toEqual({ erro: expect.any(String) });
    expect(montarMotivo("Sem estoque", "")).toEqual({ motivo: "Sem estoque" });
    expect(montarMotivo("Sem estoque", "cimento acabou")).toEqual({ motivo: "Sem estoque — cimento acabou" });
    expect(montarMotivo("Outro", "")).toEqual({ erro: expect.any(String) });
    expect(montarMotivo("Outro", "Cliente pediu outra cor")).toEqual({ motivo: "Cliente pediu outra cor" });
  });
});

describe("comissão e relatório", () => {
  const pedidos = [
    { status: "ENTREGUE", subtotalCents: 100_000, commissionCents: 3_000 },
    { status: "NOVO", subtotalCents: 50_000, commissionCents: 2_500 },
    { status: "CANCELADO", subtotalCents: 80_000, commissionCents: 4_000 },
  ];

  it("pedido cancelado não gera comissão", () => {
    expect(comissaoEfetiva(pedidos[2])).toBe(0);
    expect(comissaoEfetiva(pedidos[0])).toBe(3_000);
  });

  it("totais ignoram cancelados", () => {
    expect(resumirPedidos(pedidos)).toEqual({ pedidos: 2, cancelados: 1, vendidoCents: 150_000, comissaoCents: 5_500 });
  });

  it("valida a comissão da loja", () => {
    expect(validarComissao(3.5)).toBeNull();
    expect(validarComissao(0)).toBeNull();
    expect(validarComissao(-1)).not.toBeNull();
    expect(validarComissao(51)).not.toBeNull();
    expect(validarComissao(3.555)).not.toBeNull();
  });
});

describe("período no horário de Brasília", () => {
  it("vai do início do primeiro dia ao fim do último", () => {
    const r = intervaloDoPeriodo("2026-10-01", "2026-10-31");
    expect(r.gte?.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(r.lte?.toISOString()).toBe("2026-11-01T02:59:59.999Z");
  });

  it("ignora datas vazias ou inválidas", () => {
    expect(intervaloDoPeriodo("", "abc")).toEqual({});
  });
});

describe("planilha CSV", () => {
  it("usa ; e protege textos com aspas e ponto e vírgula", () => {
    const csv = gerarCsv([
      ["Loja", "Valor"],
      ['Depósito "Bom; Preço"', centavosParaCsv(123456)],
    ]);
    expect(csv).toBe('﻿Loja;Valor\r\n"Depósito ""Bom; Preço""";1234,56\r\n');
  });
});
