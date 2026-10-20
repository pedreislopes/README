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

// -----------------------------------------------------------------------------
// Preço conforme a quantidade (faixas de atacado)
// -----------------------------------------------------------------------------

/**
 * Preço de 1 embalagem para a quantidade pedida: usa a maior faixa atingida.
 * Ex.: faixas 50+ = R$ 36 e 200+ = R$ 33 -> 120 sacos custam R$ 36 cada.
 */
export function precoNaQuantidade(
  oferta: OfertaPrecificavel,
  papel: Papel | null,
  quantidade: number,
): { unitCents: number; faixa: FaixaPreco | null } {
  let melhor: { unitCents: number; faixa: FaixaPreco | null } = { unitCents: oferta.priceCents, faixa: null };
  for (const faixa of faixasDisponiveis(oferta, papel)) {
    // A faixa só vale se for mesmo mais barata que o preço normal
    if (quantidade >= faixa.minQuantity && faixa.priceCents < melhor.unitCents) {
      melhor = { unitCents: faixa.priceCents, faixa };
    }
  }
  return melhor;
}

export type ProximaFaixa = {
  /** Quanto falta para chegar na próxima faixa */
  faltam: number;
  minQuantity: number;
  unitCents: number;
  /** Economia total ao chegar na faixa, comparada a pagar o preço atual pela mesma quantidade */
  economiaCents: number;
};

export type CalculoItem = {
  quantidade: number;
  /** Preço normal de 1 embalagem */
  listUnitCents: number;
  /** Preço cobrado por embalagem (com faixa, se houver) */
  unitCents: number;
  totalCents: number;
  /** Quanto o cliente economiza neste item por causa da faixa */
  economiaCents: number;
  faixaAplicada: FaixaPreco | null;
  /** Preenchido só quando o cliente está perto da próxima faixa */
  proximaFaixa: ProximaFaixa | null;
};

/** Arredonda para centavos inteiros (quantidades podem ter fração, ex.: 2,5 m³) */
const centavos = (valor: number) => Math.round(valor);

/**
 * Calcula tudo de um item do carrinho.
 * @param pertoDaFaixa  fração da próxima faixa a partir da qual mostramos o incentivo (ex.: 0.7)
 */
export function calcularItem(
  oferta: OfertaPrecificavel,
  papel: Papel | null,
  quantidade: number,
  pertoDaFaixa: number,
): CalculoItem {
  const { unitCents, faixa } = precoNaQuantidade(oferta, papel, quantidade);
  const totalCents = centavos(unitCents * quantidade);
  const economiaCents = centavos(oferta.priceCents * quantidade) - totalCents;

  let proximaFaixa: ProximaFaixa | null = null;
  const seguinte = faixasDisponiveis(oferta, papel).find(
    (f) => f.minQuantity > quantidade && f.priceCents < unitCents,
  );
  if (seguinte && quantidade >= seguinte.minQuantity * pertoDaFaixa) {
    proximaFaixa = {
      faltam: seguinte.minQuantity - quantidade,
      minQuantity: seguinte.minQuantity,
      unitCents: seguinte.priceCents,
      economiaCents: centavos((unitCents - seguinte.priceCents) * seguinte.minQuantity),
    };
  }

  return {
    quantidade,
    listUnitCents: oferta.priceCents,
    unitCents,
    totalCents,
    economiaCents,
    faixaAplicada: faixa,
    proximaFaixa,
  };
}

// -----------------------------------------------------------------------------
// "Foto" do preço (para avisar se a loja mudar o preço)
// -----------------------------------------------------------------------------

/** Texto que representa o preço e as faixas da oferta neste momento */
export function fotoDoPreco(oferta: Pick<OfertaPrecificavel, "priceCents" | "tiers" | "tiersForCpf">): string {
  const faixas = [...oferta.tiers]
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((f) => [f.minQuantity, f.priceCents]);
  return JSON.stringify({ p: oferta.priceCents, f: faixas, cpf: oferta.tiersForCpf });
}

/** Recria a oferta "como era" a partir da foto, para comparar o preço antigo com o novo */
export function ofertaDaFoto(foto: string, baseQuantity: number): OfertaPrecificavel {
  const { p, f, cpf } = JSON.parse(foto) as { p: number; f: [number, number][]; cpf: boolean };
  return {
    priceCents: p,
    baseQuantity,
    tiersForCpf: cpf,
    tiers: f.map(([minQuantity, priceCents]) => ({ minQuantity, priceCents })),
  };
}
