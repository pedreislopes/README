// =============================================================================
// Produtos de marca: código de barras, características e comparação
// =============================================================================

import {
  COMPARAR_MAX,
  COMPARAR_MIN,
  NAO_INFORMADO,
  type CampoCaracteristica,
  type ModeloCaracteristicas,
} from "@/config/caracteristicas";
import { precoPorUnidadeBase } from "./precos";

// -----------------------------------------------------------------------------
// Código de barras (EAN-8, UPC-12, EAN-13 e GTIN-14)
// -----------------------------------------------------------------------------

/** Só os números: "789 1234-567890" -> "7891234567890" */
export const normalizarEan = (texto: string) => texto.replace(/\D/g, "");

/**
 * Confere o dígito verificador (o último número), como o leitor do caixa faz.
 * Pega erros de digitação, como um número trocado.
 */
export function eanValido(ean: string): boolean {
  if (!/^\d+$/.test(ean) || ![8, 12, 13, 14].includes(ean.length)) return false;
  const digitos = ean.split("").map(Number);
  const verificador = digitos.pop()!;
  // Da direita para a esquerda: pesos 3, 1, 3, 1...
  const soma = digitos.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (soma % 10)) % 10 === verificador;
}

/** Calcula o dígito verificador (usado para gerar códigos dos dados de teste) */
export function digitoEan(semDigito: string): string {
  const soma = semDigito
    .split("")
    .map(Number)
    .reverse()
    .reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return String((10 - (soma % 10)) % 10);
}

// -----------------------------------------------------------------------------
// Características (guardadas como JSON no item do catálogo)
// -----------------------------------------------------------------------------

export type ValorCaracteristica = string | number | boolean;
export type Caracteristicas = Record<string, ValorCaracteristica>;

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Lê o JSON guardado no banco sem quebrar se estiver vazio ou estragado */
export function lerCaracteristicas(json: string | null | undefined): Caracteristicas {
  try {
    const v = JSON.parse(json || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Caracteristicas) : {};
  } catch {
    return {};
  }
}

/**
 * Confere e converte o que foi digitado (formulário ou planilha).
 * Campo vazio = "Não informado" (não é erro). Campos fora do modelo são ignorados.
 */
export function validarCaracteristicas(
  modelo: ModeloCaracteristicas | null,
  brutos: Record<string, unknown>,
): { valores: Caracteristicas; erros: string[] } {
  const valores: Caracteristicas = {};
  const erros: string[] = [];
  for (const campo of modelo?.campos ?? []) {
    const bruto = brutos[campo.chave];
    if (bruto === null || bruto === undefined || String(bruto).trim() === "") continue;
    const texto = String(bruto).trim();

    if (campo.tipo === "numero") {
      const n = typeof bruto === "number" ? bruto : Number(texto.replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0) erros.push(`${campo.rotulo}: "${texto}" não é um número.`);
      else valores[campo.chave] = n;
    } else if (campo.tipo === "simnao") {
      const t = semAcento(texto);
      if (bruto === true || ["sim", "s", "x", "1", "verdadeiro", "true"].includes(t)) valores[campo.chave] = true;
      else if (bruto === false || ["nao", "n", "0", "falso", "false"].includes(t)) valores[campo.chave] = false;
      else erros.push(`${campo.rotulo}: use sim ou não.`);
    } else if (campo.tipo === "opcao") {
      const opcao = campo.opcoes?.find((o) => semAcento(o) === semAcento(texto));
      if (opcao) valores[campo.chave] = opcao;
      else erros.push(`${campo.rotulo}: "${texto}" não é uma opção (${campo.opcoes?.join(", ")}).`);
    } else {
      valores[campo.chave] = texto.slice(0, 80);
    }
  }
  return { valores, erros };
}

/** "450 g", "Sim", "Fibra de vidro" ou "Não informado" */
export function formatarCaracteristica(campo: CampoCaracteristica, valor: ValorCaracteristica | undefined): string {
  if (valor === undefined || valor === null || valor === "") return NAO_INFORMADO;
  if (campo.tipo === "simnao") return valor ? "Sim" : "Não";
  if (campo.tipo === "numero" && typeof valor === "number") {
    const n = valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    return campo.unidade ? `${n} ${campo.unidade}` : n;
  }
  return String(valor);
}

