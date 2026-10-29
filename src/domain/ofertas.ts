// =============================================================================
// Regras do painel do lojista: produtos (ofertas), reajustes e status de pedido
// =============================================================================

import type { StatusPedido } from "@/config/constantes";
import type { FaixaPreco } from "./precos";

export type DadosOferta = {
  productId: string;
  packageLabel: string;
  /** Quanto da unidade padronizada vem em 1 embalagem */
  baseQuantity: number;
  priceCents: number;
  quantityStep: number;
  tiers: FaixaPreco[];
  brand?: string | null;
  /** Ferramenta de marca: a marca é obrigatória */
  exigeMarca?: boolean;
};

export type ErrosOferta = Partial<
  Record<"productId" | "packageLabel" | "baseQuantity" | "priceCents" | "quantityStep" | "tiers" | "brand", string>
>;

/** Confere o cadastro de um produto da loja antes de gravar */
export function validarOferta(d: DadosOferta): ErrosOferta {
  const erros: ErrosOferta = {};
  if (!d.productId) erros.productId = "Escolha o material.";
  if (d.packageLabel.trim().length < 1) erros.packageLabel = "Informe como o produto é vendido (ex.: Saco 50 kg).";
  if (!(d.baseQuantity > 0)) erros.baseQuantity = "Informe quanto vem na embalagem.";
  if (!(d.priceCents > 0)) erros.priceCents = "Informe o preço.";
  if (d.quantityStep !== 1 && d.quantityStep !== 0.5) erros.quantityStep = "Escolha 1 ou 0,5.";
  if (d.exigeMarca && !d.brand?.trim()) {
    erros.brand = "Informe a marca: neste material o cliente compara preço e marca.";
  }

  // Faixas: quantidade mínima maior que 1, sem repetir, e preço caindo conforme a quantidade sobe
  const faixas = [...d.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let precoAnterior = d.priceCents;
  // Só confere as faixas depois que o preço normal for válido
  for (const [i, f] of erros.priceCents ? [] : faixas.entries()) {
    if (!Number.isInteger(f.minQuantity) || f.minQuantity < 2) {
      erros.tiers = "A quantidade mínima de cada faixa deve ser um número inteiro a partir de 2.";
      break;
    }
    if (i > 0 && f.minQuantity === faixas[i - 1].minQuantity) {
      erros.tiers = "Há duas faixas com a mesma quantidade mínima.";
      break;
    }
    if (!(f.priceCents > 0) || f.priceCents >= precoAnterior) {
      erros.tiers = "O preço de cada faixa deve ser menor que o preço normal e que o da faixa anterior.";
      break;
    }
    precoAnterior = f.priceCents;
  }
  return erros;
}

// -----------------------------------------------------------------------------
// Reajuste em massa
// -----------------------------------------------------------------------------

export const REAJUSTE_MIN = -90;
export const REAJUSTE_MAX = 100;

/** Aplica +X% ou -X% a um preço em centavos. Ex.: R$ 40,00 com +5% -> R$ 42,00 */
export function reajustarPreco(cents: number, percentual: number): number {
  return Math.max(1, Math.round(cents * (1 + percentual / 100)));
}

export function validarPercentual(percentual: number): string | null {
  if (!Number.isFinite(percentual) || percentual === 0) return "Informe a porcentagem do reajuste.";
  if (percentual < REAJUSTE_MIN || percentual > REAJUSTE_MAX) {
    return `Use um valor entre ${REAJUSTE_MIN}% e +${REAJUSTE_MAX}%.`;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Status do pedido
// -----------------------------------------------------------------------------

/** Próxima etapa do pedido (null = já foi entregue) */
export const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  NOVO: "RECEBIDO",
  RECEBIDO: "SEPARADO",
  SEPARADO: "ENTREGUE",
  ENTREGUE: null,
  CANCELADO: null,
};
