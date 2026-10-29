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

import type { PlanoAnuncio } from "@/config/constantes";
import { precoPorUnidadeBase, type OfertaPrecificavel } from "./precos";

export type Ordem = "preco" | "unidade";

export type OfertaDaBusca = OfertaPrecificavel & {
  id: string;
  productId: string;
  store: { id: string; region: string; adPlan: PlanoAnuncio | string };
};

export type Filtros = {
  /** Regiões aceitas (uma só, ou todas do DF / do Entorno). Vazio = todas. */
  regioes?: readonly string[];
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
  /**
   * Lojas anunciantes que vendem o produto MAIS relevante da busca (uma oferta
   * por loja, a de melhor preço por unidade), separadas por plano e ordenadas
   * da mais barata para a mais cara. Quais aparecem no topo é decidido por
   * escolherAnuncios().
   */
  destaque: { produto: P; premium: O[]; destaque: O[] } | null;
};

const porUnidade = (o: OfertaPrecificavel) => precoPorUnidadeBase(o.priceCents, o.baseQuantity);

function passaNosFiltros(oferta: OfertaDaBusca, filtros: Filtros): boolean {
  if (filtros.regioes?.length && !filtros.regioes.includes(oferta.store.region)) return false;
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

  // Anúncios: lojas Premium/Destaque no produto MAIS relevante que elas
  // realmente vendem (respeitando os filtros). Nunca inventa um produto.
  let destaque: Resultados<P, O>["destaque"] = null;
  for (const grupo of grupos) {
    const melhorPorLoja = new Map<string, O>();
    for (const o of grupo.ofertas.filter((x) => x.store.adPlan === "PREMIUM" || x.store.adPlan === "DESTAQUE")) {
      const atual = melhorPorLoja.get(o.store.id);
      if (!atual || porUnidade(o) < porUnidade(atual)) melhorPorLoja.set(o.store.id, o);
    }
    if (melhorPorLoja.size > 0) {
      const ordenadas = [...melhorPorLoja.values()].sort(
        (a, b) => porUnidade(a) - porUnidade(b) || a.store.id.localeCompare(b.store.id),
      );
      destaque = {
        produto: grupo.produto,
        premium: ordenadas.filter((o) => o.store.adPlan === "PREMIUM"),
        destaque: ordenadas.filter((o) => o.store.adPlan === "DESTAQUE"),
      };
      break;
    }
  }

  return { grupos, destaque };
}

/**
 * Escolhe quais ofertas destaque aparecem no topo.
 * - Até "max" candidatas: todas, da mais barata para a mais cara.
 * - Mais que "max": rodízio. As candidatas ficam em roda (ordenadas por preço) e,
 *   a cada busca ("rodada"), a janela de "max" vagas anda uma posição.
 *   Em N rodadas seguidas (N = número de lojas), cada loja aparece exatamente
 *   "max" vezes. As escolhidas são mostradas da mais barata para a mais cara.
 */
export function escolherAnunciosEmRodizio<O extends OfertaDaBusca>(candidatas: O[], max: number, rodada: number): O[] {
  if (max <= 0) return [];
  if (candidatas.length <= max) return candidatas;
  const n = candidatas.length;
  const inicio = ((rodada % n) + n) % n;
  const escolhidas = Array.from({ length: max }, (_, i) => candidatas[(inicio + i) % n]);
  return escolhidas.sort((a, b) => candidatas.indexOf(a) - candidatas.indexOf(b));
}

/**
 * Monta as vagas do topo: primeiro as lojas Premium; se sobrarem vagas, entram
 * as lojas Destaque. Cada plano tem o seu rodízio justo (rodadaPremium e
 * rodadaDestaque) e é mostrado da mais barata para a mais cara.
 */
export function escolherAnuncios<O extends OfertaDaBusca>(
  premium: O[],
  destaque: O[],
  max: number,
  rodadaPremium: number,
  rodadaDestaque: number,
): { oferta: O; plano: "PREMIUM" | "DESTAQUE" }[] {
  const doPremium = escolherAnunciosEmRodizio(premium, max, rodadaPremium);
  const doDestaque = escolherAnunciosEmRodizio(destaque, max - doPremium.length, rodadaDestaque);
  return [
    ...doPremium.map((oferta) => ({ oferta, plano: "PREMIUM" as const })),
    ...doDestaque.map((oferta) => ({ oferta, plano: "DESTAQUE" as const })),
  ];
}
