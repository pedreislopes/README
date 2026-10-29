import { describe, expect, it } from "vitest";
import { planejarImportacaoCatalogo, textoResumoCatalogo, type ItemAtual, type TipoDoCatalogo } from "./importacao-catalogo";

const tipos: TipoDoCatalogo[] = [
  { id: "martelo-unha", name: "Martelo de unha 27 mm", specTemplate: "martelo", brandMatters: true },
  { id: "tinta-acrilica-18", name: "Tinta acrílica 18 L", specTemplate: "tinta", brandMatters: true },
];
const atuais: ItemAtual[] = [
  {
    id: "item-1",
    productId: "martelo-unha",
    brand: "Forja",
    model: "MU-27",
    ean: "2000000000015",
    packageLabel: "Unidade",
    baseQuantity: 1,
    specs: JSON.stringify({ peso_cabeca: 450, garantia_meses: 6 }),
  },
];
const cabecalho = ["tipo", "marca", "modelo", "codigo_barras", "embalagem", "qtd_na_embalagem", "carac_peso_cabeca", "carac_material_cabo", "carac_rendimento_m2", "carac_linha"];

describe("importação do catálogo de marca (administrador)", () => {
  it("código de barras novo cria; existente atualiza; em branco não apaga característica", () => {
    const plano = planejarImportacaoCatalogo(
      [
        cabecalho,
        ["martelo-unha", "Forja", "MU-27", "2000000000015", "Unidade", 1, "", "Madeira", "", ""],
        ["tinta-acrilica-18", "Cores", "Premium fosca", "2000000000022", "Lata 18 L", 18, "", "", "380", "premium"],
        ["martelo-unha", "Forja", "MU-27", "2000000000015", "Unidade", 1, "", "", "", ""],
      ],
      tipos,
      atuais,
    );
    expect(plano.erroGeral).toBeUndefined();
    expect(plano.linhas.map((l) => [l.linha, l.tipo])).toEqual([
      [2, "ALTERADO"],
      [3, "NOVO"],
      [4, "ERRO"], // repetido
    ]);
    expect(plano.linhas[0].mudancas).toEqual(["Material do cabo: Não informado → Madeira"]);
    expect(plano.linhas[0].dados?.specs).toEqual({ peso_cabeca: 450, garantia_meses: 6, material_cabo: "Madeira" });
    expect(plano.linhas[1].dados?.specs).toEqual({ rendimento_m2: 380, linha: "Premium" });
    expect(plano.linhas[2].erros[0]).toMatch(/Repetido/);
    expect(textoResumoCatalogo(plano.resumo)).toBe("1 produto novo, 1 produto atualizado, 1 erro");
  });

  it("aponta erros por linha: tipo, código de barras, quantidade e características", () => {
    const plano = planejarImportacaoCatalogo(
      [
        cabecalho,
        ["cimento-cp2", "X", "Y", "2000000000039", "Saco", 50, "", "", "", ""],
        ["martelo-unha", "Forja", "MU", "123", "Unidade", 0, "pesado", "Plástico", "", ""],
        ["tinta-acrilica-18", "Forja", "MU-27", "2000000000015", "Lata 18 L", 18, "", "", "", ""],
      ],
      tipos,
      atuais,
    );
    const erros = (n: number) => plano.linhas.find((l) => l.linha === n)!.erros.join(" | ");
    expect(erros(2)).toMatch(/Tipo "cimento-cp2" não existe ou não é de produto de marca/);
    expect(erros(3)).toMatch(/Código de barras "123" inválido/);
    expect(erros(3)).toMatch(/quantidade na embalagem/);
    expect(erros(3)).toMatch(/Peso da cabeça: "pesado" não é um número/);
    expect(erros(3)).toMatch(/Material do cabo: "Plástico" não é uma opção/);
    expect(erros(4)).toMatch(/já é de outro tipo de produto/);
  });

  it("erro geral sem as colunas obrigatórias", () => {
    expect(planejarImportacaoCatalogo([["marca", "modelo"]], tipos, atuais).erroGeral).toMatch(/tipo, codigo_barras, embalagem, qtd_na_embalagem/);
  });
});
