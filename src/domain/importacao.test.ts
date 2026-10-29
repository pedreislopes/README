import { describe, expect, it } from "vitest";
import {
  chaveDaOferta,
  COLUNAS,
  decodificarCsv,
  lerCsv,
  planejarImportacao,
  textoDoResumo,
  type Celula,
  type ItemDeMarcaDoCatalogo,
  type MaterialDoCatalogo,
  type OfertaAtual,
} from "./importacao";

const catalogo: MaterialDoCatalogo[] = [
  { id: "cimento-cp2", name: "Cimento CP II-E 32", brandMatters: false },
  { id: "areia-media", name: "Areia média lavada", brandMatters: false },
  { id: "martelo-unha", name: "Martelo de unha 27 mm", brandMatters: true },
];

// Item do catálogo de marca (código de barras fictício e válido)
const EAN_MARTELO = "2000000000015";
const EAN_MARTELO_2 = "2000000000022";
const itensDeMarca: ItemDeMarcaDoCatalogo[] = [
  { id: "item-a", productId: "martelo-unha", brand: "Forja Cerrado", model: "MU-27", ean: EAN_MARTELO, packageLabel: "Unidade", baseQuantity: 1, active: true },
  { id: "item-b", productId: "martelo-unha", brand: "Aço Candango", model: "Pro 27", ean: EAN_MARTELO_2, packageLabel: "Unidade", baseQuantity: 1, active: true },
];

const atuais: OfertaAtual[] = [
  {
    id: "of-cimento",
    productId: "cimento-cp2",
    packageLabel: "Saco 50 kg",
    baseQuantity: 50,
    priceCents: 3890,
    brand: "Votoran",
    active: true,
    quantityStep: 1,
    tiersForCpf: false,
    tiers: [{ minQuantity: 50, priceCents: 3500 }],
  },
  {
    id: "of-areia",
    productId: "areia-media",
    packageLabel: "m³",
    baseQuantity: 1,
    priceCents: 14000,
    brand: null,
    active: true,
    quantityStep: 0.5,
    tiersForCpf: false,
    tiers: [],
  },
];

const cabecalho = COLUNAS.map((c) => c.titulo);
/** Monta uma linha a partir de um objeto { titulo: valor } */
const linha = (v: Record<string, Celula>) => cabecalho.map((t) => v[t] ?? "");

const cimento = { codigo: "cimento-cp2", embalagem: "Saco 50 kg", qtd_na_embalagem: 50, preco: "38,90", marca: "Votoran", faixa1_a_partir_de: 50, faixa1_preco: "35,00" };

