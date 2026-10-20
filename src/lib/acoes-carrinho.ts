"use server";

// =============================================================================
// Ações do carrinho: adicionar, mudar quantidade, remover, aceitar novos
// preços e finalizar o pedido. Rodam só no servidor.
// =============================================================================

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { PERTO_DA_PROXIMA_FAIXA } from "@/config/carrinho";
import { montarCarrinho } from "@/domain/carrinho";
import { fotoDoPreco } from "@/domain/precos";
import { validarQuantidade } from "@/domain/quantidades";
import { db } from "./db";
import { idDoCarrinho, itensDoCarrinho } from "./carrinho";
import { usuarioAtual } from "./sessao";

export type ResultadoAcao = { ok?: boolean; erro?: string };

/** Oferta à venda (ativa e de loja aprovada), com o que é preciso para a "foto" do preço */
async function ofertaAVenda(offerId: string) {
  return db.offer.findFirst({
    where: { id: offerId, active: true, store: { status: "APROVADA" } },
    include: { tiers: true },
  });
}

/** Item que pertence ao carrinho de quem está pedindo (evita mexer no carrinho alheio) */
async function itemDoMeuCarrinho(itemId: string) {
  const cartId = await idDoCarrinho(false);
  if (!cartId) return null;
  return db.cartItem.findFirst({ where: { id: itemId, cartId }, include: { offer: true } });
}

export async function adicionarAoCarrinho(offerId: string, quantidade: number): Promise<ResultadoAcao> {
  const oferta = await ofertaAVenda(offerId);
  if (!oferta) return { erro: "Este produto não está mais disponível." };
  const erro = validarQuantidade(quantidade, oferta.quantityStep);
  if (erro) return { erro };

  const cartId = (await idDoCarrinho(true))!;
  await db.cartItem.upsert({
    where: { cartId_offerId: { cartId, offerId } },
    update: { quantity: { increment: quantidade } },
    create: { cartId, offerId, quantity: quantidade, priceSnapshot: fotoDoPreco(oferta) },
  });
  refresh();
  return { ok: true };
}

export async function alterarQuantidade(itemId: string, quantidade: number): Promise<ResultadoAcao> {
  const item = await itemDoMeuCarrinho(itemId);
  if (!item) return { erro: "Item não encontrado no carrinho." };
  const erro = validarQuantidade(quantidade, item.offer.quantityStep);
  if (erro) return { erro };
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: quantidade } });
  refresh();
  return { ok: true };
}

export async function removerItem(itemId: string): Promise<ResultadoAcao> {
  const item = await itemDoMeuCarrinho(itemId);
  if (item) await db.cartItem.delete({ where: { id: item.id } });
  refresh();
  return { ok: true };
}

/** O cliente viu o aviso de mudança de preço e concordou com os novos valores */
export async function aceitarNovosPrecos() {
  const cartId = await idDoCarrinho(false);
  if (!cartId) return;
  const itens = await db.cartItem.findMany({ where: { cartId }, include: { offer: { include: { tiers: true } } } });
  await db.$transaction(
    itens.map((i) => db.cartItem.update({ where: { id: i.id }, data: { priceSnapshot: fotoDoPreco(i.offer) } })),
  );
  refresh();
}

/**
 * Finaliza a compra (sem pagamento real): cria 1 pedido por loja,
 * com uma "foto" dos preços, e esvazia o carrinho.
 */
export async function finalizarPedido(): Promise<ResultadoAcao> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/carrinho");
  if (usuario.role !== "CPF" && usuario.role !== "CNPJ") {
    return { erro: "Contas de lojista e administrador não fazem compras. Use uma conta de cliente." };
  }

  const cartId = await idDoCarrinho(false);
  const itens = cartId ? await itensDoCarrinho(cartId) : [];
  if (itens.length === 0) return { erro: "Seu carrinho está vazio." };

  // Recalcula tudo AGORA, no servidor (nunca confia em valores vindos da tela)
  const carrinho = montarCarrinho(itens, usuario.role, PERTO_DA_PROXIMA_FAIXA);
  if (carrinho.indisponiveis > 0) {
    return { erro: "Há itens indisponíveis no carrinho. Remova-os para continuar." };
  }
  if (carrinho.precosMudaram > 0) {
    refresh();
    return { erro: "Alguns preços mudaram. Confira os novos valores antes de confirmar." };
  }

  const compra = await db.$transaction(async (tx) => {
    const criada = await tx.purchase.create({
      data: {
        userId: usuario.id,
        totalCents: carrinho.totalCents,
        savingsCents: carrinho.economiaCents,
        orders: {
          create: carrinho.lojas.map((g) => ({
            storeId: g.loja.id,
            subtotalCents: g.subtotalCents,
            savingsCents: g.economiaCents,
            commissionPercent: g.loja.commissionPercent,
            commissionCents: g.comissaoCents,
            freightCents: null, // frete a combinar com a loja (cálculo virá depois)
            items: {
              // "Foto" dos preços: mudanças futuras na loja não alteram este pedido
              create: g.itens.map(({ item, calculo }) => ({
                offerId: item.offer.id,
                productName: item.offer.product.name,
                packageLabel: item.offer.packageLabel,
                quantity: item.quantity,
                listUnitPriceCents: calculo.listUnitCents,
                unitPriceCents: calculo.unitCents,
                totalCents: calculo.totalCents,
              })),
            },
          })),
        },
      },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cartId! } });
    return criada;
  });

  redirect(`/pedido/${compra.id}`);
}