/** Quantas características do modelo estão preenchidas (para o administrador ver o que falta) */
export function caracteristicasPreenchidas(modelo: ModeloCaracteristicas | null, valores: Caracteristicas) {
  const campos = modelo?.campos ?? [];
  return { preenchidas: campos.filter((c) => valores[c.chave] !== undefined).length, total: campos.length };
}

// -----------------------------------------------------------------------------
// Tinta: custo por m² pintado
// -----------------------------------------------------------------------------

/** Preço da lata ÷ rendimento (m² por lata, 1 demão), em centavos por m². null se não der para calcular. */
export function custoPorM2Pintado(precoCents: number, rendimentoM2: ValorCaracteristica | undefined): number | null {
  return typeof rendimentoM2 === "number" && rendimentoM2 > 0 ? precoCents / rendimentoM2 : null;
}

// -----------------------------------------------------------------------------
// Melhor preço geral e o mais barato de cada marca
// -----------------------------------------------------------------------------

export type OfertaComMarca = { id: string; priceCents: number; baseQuantity: number; marca: string | null };

/**
 * Para cada marca, a oferta mais barata (pelo preço por unidade padronizada).
 * Marcas da mais barata para a mais cara. Ofertas sem marca ficam de fora.
 */
export function maisBaratoPorMarca<O extends OfertaComMarca>(ofertas: O[]): { marca: string; oferta: O }[] {
  const porMarca = new Map<string, O>();
  const unidade = (o: O) => precoPorUnidadeBase(o.priceCents, o.baseQuantity);
  for (const o of ofertas) {
    if (!o.marca) continue;
    const atual = porMarca.get(o.marca);
    if (!atual || unidade(o) < unidade(atual)) porMarca.set(o.marca, o);
  }
  return [...porMarca.entries()]
    .map(([marca, oferta]) => ({ marca, oferta }))
    .sort((a, b) => unidade(a.oferta) - unidade(b.oferta) || a.marca.localeCompare(b.marca, "pt-BR"));
}

/** Marcas presentes nas ofertas, em ordem alfabética (para o filtro) */
export function marcasDasOfertas(ofertas: { marca: string | null }[]): string[] {
  return [...new Set(ofertas.map((o) => o.marca).filter((m): m is string => !!m))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// -----------------------------------------------------------------------------
// Comparação lado a lado
// -----------------------------------------------------------------------------

export type ItemParaComparar = {
  id: string;
  productId: string;
  marca: string;
  modelo: string;
  caracteristicas: Caracteristicas;
  /** Menor preço entre as lojas (null = nenhuma loja vende agora) */
  menorPreco: { priceCents: number; loja: string } | null;
};

export type LinhaComparacao = { rotulo: string; valores: string[] };

/** Confere a escolha do cliente: de 2 a 3 produtos, todos do mesmo tipo */
export function validarEscolha(itens: { productId: string }[]): string | null {
  if (itens.length < COMPARAR_MIN) return `Escolha pelo menos ${COMPARAR_MIN} produtos para comparar.`;
  if (itens.length > COMPARAR_MAX) return `Compare no máximo ${COMPARAR_MAX} produtos de cada vez.`;
  if (new Set(itens.map((i) => i.productId)).size > 1) return "Compare produtos do mesmo tipo (ex.: só martelos ou só tintas).";
  return null;
}

/** Linhas da tabela: uma por característica do modelo; vazio vira "Não informado" */
export function linhasDaComparacao(
  modelo: ModeloCaracteristicas | null,
  itens: Pick<ItemParaComparar, "caracteristicas">[],
): LinhaComparacao[] {
  return (modelo?.campos ?? []).map((campo) => ({
    rotulo: campo.rotulo,
    valores: itens.map((i) => formatarCaracteristica(campo, i.caracteristicas[campo.chave])),
  }));
}
