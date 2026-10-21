// Contador do rodízio da Oferta destaque, um por produto.
// Fica na memória do servidor: a cada busca com mais lojas em destaque do que
// vagas, a "rodada" do produto avança uma posição. Se o servidor reiniciar, o
// contador recomeça, mas a divisão entre as lojas continua igual a cada volta.
const rodadas = new Map<string, number>();

export function proximaRodada(produtoId: string): number {
  const atual = rodadas.get(produtoId) ?? 0;
  rodadas.set(produtoId, atual + 1);
  return atual;
}
