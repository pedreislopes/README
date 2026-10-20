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
