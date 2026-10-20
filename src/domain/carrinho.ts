// =============================================================================
// Montagem do carrinho (usada na tela do carrinho E na finalização do pedido)
// =============================================================================
// Para cada item: aplica a faixa de preço da quantidade, calcula a economia,
// detecta se a loja mudou o preço desde que o item foi adicionado e se o
// produto continua disponível. Depois separa por loja e soma tudo.
// Usar a MESMA função nas duas telas garante que o cliente paga o que viu.
// =============================================================================

import type { Papel } from "@/config/constantes";
import { calcularComissao } from "./comissao";
import { calcularItem, fotoDoPreco, ofertaDaFoto, precoNaQuantidade, type CalculoItem, type OfertaPrecificavel } from "./precos";

type LojaMinima = { id: string; status: string; commissionPercent: number };

export type ItemDoCarrinho<L extends LojaMinima> = {
  id: string;
  quantity: number;
  priceSnapshot: string;
  offer: OfertaPrecificavel & { id: string; active: boolean; store: L };
};

export type ItemCalculado<I> = {
  item: I;
  calculo: CalculoItem;
  /** Preenchido quando o preço para esta quantidade mudou desde que o item entrou no carrinho */
  precoMudou: { antesUnitCents: number; agoraUnitCents: number } | null;
  /** Loja saiu do ar ou a oferta foi desativada */
  indisponivel: boolean;
};

type LojaDo<I extends ItemDoCarrinho<LojaMinima>> = I["offer"]["store"];

export type GrupoDaLoja<I extends ItemDoCarrinho<LojaMinima>> = {
  loja: LojaDo<I>;
  itens: ItemCalculado<I>[];
  subtotalCents: number;
  economiaCents: number;
  comissaoCents: number;
};

export type CarrinhoMontado<I extends ItemDoCarrinho<LojaMinima>> = {
  lojas: GrupoDaLoja<I>[];
  totalCents: number;
  economiaCents: number;
  quantidadeDeItens: number;
  precosMudaram: number;
  indisponiveis: number;
};

export function montarCarrinho<I extends ItemDoCarrinho<LojaMinima>>(
  itens: I[],
  papel: Papel | null,
  pertoDaFaixa: number,
): CarrinhoMontado<I> {
  const porLoja = new Map<string, GrupoDaLoja<I>>();

  for (const item of itens) {
    const { offer } = item;
    const calculo = calcularItem(offer, papel, item.quantity, pertoDaFaixa);
    const indisponivel = !offer.active || offer.store.status !== "APROVADA";

    let precoMudou: ItemCalculado<I>["precoMudou"] = null;
    if (fotoDoPreco(offer) !== item.priceSnapshot) {
      const antes = precoNaQuantidade(ofertaDaFoto(item.priceSnapshot, offer.baseQuantity), papel, item.quantity);
      if (antes.unitCents !== calculo.unitCents) {
        precoMudou = { antesUnitCents: antes.unitCents, agoraUnitCents: calculo.unitCents };
      }
    }

    let grupo = porLoja.get(offer.store.id);
    if (!grupo) {
      grupo = { loja: offer.store, itens: [], subtotalCents: 0, economiaCents: 0, comissaoCents: 0 };
      porLoja.set(offer.store.id, grupo);
    }
    grupo.itens.push({ item, calculo, precoMudou, indisponivel });
    if (!indisponivel) {
      grupo.subtotalCents += calculo.totalCents;
      grupo.economiaCents += calculo.economiaCents;
    }
  }

  const lojas = [...porLoja.values()];
  for (const g of lojas) g.comissaoCents = calcularComissao(g.subtotalCents, g.loja.commissionPercent);
  const todos = lojas.flatMap((g) => g.itens);

  return {
    lojas,
    totalCents: lojas.reduce((s, g) => s + g.subtotalCents, 0),
    economiaCents: lojas.reduce((s, g) => s + g.economiaCents, 0),
    quantidadeDeItens: todos.length,
    precosMudaram: todos.filter((i) => i.precoMudou && !i.indisponivel).length,
    indisponiveis: todos.filter((i) => i.indisponivel).length,
  };
}
