// =============================================================================
// Regras de preço
// =============================================================================
// - Preço por unidade padronizada: permite comparar embalagens diferentes
//   (ex.: saco de 25 kg x saco de 50 kg -> R$ por kg).
// - Faixas de atacado: quem pode ver/usar cada faixa.
// =============================================================================

import type { Papel } from "@/config/constantes";

export type FaixaPreco = { minQuantity: number; priceCents: number };

export type OfertaPrecificavel = {
  priceCents: number;
  /** Quanto da unidade padronizada vem em 1 embalagem */
  baseQuantity: number;
  /** Faixas valem também para CPF? */
  tiersForCpf: boolean;
  tiers: FaixaPreco[];
};

/**
 * Preço de 1 unidade padronizada, em centavos (pode ter casas decimais).
 * Ex.: saco de 50 kg a R$ 38,90 -> 77,8 centavos por kg.
 */
export function precoPorUnidadeBase(priceCents: number, baseQuantity: number): number {
  return priceCents / baseQuantity;
}

/**
 * As faixas de atacado que este tipo de cliente pode usar, da menor para a maior quantidade.
 * - CNPJ: sempre.
 * - CPF (e visitante sem login): só se a loja liberou ("tiersForCpf").
 * - Lojista e administrador: veem como CPF (não compram no MVP).
 */
export function faixasDisponiveis(oferta: OfertaPrecificavel, papel: Papel | null): FaixaPreco[] {
  const podeUsar = papel === "CNPJ" || oferta.tiersForCpf;
  if (!podeUsar) return [];
  return [...oferta.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
}

/** A oferta tem atacado, mas só para CNPJ, e este cliente não é CNPJ? (para mostrar o aviso) */
export function atacadoSoParaCnpj(oferta: OfertaPrecificavel, papel: Papel | null): boolean {
  return oferta.tiers.length > 0 && papel !== "CNPJ" && !oferta.tiersForCpf;
}
