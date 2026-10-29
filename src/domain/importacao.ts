// =============================================================================
// Importação de produtos por planilha (painel do lojista)
// =============================================================================
// O lojista baixa um modelo (Excel ou CSV), preenche e envia. Antes de gravar,
// mostramos o que vai mudar, linha por linha:
//   - NOVO:        material do catálogo que a loja ainda não vende (nessa embalagem);
//   - PRECO:       o preço normal mudou (pode ter outras mudanças junto);
//   - OUTROS:      só outras informações mudaram (marca, disponível, atacado…);
//   - SEM_MUDANCA: igual ao que já está cadastrado;
//   - ERRO:        a linha tem um problema e NÃO será gravada.
// Produtos que não estão na planilha continuam como estão (nada é apagado).
//
// Cada produto da loja é identificado pelo CÓDIGO do material + EMBALAGEM.
// =============================================================================

import { eanValido, normalizarEan } from "./marcas";
import { validarOferta, type DadosOferta } from "./ofertas";
import { reaisParaCentavos } from "@/lib/dinheiro";

/** Até quantas linhas de produtos uma planilha pode ter */
export const MAX_LINHAS_PLANILHA = 2000;
/** A prévia vale por 24 horas; depois é preciso enviar a planilha de novo */
export const VALIDADE_PREVIA_MS = 24 * 60 * 60 * 1000;
/** Até 3 faixas de atacado por produto, como no cadastro manual */
export const FAIXAS_NA_PLANILHA = 3;

/** Colunas do modelo, na ordem. "obrigatoria" = a coluna precisa existir no cabeçalho. */
export const COLUNAS = [
  { chave: "codigo", titulo: "codigo", obrigatoria: true, ajuda: "Código do material no catálogo Solid (veja a aba Materiais). Não altere." },
  { chave: "ean", titulo: "codigo_barras", obrigatoria: false, ajuda: "Produtos de marca: o código de barras (EAN) identifica o produto sozinho — marca, modelo e embalagem vêm do catálogo Solid (aba Produtos de marca)." },
  { chave: "material", titulo: "material", obrigatoria: false, ajuda: "Nome do material (só para você se orientar; não é lido)." },
  { chave: "embalagem", titulo: "embalagem", obrigatoria: true, ajuda: "Como é vendido. Ex.: Saco 50 kg, m³, Milheiro, Unidade." },
  { chave: "quantidade", titulo: "qtd_na_embalagem", obrigatoria: true, ajuda: "Quanto vem em 1 embalagem, na unidade de comparação. Ex.: saco de 50 kg = 50; milheiro = 1000." },
  { chave: "unidade", titulo: "unidade", obrigatoria: false, ajuda: "Unidade de comparação do material (kg, m³, unidade…). Só para orientação; não é lida." },
  { chave: "preco", titulo: "preco", obrigatoria: true, ajuda: "Preço de 1 embalagem, em reais. Ex.: 38,90" },
  { chave: "marca", titulo: "marca", obrigatoria: false, ajuda: "Marca (opcional). Nos produtos de marca é ignorada: vem do catálogo pelo código de barras." },
  { chave: "disponivel", titulo: "disponivel", obrigatoria: false, ajuda: "sim = aparece na busca; não = sem estoque. Vazio = sim." },
  { chave: "fracao", titulo: "fracao_minima", obrigatoria: false, ajuda: "1 = só inteiros; 0,5 = vende de meio em meio (areia, brita). Vazio = 1." },
  { chave: "atacadoCpf", titulo: "atacado_para_cpf", obrigatoria: false, ajuda: "sim = faixas de atacado valem também para pessoa física. Vazio = não (só CNPJ)." },
  ...Array.from({ length: FAIXAS_NA_PLANILHA }, (_, i) => [
    { chave: `faixa${i + 1}Min`, titulo: `faixa${i + 1}_a_partir_de`, obrigatoria: false, ajuda: `Faixa ${i + 1} de atacado: quantidade mínima (número inteiro).` },
    { chave: `faixa${i + 1}Preco`, titulo: `faixa${i + 1}_preco`, obrigatoria: false, ajuda: `Faixa ${i + 1} de atacado: preço de 1 embalagem nessa quantidade.` },
  ]).flat(),
] as const;

