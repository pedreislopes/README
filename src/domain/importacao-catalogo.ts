// =============================================================================
// Importação do CATÁLOGO DE MARCA por planilha (administrador)
// =============================================================================
// Para cadastrar muitos produtos de uma vez, a partir do catálogo de um fabricante.
// Cada linha é um produto, identificado pelo CÓDIGO DE BARRAS:
//   - código de barras novo  -> produto NOVO no catálogo;
//   - código já cadastrado   -> ATUALIZA marca, modelo, embalagem e características
//     (característica em branco na planilha NÃO apaga a que já existe).
// Nada é gravado antes da confirmação (mesma prévia da importação do lojista).
// =============================================================================

import { MODELOS_CARACTERISTICAS, modeloDe } from "@/config/caracteristicas";
import { normalizarTitulo, type Celula } from "./importacao";
import {
  eanValido,
  formatarCaracteristica,
  lerCaracteristicas,
  normalizarEan,
  validarCaracteristicas,
  type Caracteristicas,
} from "./marcas";

/** Prefixo das colunas de características: carac_peso_cabeca, carac_rendimento_m2… */
export const PREFIXO_CARACTERISTICA = "carac_";

export const COLUNAS_CATALOGO = [
  { chave: "tipo", titulo: "tipo", obrigatoria: true, ajuda: "Código do tipo de produto (aba Tipos). Ex.: martelo-unha, tinta-acrilica-18." },
  { chave: "marca", titulo: "marca", obrigatoria: true, ajuda: "Marca do fabricante." },
  { chave: "modelo", titulo: "modelo", obrigatoria: true, ajuda: "Nome do modelo, como aparece na embalagem." },
  { chave: "ean", titulo: "codigo_barras", obrigatoria: true, ajuda: "Código de barras (EAN/GTIN). Identifica o produto: se já existir, o produto é atualizado." },
  { chave: "embalagem", titulo: "embalagem", obrigatoria: true, ajuda: "Ex.: Unidade, Lata 18 L, Caixa 2,5 m²." },
  { chave: "quantidade", titulo: "qtd_na_embalagem", obrigatoria: true, ajuda: "Quanto vem na embalagem, na unidade de comparação do tipo (ex.: lata 18 L = 18)." },
] as const;

/** Todas as colunas de características possíveis (de todos os tipos), sem repetir */
export const COLUNAS_CARACTERISTICAS = [
  ...new Map(
    Object.values(MODELOS_CARACTERISTICAS)
      .flatMap((m) => m.campos)
      .map((c) => [c.chave, `${PREFIXO_CARACTERISTICA}${c.chave}`] as const),
  ).values(),
];

export type TipoDoCatalogo = { id: string; name: string; specTemplate: string; brandMatters: boolean };
export type ItemAtual = {
  id: string;
  productId: string;
  brand: string;
  model: string;
  ean: string | null;
  packageLabel: string;
  baseQuantity: number;
  specs: string;
};

export type DadosItem = {
  productId: string;
  brand: string;
  model: string;
  ean: string;
  packageLabel: string;
  baseQuantity: number;
  specs: Caracteristicas;
};

export type LinhaCatalogo = {
  linha: number;
  tipo: "NOVO" | "ALTERADO" | "SEM_MUDANCA" | "ERRO";
  descricao: string;
  mudancas: string[];
  erros: string[];
  dados?: DadosItem;
  itemId?: string;
};

export type ResumoCatalogo = { novos: number; alterados: number; semMudanca: number; erros: number };

const texto = (c: Celula) => (c === null || c === undefined ? "" : String(c).trim());

function lerNumero(c: Celula): number | null {
  if (typeof c === "number") return c;
  const t = texto(c).replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return t && Number.isFinite(n) ? n : null;
}

