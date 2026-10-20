// =============================================================================
// Montagem da página de resultados da busca
// =============================================================================
// Recebe os produtos encontrados (já em ordem de relevância) e as ofertas das
// lojas, aplica os filtros e decide:
// - a ordem das ofertas (menor preço ou menor preço por unidade padronizada);
// - qual oferta recebe o selo "Melhor preço" (menor preço por unidade padronizada,
//   que é a comparação justa entre embalagens diferentes);
// - qual oferta aparece no topo como "Patrocinado".
// =============================================================================

import { precoPorUnidadeBase, type OfertaPrecificavel } from "./precos";

export type Ordem = "preco" | "unidade";

export type OfertaDaBusca = OfertaPrecificavel & {
  id: string;
  productId: string;
  store: { id: string; region: string; featured: boolean };
};

export type Filtros = {
  regiao?: string;
  /** Faixa de preço da embalagem, em centavos */
  precoMin?: number;
  precoMax?: number;
  ordem: Ordem;
};

export type GrupoDeProduto<P, O> = {
  produto: P;
  ofertas: O[];
  /** id da oferta com selo "Melhor preço" */
  melhorPrecoId: string;
};

export type Resultados<P, O> = {
  grupos: GrupoDeProduto<P, O>[];
  patrocinado: { produto: P; oferta: O } | null;
};

const porUnidade = (o: OfertaPrecificavel) => precoPorUnidadeBase(o.priceCents, o.baseQuantity);

function passaNosFiltros(oferta: OfertaDaBusca, filtros: Filtros): boolean {
  if (filtros.regiao && oferta.store.region !== filtros.regiao) return false;
  if (filtros.precoMin !== undefined && oferta.priceCents < filtros.precoMin) return false;
  if (filtros.precoMax !== undefined && oferta.priceCents > filtros.precoMax) return false;
  return true;
}

export function montarResultados<P extends { id: string }, O extends OfertaDaBusca>(
  produtos: P[],
  ofertas: O[],
  filtros: Filtros,
): Resultados<P, O> {
  const comparar =
    filtros.ordem === "unidade"
      ? (a: O, b: O) => porUnidade(a) - porUnidade(b) || a.priceCents - b.priceCents
      : (a: O, b: O) => a.priceCents - b.priceCents || porUnidade(a) - porUnidade(b);

  const grupos: GrupoDeProduto<P, O>[] = [];
  for (const produto of produtos) {
    const doProduto = ofertas
      .filter((o) => o.productId === produto.id && passaNosFiltros(o, filtros))
      .sort(comparar);
    if (doProduto.length === 0) continue;

    const melhor = doProduto.reduce((a, b) =>
      porUnidade(b) < porUnidade(a) || (porUnidade(b) === porUnidade(a) && b.priceCents < a.priceCents) ? b : a,
    );
    grupos.push({ produto, ofertas: doProduto, melhorPrecoId: melhor.id });
  }

  // Patrocinado: a oferta de uma loja em destaque no produto MAIS relevante
  // que ela realmente vende (respeitando os filtros). Nunca inventa um produto.
  let patrocinado: Resultados<P, O>["patrocinado"] = null;
  for (const grupo of grupos) {
    const emDestaque = grupo.ofertas.filter((o) => o.store.featured).sort(comparar);
    if (emDestaque.length > 0) {
      patrocinado = { produto: grupo.produto, oferta: emDestaque[0] };
      break;
    }
  }

  return { grupos, patrocinado };
}
