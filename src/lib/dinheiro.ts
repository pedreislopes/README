// Funções para lidar com dinheiro.
// Internamente tudo é guardado em centavos (número inteiro).

const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 4090 -> "R$ 40,90" */
export function formatarReais(centavos: number): string {
  return formatador.format(centavos / 100);
}

/** "40,90" ou "40.90" -> 4090. Retorna null se o texto não for um valor válido. */
export function reaisParaCentavos(texto: string): number | null {
  let limpo = texto.replace(/[R$\s]/g, "");
  // Com vírgula, o ponto é separador de milhar ("1.234,56").
  // Sem vírgula, o ponto é a casa decimal ("40.90").
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor < 0) return null;
  return Math.round(valor * 100);
}

const formatadorFino = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

/**
 * Preço por unidade padronizada, que pode ter frações de centavo.
 * Abaixo de R$ 1 mostra 3 casas para diferenciar ofertas parecidas:
 * 77,8 centavos -> "R$ 0,778"
 */
export function formatarPrecoUnidade(centavos: number): string {
  return centavos < 100 ? formatadorFino.format(centavos / 100) : formatarReais(Math.round(centavos));
}