export type Celula = string | number | boolean | null | undefined;

/** Uma linha da planilha já interpretada (o que será gravado) */
export type LinhaValida = {
  linha: number;
  productId: string;
  packageLabel: string;
  baseQuantity: number;
  priceCents: number;
  brand: string | null;
  active: boolean;
  quantityStep: number;
  tiersForCpf: boolean;
  tiers: { minQuantity: number; priceCents: number }[];
  /** Produto de marca: item do catálogo central */
  catalogItemId: string | null;
};

export type OfertaAtual = Omit<LinhaValida, "linha" | "catalogItemId"> & { id: string; catalogItemId?: string | null };
export type MaterialDoCatalogo = { id: string; name: string; brandMatters: boolean };
export type ItemDeMarcaDoCatalogo = {
  id: string;
  productId: string;
  brand: string;
  model: string;
  ean: string | null;
  packageLabel: string;
  baseQuantity: number;
  active: boolean;
};

export type TipoLinha = "NOVO" | "PRECO" | "OUTROS" | "SEM_MUDANCA" | "ERRO";

export type ResultadoLinha = {
  linha: number;
  tipo: TipoLinha;
  codigo: string;
  nome: string;
  embalagem: string;
  /** Ex.: ["Preço: R$ 38,90 → R$ 39,90", "Marca: Votoran → Ciplan"] */
  mudancas: string[];
  erros: string[];
  /** Preenchido nas linhas que serão gravadas */
  dados?: LinhaValida;
  /** id da oferta existente que será atualizada */
  offerId?: string;
};

export type ResumoImportacao = {
  precosAlterados: number;
  novos: number;
  outrosAlterados: number;
  semMudanca: number;
  erros: number;
};

export type PlanoImportacao = {
  /** Problema que impede ler a planilha inteira (ex.: falta a coluna "preco") */
  erroGeral?: string;
  linhas: ResultadoLinha[];
  resumo: ResumoImportacao;
};

// -----------------------------------------------------------------------------
// Leitura das células
// -----------------------------------------------------------------------------

