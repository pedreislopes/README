// =============================================================================
// Configurações do carrinho
// =============================================================================

/**
 * Incentivo de atacado: mostramos "Adicione mais X e pague menos" quando a
 * quantidade já chegou a esta fração da próxima faixa.
 * 0.7 = a partir de 70% (ex.: 35 de 50 sacos).
 */
export const PERTO_DA_PROXIMA_FAIXA = 0.7;

/** Maior quantidade aceita em um item (evita erros de digitação como 50000000) */
export const QUANTIDADE_MAXIMA = 100_000;

/**
 * Fração mínima vendida, conforme a unidade padronizada do produto.
 * Usado ao cadastrar ofertas: areia e brita (m³) de meio em meio metro cúbico.
 * Sacos, milheiros, peças etc. só em quantidades inteiras.
 * (Cada oferta guarda o próprio passo, e o lojista poderá ajustar.)
 */
export const PASSO_PADRAO_POR_UNIDADE: Record<string, number> = {
  m3: 0.5,
};
