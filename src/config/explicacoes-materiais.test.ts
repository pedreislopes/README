import { describe, expect, it } from "vitest";
import { MATERIAIS } from "../../prisma/dados-teste";
import { CATEGORIAS } from "./constantes";
import { EXPLICACOES, GUIAS_CATEGORIA } from "./explicacoes-materiais";

const codigos = new Set(MATERIAIS.map((m) => m.id));

describe("Explicações dos materiais", () => {
  it("todo material dos dados de teste tem explicação", () => {
    const semExplicacao = MATERIAIS.filter((m) => !EXPLICACOES[m.id]).map((m) => m.id);
    expect(semExplicacao).toEqual([]);
  });

  it("toda explicação é de um material que existe", () => {
    expect(Object.keys(EXPLICACOES).filter((id) => !codigos.has(id))).toEqual([]);
  });

  it("textos curtos e com fonte, para o engenheiro conferir", () => {
    for (const [id, e] of Object.entries(EXPLICACOES)) {
      for (const texto of [e.oQueE, e.paraQue, e.quandoUsar]) {
        expect(texto.length, `${id}: "${texto}"`).toBeLessThanOrEqual(140);
        expect(texto.length, id).toBeGreaterThan(10);
      }
      expect(e.fonte.length, id).toBeGreaterThan(5);
      if (e.revisao.status === "REVISADO") {
        expect(e.revisao.por, id).toBeTruthy();
        expect(e.revisao.em, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe("Guias 'Qual escolher?'", () => {
  it("toda categoria com 2 ou mais materiais tem guia", () => {
    for (const c of CATEGORIAS) {
      const qtd = MATERIAIS.filter((m) => m.categoria === c).length;
      if (qtd >= 2) expect(GUIAS_CATEGORIA[c], c).toBeDefined();
    }
  });

  it("cada comparação usa materiais que existem, da mesma categoria", () => {
    for (const [categoria, guia] of Object.entries(GUIAS_CATEGORIA)) {
      for (const c of guia!.comparacoes) {
        expect(c.materiais.length, c.pergunta).toBeGreaterThanOrEqual(2);
        for (const id of c.materiais) {
          const m = MATERIAIS.find((x) => x.id === id);
          expect(m, `${categoria}: ${id}`).toBeDefined();
          expect(m!.categoria, id).toBe(categoria);
        }
      }
    }
  });
});