describe("planejarImportacao", () => {
  it("separa preço alterado, produto novo, sem mudança e erro, linha por linha", () => {
    const plano = planejarImportacao(
      [
        cabecalho,
        linha({ ...cimento, preco: "39,90" }), // linha 2: preço
        linha({ codigo: "areia-media", embalagem: "m³", qtd_na_embalagem: 1, preco: 140, fracao_minima: "0,5" }), // 3: igual
        linha({ codigo_barras: EAN_MARTELO, preco: "49,90" }), // 4: novo (produto de marca pelo código de barras)
        linha({ codigo: "telha-xyz", embalagem: "Unidade", qtd_na_embalagem: 1, preco: "1" }), // 5: erro
      ],
      catalogo,
      atuais,
      itensDeMarca,
    );
    expect(plano.erroGeral).toBeUndefined();
    expect(plano.linhas.map((l) => [l.linha, l.tipo])).toEqual([
      [2, "PRECO"],
      [3, "SEM_MUDANCA"],
      [4, "NOVO"],
      [5, "ERRO"],
    ]);
    expect(plano.linhas[0].mudancas).toEqual(["Preço: R$ 38,90 → R$ 39,90"]);
    expect(plano.linhas[0].offerId).toBe("of-cimento");
    expect(plano.linhas[3].erros[0]).toMatch(/não existe no catálogo/);
    expect(plano.resumo).toEqual({ precosAlterados: 1, novos: 1, outrosAlterados: 0, semMudanca: 1, erros: 1 });
    expect(textoDoResumo(plano.resumo)).toBe("1 preço alterado, 1 produto novo, 1 sem mudança, 1 erro");
  });

  it("detecta outras alterações sem mudar o preço (marca, disponível, atacado)", () => {
    const plano = planejarImportacao(
      [cabecalho, linha({ ...cimento, marca: "Ciplan", disponivel: "não", faixa1_preco: "34,50" })],
      catalogo,
      atuais,
    );
    expect(plano.linhas[0].tipo).toBe("OUTROS");
    expect(plano.linhas[0].mudancas).toEqual([
      "Marca: Votoran → Ciplan",
      "Disponível: sim → não",
      "Atacado: 50+ por R$ 35,00 → 50+ por R$ 34,50",
    ]);
  });

  it("aponta erros com o número da linha e o motivo", () => {
    const plano = planejarImportacao(
      [
        cabecalho,
        linha({ ...cimento }),
        linha({ ...cimento, preco: "abc" }), // repetido + preço inválido
        linha({ codigo: "martelo-unha", embalagem: "Unidade", qtd_na_embalagem: 1, preco: "49,90" }), // produto de marca sem código de barras
        linha({ ...cimento, embalagem: "Saco 25 kg", qtd_na_embalagem: 25, preco: "21", faixa1_a_partir_de: 10, faixa1_preco: "" }),
        linha({ ...cimento, embalagem: "Saco 40 kg", qtd_na_embalagem: 40, preco: "32", faixa1_preco: "33" }),
        linha({ codigo: "areia-media", embalagem: "m³ (meio)", qtd_na_embalagem: 1, preco: 70, disponivel: "talvez" }),
      ],
      catalogo,
      atuais,
    );
    const erro = (n: number) => plano.linhas.find((l) => l.linha === n)!.erros.join(" | ");
    expect(erro(3)).toMatch(/Preço "abc" inválido/);
    expect(erro(3)).toMatch(/Repetido: .* linha 2/);
    expect(erro(4)).toMatch(/Produto de marca: informe o código de barras/);
    expect(erro(5)).toMatch(/Faixa 1 de atacado incompleta/);
    expect(erro(6)).toMatch(/preço de cada faixa deve ser menor/);
    expect(erro(7)).toMatch(/use sim ou não/);
    expect(plano.resumo.erros).toBe(5);
  });

  it("aceita números do Excel, R$, milhar e embalagem com espaços/maiúsculas diferentes", () => {
    const plano = planejarImportacao(
      [cabecalho, linha({ ...cimento, embalagem: "saco  50 KG", preco: "R$ 1.038,90", faixa1_preco: 35 })],
      catalogo,
      atuais,
    );
    expect(plano.linhas[0].tipo).toBe("PRECO");
    expect(plano.linhas[0].dados?.priceCents).toBe(103890);
    expect(plano.linhas[0].dados?.tiers).toEqual([{ minQuantity: 50, priceCents: 3500 }]);
  });

  it("cabeçalho em qualquer ordem, com acentos e maiúsculas; linhas vazias são ignoradas", () => {
    const plano = planejarImportacao(
      [
        ["Preço", "Código", "Embalagem", "Qtd na embalagem"],
        ["39,90", "cimento-cp2", "Saco 50 kg", "50"],
        ["", "", "", ""],
      ],
      catalogo,
      atuais,
    );
    expect(plano.linhas).toHaveLength(1);
    // Sem as colunas opcionais: disponível = sim, sem atacado
    expect(plano.linhas[0].mudancas).toContain("Atacado: 50+ por R$ 35,00 → sem atacado");
  });

  it("erro geral quando falta coluna obrigatória ou a planilha está vazia", () => {
    expect(planejarImportacao([["codigo", "embalagem"]], catalogo, atuais).erroGeral).toMatch(/Faltam colunas.*qtd_na_embalagem, preco/);
    expect(planejarImportacao([], catalogo, atuais).erroGeral).toMatch(/vazia/);
    expect(planejarImportacao([cabecalho], catalogo, atuais).erroGeral).toMatch(/nenhum produto/);
  });
});