/** "Qtd na Embalagem" -> "qtd_na_embalagem" (sem acentos, minúsculas, _ no lugar de espaços) */
export function normalizarTitulo(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Mesma embalagem escrita de jeitos diferentes: "saco  50 KG" = "Saco 50 kg" */
export const chaveEmbalagem = (e: string) => e.trim().replace(/\s+/g, " ").toLowerCase();
const chaveProduto = (codigo: string, embalagem: string) => `${codigo}|${chaveEmbalagem(embalagem)}`;

const texto = (c: Celula) => (c === null || c === undefined ? "" : String(c).trim());

/** Número: aceita 50, "50", "0,5", "1.000" (milhar) */
function lerNumero(c: Celula): number | null {
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  const t = texto(c);
  if (!t) return null;
  const limpo = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Dinheiro: 38.9 (número do Excel), "38,90", "R$ 1.234,56" -> centavos */
function lerPreco(c: Celula): number | null {
  if (typeof c === "number") return Number.isFinite(c) && c >= 0 ? Math.round(c * 100) : null;
  const t = texto(c);
  return t ? reaisParaCentavos(t) : null;
}

/** sim/não: aceita sim, s, x, 1, verdadeiro, yes / não, nao, n, 0, falso, no */
function lerSimNao(c: Celula, padrao: boolean): boolean | null {
  if (typeof c === "boolean") return c;
  const t = normalizarTitulo(texto(c));
  if (!t) return padrao;
  if (["sim", "s", "x", "1", "verdadeiro", "true", "yes"].includes(t)) return true;
  if (["nao", "n", "0", "falso", "false", "no"].includes(t)) return false;
  return null;
}

const reais = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\s/g, " ");
const simNao = (b: boolean) => (b ? "sim" : "não");
const faixasTexto = (f: LinhaValida["tiers"]) =>
  f.length ? f.map((x) => `${x.minQuantity}+ por ${reais(x.priceCents)}`).join(", ") : "sem atacado";

// -----------------------------------------------------------------------------
// Planejamento: o que cada linha vai fazer
// -----------------------------------------------------------------------------

/**
 * Lê a tabela (1ª linha = cabeçalho) e compara com o que a loja já tem.
 * Não grava nada: só diz o que vai acontecer.
 */
export function planejarImportacao(
  tabela: Celula[][],
  catalogo: MaterialDoCatalogo[],
  ofertasAtuais: OfertaAtual[],
  itensDeMarca: ItemDeMarcaDoCatalogo[] = [],
): PlanoImportacao {
  const vazio: ResumoImportacao = { precosAlterados: 0, novos: 0, outrosAlterados: 0, semMudanca: 0, erros: 0 };
  const [cabecalho, ...corpo] = tabela;
  if (!cabecalho) return { erroGeral: "A planilha está vazia.", linhas: [], resumo: vazio };

  // Onde está cada coluna (o lojista pode reordenar ou apagar as opcionais)
  const posicao = new Map<string, number>();
  cabecalho.forEach((c, i) => {
    const col = COLUNAS.find((x) => x.titulo === normalizarTitulo(texto(c)));
    if (col && !posicao.has(col.chave)) posicao.set(col.chave, i);
  });
  // Com a coluna do código de barras, basta ela e o preço (produtos de marca);
  // sem ela, o material é identificado por código + embalagem + quantidade.
  const faltando = COLUNAS.filter(
    (c) => c.obrigatoria && !posicao.has(c.chave) && (c.chave === "preco" || !posicao.has("ean")),
  ).map((c) => c.titulo);
  if (faltando.length) {
    return {
      erroGeral: `Faltam colunas na 1ª linha da planilha: ${faltando.join(", ")}. Use o modelo baixado nesta página.`,
      linhas: [],
      resumo: vazio,
    };
  }

  const linhasPreenchidas = corpo
    .map((celulas, i) => ({ celulas, linha: i + 2 })) // linha 1 = cabeçalho
    .filter(({ celulas }) => celulas.some((c) => texto(c) !== ""));
  if (linhasPreenchidas.length === 0) return { erroGeral: "A planilha não tem nenhum produto preenchido.", linhas: [], resumo: vazio };
  if (linhasPreenchidas.length > MAX_LINHAS_PLANILHA) {
    return { erroGeral: `A planilha tem ${linhasPreenchidas.length} produtos. O limite é ${MAX_LINHAS_PLANILHA} por envio.`, linhas: [], resumo: vazio };
  }

  const materiais = new Map(catalogo.map((m) => [m.id, m]));
  const atuais = new Map(ofertasAtuais.map((o) => [chaveDaOferta(o), o]));
  const porEan = new Map(itensDeMarca.filter((i) => i.ean).map((i) => [i.ean!, i]));
  const vistas = new Map<string, number>();
  const resultado: ResultadoLinha[] = [];

  for (const { celulas, linha } of linhasPreenchidas) {
    const valor = (chave: string): Celula => {
      const i = posicao.get(chave);
      return i === undefined ? null : celulas[i];
    };
    const erros: string[] = [];
    let codigo = texto(valor("codigo"));
    let embalagem = texto(valor("embalagem")).replace(/\s+/g, " ");
    let baseQuantity = lerNumero(valor("quantidade"));
    let marca = texto(valor("marca")) || null;

    // Produto de marca: o código de barras identifica tudo (marca, modelo, embalagem)
    const ean = normalizarEan(texto(valor("ean")));
    const item = ean ? porEan.get(ean) : undefined;
    if (ean && !eanValido(ean)) {
      erros.push(`Código de barras "${texto(valor("ean"))}" inválido: confira os números.`);
    } else if (ean && !item) {
      erros.push(`O código de barras ${ean} ainda não está no catálogo Solid. Use "Sugerir material" (marca, modelo e código de barras).`);
    } else if (item) {
      if (!item.active) erros.push(`O produto ${item.brand} ${item.model} está fora do catálogo.`);
      if (codigo && codigo !== item.productId) erros.push(`O código de barras é de "${item.productId}", mas a coluna codigo diz "${codigo}".`);
      codigo = item.productId;
      embalagem = item.packageLabel;
      baseQuantity = item.baseQuantity;
      marca = item.brand;
    }

    const material = materiais.get(codigo);
    const nome = material ? (item ? `${material.name} — ${item.brand} ${item.model}` : material.name) : texto(valor("material"));
    const base = { linha, codigo, nome, embalagem, mudancas: [] as string[] };

    if (!codigo && !ean) erros.push("Falta o código do material (ou o código de barras).");
    else if (codigo && !material) erros.push(`O código "${codigo}" não existe no catálogo. Confira na aba Materiais ou sugira o material.`);
    else if (material?.brandMatters && !item && !ean) {
      erros.push("Produto de marca: informe o código de barras (coluna codigo_barras). Veja a aba Produtos de marca.");
    }

    const priceCents = lerPreco(valor("preco"));
    if (texto(valor("preco")) && priceCents === null) erros.push(`Preço "${texto(valor("preco"))}" inválido. Use, por exemplo, 38,90.`);
    const active = lerSimNao(valor("disponivel"), true);
    if (active === null) erros.push('Na coluna "disponivel", use sim ou não.');
    const tiersForCpf = lerSimNao(valor("atacadoCpf"), false);
    if (tiersForCpf === null) erros.push('Na coluna "atacado_para_cpf", use sim ou não.');
    const quantityStep = texto(valor("fracao")) ? lerNumero(valor("fracao")) : 1;

    const tiers: LinhaValida["tiers"] = [];
    for (let f = 1; f <= FAIXAS_NA_PLANILHA; f++) {
      const min = valor(`faixa${f}Min`);
      const preco = valor(`faixa${f}Preco`);
      if (!texto(min) && !texto(preco)) continue;
      const minQuantity = lerNumero(min);
      const precoFaixa = lerPreco(preco);
      if (minQuantity === null || precoFaixa === null) {
        erros.push(`Faixa ${f} de atacado incompleta: preencha a quantidade mínima e o preço.`);
      } else {
        tiers.push({ minQuantity, priceCents: precoFaixa });
      }
    }
    tiers.sort((a, b) => a.minQuantity - b.minQuantity);

    const dadosOferta: DadosOferta = {
      productId: material?.id ?? "x", // código já conferido acima
      packageLabel: embalagem,
      baseQuantity: baseQuantity ?? 0,
      priceCents: priceCents ?? 0,
      quantityStep: quantityStep ?? 0,
      tiers,
      brand: marca,
    };
    erros.push(...Object.values(validarOferta(dadosOferta)).filter((e): e is string => !!e));

    // O mesmo produto duas vezes na planilha
    const chave = chaveDaOferta({ productId: codigo, packageLabel: embalagem, catalogItemId: item?.id });
    if (codigo && embalagem) {
      const anterior = vistas.get(chave);
      if (anterior) erros.push(`Repetido: este ${item ? "produto" : "material com esta embalagem"} já está na linha ${anterior}.`);
      else vistas.set(chave, linha);
    }

    if (erros.length > 0) {
      resultado.push({ ...base, tipo: "ERRO", erros: [...new Set(erros)] });
      continue;
    }

    const dados: LinhaValida = {
      linha,
      productId: codigo,
      packageLabel: embalagem,
      baseQuantity: baseQuantity!,
      priceCents: priceCents!,
      brand: marca,
      active: active!,
      quantityStep: quantityStep!,
      tiersForCpf: tiersForCpf!,
      tiers,
      catalogItemId: item?.id ?? null,
    };
    const atual = atuais.get(chave);
    if (!atual) {
      resultado.push({ ...base, tipo: "NOVO", erros: [], dados, mudancas: [`Novo: ${reais(dados.priceCents)}`] });
      continue;
    }

    const mudancas = mudancasEntre(atual, dados);
    const tipo: TipoLinha =
      mudancas.length === 0 ? "SEM_MUDANCA" : atual.priceCents !== dados.priceCents ? "PRECO" : "OUTROS";
    resultado.push({ ...base, tipo, erros: [], dados, offerId: atual.id, mudancas });
  }

  const contar = (t: TipoLinha) => resultado.filter((r) => r.tipo === t).length;
  return {
    linhas: resultado,
    resumo: {
      precosAlterados: contar("PRECO"),
      novos: contar("NOVO"),
      outrosAlterados: contar("OUTROS"),
      semMudanca: contar("SEM_MUDANCA"),
      erros: contar("ERRO"),
    },
  };
}

/** O que muda entre o produto cadastrado e a linha da planilha (vazio = nada) */
export function mudancasEntre(
  atual: Omit<LinhaValida, "linha" | "catalogItemId">,
  dados: Omit<LinhaValida, "linha" | "catalogItemId">,
): string[] {
  const mudancas: string[] = [];
  if (atual.priceCents !== dados.priceCents) mudancas.push(`Preço: ${reais(atual.priceCents)} → ${reais(dados.priceCents)}`);
  if (atual.packageLabel !== dados.packageLabel) mudancas.push(`Embalagem: ${atual.packageLabel} → ${dados.packageLabel}`);
  if (atual.baseQuantity !== dados.baseQuantity) mudancas.push(`Qtd. na embalagem: ${atual.baseQuantity} → ${dados.baseQuantity}`);
  if ((atual.brand ?? "") !== (dados.brand ?? "")) mudancas.push(`Marca: ${atual.brand ?? "—"} → ${dados.brand ?? "—"}`);
  if (atual.active !== dados.active) mudancas.push(`Disponível: ${simNao(atual.active)} → ${simNao(dados.active)}`);
  if (atual.quantityStep !== dados.quantityStep) mudancas.push(`Fração mínima: ${atual.quantityStep} → ${dados.quantityStep}`);
  if (atual.tiersForCpf !== dados.tiersForCpf) mudancas.push(`Atacado para CPF: ${simNao(atual.tiersForCpf)} → ${simNao(dados.tiersForCpf)}`);
  const faixasAntes = [...atual.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  if (faixasTexto(faixasAntes) !== faixasTexto(dados.tiers)) {
    mudancas.push(`Atacado: ${faixasTexto(faixasAntes)} → ${faixasTexto(dados.tiers)}`);
  }
  return mudancas;
}

/**
 * Chave que identifica um produto da loja: o item do catálogo de marca (produtos
 * de marca) ou o código do material + a embalagem (materiais padronizados).
 */
export function chaveDaOferta(o: { productId: string; packageLabel: string; catalogItemId?: string | null }) {
  return o.catalogItemId ? `item:${o.catalogItemId}` : chaveProduto(o.productId, o.packageLabel);
}

/** "12 preços alterados, 3 produtos novos, 2 erros" */
export function textoDoResumo(r: ResumoImportacao): string {
  const partes = [
    [r.precosAlterados, "preço alterado", "preços alterados"],
    [r.novos, "produto novo", "produtos novos"],
    [r.outrosAlterados, "produto com outras alterações", "produtos com outras alterações"],
    [r.semMudanca, "sem mudança", "sem mudança"],
    [r.erros, "erro", "erros"],
  ] as const;
  return partes
    .filter(([n], i) => n > 0 || i === 0 || i === 1 || i === 4)
    .map(([n, um, varios]) => `${n} ${n === 1 ? um : varios}`)
    .join(", ");
}

// -----------------------------------------------------------------------------
// Planilha CSV (texto separado por ponto e vírgula, como o Excel brasileiro salva)
// -----------------------------------------------------------------------------

/** Lê um CSV. Descobre sozinho se o separador é ";" ou "," e respeita aspas. */
export function lerCsv(conteudo: string): string[][] {
  const t = conteudo.replace(/^﻿/, "");
  const primeira = t.split(/\r?\n/, 1)[0] ?? "";
  const separador = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";

  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let entreAspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (entreAspas) {
      if (c === '"' && t[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') entreAspas = false;
      else celula += c;
    } else if (c === '"') entreAspas = true;
    else if (c === separador) {
      linha.push(celula);
      celula = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
    } else celula += c;
  }
  if (celula !== "" || linha.length > 0) {
    linha.push(celula);
    linhas.push(linha);
  }
  return linhas;
}

/**
 * Texto de arquivo CSV: tenta UTF-8; se aparecerem caracteres inválidos,
 * lê como Windows-1252 (o padrão do Excel no Windows em português).
 */
export function decodificarCsv(bytes: Uint8Array): string {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(bytes) : utf8;
}