export function planejarImportacaoCatalogo(tabela: Celula[][], tipos: TipoDoCatalogo[], atuais: ItemAtual[]) {
  const vazio: ResumoCatalogo = { novos: 0, alterados: 0, semMudanca: 0, erros: 0 };
  const [cabecalho, ...corpo] = tabela;
  if (!cabecalho) return { erroGeral: "A planilha está vazia.", linhas: [] as LinhaCatalogo[], resumo: vazio };

  const posicao = new Map<string, number>();
  cabecalho.forEach((c, i) => {
    const titulo = normalizarTitulo(texto(c));
    const col = COLUNAS_CATALOGO.find((x) => x.titulo === titulo);
    if (col && !posicao.has(col.chave)) posicao.set(col.chave, i);
    if (titulo.startsWith(PREFIXO_CARACTERISTICA)) posicao.set(titulo, i);
  });
  const faltando = COLUNAS_CATALOGO.filter((c) => c.obrigatoria && !posicao.has(c.chave)).map((c) => c.titulo);
  if (faltando.length) {
    return {
      erroGeral: `Faltam colunas na 1ª linha da planilha: ${faltando.join(", ")}. Use o modelo baixado nesta página.`,
      linhas: [] as LinhaCatalogo[],
      resumo: vazio,
    };
  }

  const tiposPorId = new Map(tipos.map((t) => [t.id, t]));
  const porEan = new Map(atuais.filter((a) => a.ean).map((a) => [a.ean!, a]));
  const vistos = new Map<string, number>();
  const linhas: LinhaCatalogo[] = [];

  corpo.forEach((celulas, i) => {
    const linha = i + 2;
    if (!celulas.some((c) => texto(c) !== "")) return;
    const valor = (chave: string) => {
      const p = posicao.get(chave);
      return p === undefined ? null : celulas[p];
    };
    const erros: string[] = [];
    const tipo = tiposPorId.get(texto(valor("tipo")));
    const brand = texto(valor("marca")).replace(/\s+/g, " ").slice(0, 60);
    const model = texto(valor("modelo")).replace(/\s+/g, " ").slice(0, 80);
    const ean = normalizarEan(texto(valor("ean")));
    const packageLabel = texto(valor("embalagem")).replace(/\s+/g, " ");
    const baseQuantity = lerNumero(valor("quantidade"));
    const descricao = [brand, model].filter(Boolean).join(" ") || `(linha ${linha})`;

    if (!tipo) erros.push(`Tipo "${texto(valor("tipo"))}" não existe ou não é de produto de marca. Veja a aba Tipos.`);
    if (brand.length < 2) erros.push("Falta a marca.");
    if (!model) erros.push("Falta o modelo.");
    if (!eanValido(ean)) erros.push(`Código de barras "${texto(valor("ean"))}" inválido: confira os números.`);
    if (!packageLabel) erros.push("Falta a embalagem.");
    if (!(baseQuantity && baseQuantity > 0)) erros.push("Informe a quantidade na embalagem (número maior que zero).");

    const brutos: Record<string, unknown> = {};
    for (const [chave, p] of posicao) if (chave.startsWith(PREFIXO_CARACTERISTICA)) brutos[chave.slice(PREFIXO_CARACTERISTICA.length)] = celulas[p];
    const modelo = modeloDe(tipo?.specTemplate);
    const { valores, erros: errosCarac } = validarCaracteristicas(modelo, brutos);
    erros.push(...errosCarac);

    const anterior = ean ? vistos.get(ean) : undefined;
    if (anterior) erros.push(`Repetido: este código de barras já está na linha ${anterior}.`);
    else if (ean) vistos.set(ean, linha);

    const atual = porEan.get(ean);
    if (atual && tipo && atual.productId !== tipo.id) erros.push(`Este código de barras já é de outro tipo de produto (${atual.productId}).`);

    if (erros.length) {
      linhas.push({ linha, tipo: "ERRO", descricao, mudancas: [], erros: [...new Set(erros)] });
      return;
    }

    // Característica em branco na planilha não apaga a que já existe
    const specs = { ...lerCaracteristicas(atual?.specs), ...valores };
    const dados: DadosItem = { productId: tipo!.id, brand, model, ean, packageLabel, baseQuantity: baseQuantity!, specs };
    if (!atual) {
      linhas.push({ linha, tipo: "NOVO", descricao, mudancas: [`Novo: ${tipo!.name}`], erros: [], dados });
      return;
    }

    const mudancas: string[] = [];
    if (atual.brand !== brand) mudancas.push(`Marca: ${atual.brand} → ${brand}`);
    if (atual.model !== model) mudancas.push(`Modelo: ${atual.model} → ${model}`);
    if (atual.packageLabel !== packageLabel) mudancas.push(`Embalagem: ${atual.packageLabel} → ${packageLabel}`);
    if (atual.baseQuantity !== baseQuantity) mudancas.push(`Qtd. na embalagem: ${atual.baseQuantity} → ${baseQuantity}`);
    const antes = lerCaracteristicas(atual.specs);
    for (const campo of modelo?.campos ?? []) {
      if (antes[campo.chave] !== specs[campo.chave]) {
        mudancas.push(`${campo.rotulo}: ${formatarCaracteristica(campo, antes[campo.chave])} → ${formatarCaracteristica(campo, specs[campo.chave])}`);
      }
    }
    linhas.push({ linha, tipo: mudancas.length ? "ALTERADO" : "SEM_MUDANCA", descricao, mudancas, erros: [], dados, itemId: atual.id });
  });

  if (linhas.length === 0) return { erroGeral: "A planilha não tem nenhum produto preenchido.", linhas, resumo: vazio };
  const contar = (t: LinhaCatalogo["tipo"]) => linhas.filter((l) => l.tipo === t).length;
  return {
    erroGeral: undefined,
    linhas,
    resumo: { novos: contar("NOVO"), alterados: contar("ALTERADO"), semMudanca: contar("SEM_MUDANCA"), erros: contar("ERRO") },
  };
}

export function textoResumoCatalogo(r: ResumoCatalogo): string {
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  return [
    plural(r.novos, "produto novo", "produtos novos"),
    plural(r.alterados, "produto atualizado", "produtos atualizados"),
    ...(r.semMudanca ? [plural(r.semMudanca, "sem mudança", "sem mudança")] : []),
    plural(r.erros, "erro", "erros"),
  ].join(", ");
}