describe("produtos de marca pelo código de barras", () => {
  const martelo: OfertaAtual = {
    id: "of-martelo", productId: "martelo-unha", packageLabel: "Unidade", baseQuantity: 1, priceCents: 4990,
    brand: "Forja Cerrado", active: true, quantityStep: 1, tiersForCpf: false, tiers: [], catalogItemId: "item-a",
  };

  it("basta o código de barras e o preço: marca, modelo e embalagem vêm do catálogo", () => {
    const plano = planejarImportacao(
      [["codigo_barras", "preco"], [EAN_MARTELO, "52,90"], [EAN_MARTELO_2, "59,90"]],
      catalogo,
      [martelo],
      itensDeMarca,
    );
    expect(plano.erroGeral).toBeUndefined();
    expect(plano.linhas.map((l) => [l.tipo, l.nome])).toEqual([
      ["PRECO", "Martelo de unha 27 mm — Forja Cerrado MU-27"],
      ["NOVO", "Martelo de unha 27 mm — Aço Candango Pro 27"],
    ]);
    expect(plano.linhas[0].offerId).toBe("of-martelo");
    expect(plano.linhas[1].dados).toMatchObject({ catalogItemId: "item-b", productId: "martelo-unha", packageLabel: "Unidade", brand: "Aço Candango" });
  });

  it("aceita o código com espaços; aponta código inválido, fora do catálogo ou do material errado", () => {
    const plano = planejarImportacao(
      [
        ["codigo", "codigo_barras", "preco"],
        ["", "2000 0000 0001 5", "50"],
        ["", "2000000000016", "50"],
        ["", "2000000000039", "50"],
        ["cimento-cp2", EAN_MARTELO_2, "50"],
      ],
      catalogo,
      [],
      itensDeMarca,
    );
    const erro = (n: number) => plano.linhas.find((l) => l.linha === n)!.erros.join(" | ");
    expect(plano.linhas.find((l) => l.linha === 2)!.tipo).toBe("NOVO");
    expect(erro(3)).toMatch(/inválido: confira os números/);
    expect(erro(4)).toMatch(/ainda não está no catálogo Solid. Use "Sugerir material"/);
    expect(erro(5)).toMatch(/é de "martelo-unha", mas a coluna codigo diz "cimento-cp2"/);
  });

  it("dois modelos de marca com a mesma embalagem são produtos diferentes", () => {
    expect(chaveDaOferta({ productId: "m", packageLabel: "Unidade", catalogItemId: "a" })).not.toBe(
      chaveDaOferta({ productId: "m", packageLabel: "Unidade", catalogItemId: "b" }),
    );
  });
});

describe("CSV", () => {
  it("lê ponto e vírgula, aspas e quebras de linha do Windows", () => {
    expect(lerCsv('codigo;preco\r\n"cimento;cp2";"38,90"\r\nareia;"tem ""aspas"""\r\n')).toEqual([
      ["codigo", "preco"],
      ["cimento;cp2", "38,90"],
      ["areia", 'tem "aspas"'],
    ]);
  });

  it("lê vírgula como separador quando é o caso", () => {
    expect(lerCsv("codigo,preco\ncimento,38.90")).toEqual([
      ["codigo", "preco"],
      ["cimento", "38.90"],
    ]);
  });

  it("entende arquivo salvo pelo Excel em Windows-1252 (acentos)", () => {
    const bytes = new Uint8Array([0x6d, 0xb3]); // "m³" em Windows-1252
    expect(decodificarCsv(bytes)).toBe("m³");
    expect(decodificarCsv(new TextEncoder().encode("m³"))).toBe("m³");
  });
});
