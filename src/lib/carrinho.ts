// =============================================================================
// Carrinho: onde fica guardado e como é carregado
// =============================================================================
// - Visitante (sem login): o carrinho é identificado por um cookie.
// - Usuário logado: o carrinho fica ligado à conta (aparece em qualquer aparelho).
// - Ao entrar na conta, os itens do visitante são SOMADOS ao carrinho da conta,
//   para nada se perder.
// =============================================================================

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { usuarioAtual } from "./sessao";

const COOKIE = "solid_carrinho";
const DURACAO_COOKIE_DIAS = 60;

const novoId = () => randomBytes(24).toString("base64url");

/**
 * Id do carrinho de quem está usando o site.
 * @param criar  cria um carrinho novo se ainda não existir (ao adicionar o 1º item)
 */
export async function idDoCarrinho(criar: boolean): Promise<string | null> {
  const usuario = await usuarioAtual();
  if (usuario) {
    const carrinho = await db.cart.findUnique({ where: { userId: usuario.id }, select: { id: true } });
    if (carrinho) return carrinho.id;
    if (!criar) return null;
    return (await db.cart.create({ data: { id: novoId(), userId: usuario.id } })).id;
  }

  const loja = await cookies();
  const doCookie = loja.get(COOKIE)?.value;
  if (doCookie) {
    const carrinho = await db.cart.findUnique({ where: { id: doCookie }, select: { id: true, userId: true } });
    if (carrinho && !carrinho.userId) return carrinho.id;
  }
  if (!criar) return null;

  const carrinho = await db.cart.create({ data: { id: novoId() } });
  loja.set(COOKIE, carrinho.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_COOKIE_DIAS * 24 * 60 * 60,
  });
  return carrinho.id;
}

/** Itens do carrinho com tudo o que é preciso para calcular preços e mostrar na tela */
export async function itensDoCarrinho(cartId: string) {
  return db.cartItem.findMany({
    where: { cartId },
    orderBy: { addedAt: "asc" },
    include: {
      offer: {
        include: {
          tiers: { orderBy: { minQuantity: "asc" } },
          product: { select: { id: true, name: true, baseUnit: true } },
          store: {
            select: {
              id: true,
              name: true,
              region: true,
              phone: true,
              address: true,
              status: true,
              commissionPercent: true,
            },
          },
        },
      },
    },
  });
}

/** Quantos itens (linhas) há no carrinho, para o número no ícone do menu */
export async function contarItensDoCarrinho(): Promise<number> {
  const id = await idDoCarrinho(false);
  return id ? db.cartItem.count({ where: { cartId: id } }) : 0;
}

/**
 * Chamado logo após entrar/cadastrar: junta o carrinho do visitante ao da conta.
 * Se o mesmo produto estiver nos dois, as quantidades são somadas.
 */
export async function juntarCarrinhoDoVisitante(userId: string) {
  const loja = await cookies();
  const idVisitante = loja.get(COOKIE)?.value;
  if (!idVisitante) return;
  loja.delete(COOKIE);

  const visitante = await db.cart.findUnique({ where: { id: idVisitante }, include: { items: true } });
  if (!visitante || visitante.userId) return;

  const daConta =
    (await db.cart.findUnique({ where: { userId } })) ??
    (await db.cart.create({ data: { id: novoId(), userId } }));

  await db.$transaction([
    ...visitante.items.map((item) =>
      db.cartItem.upsert({
        where: { cartId_offerId: { cartId: daConta.id, offerId: item.offerId } },
        // Mantém a "foto" de preço mais antiga, para o aviso de mudança continuar valendo
        update: { quantity: { increment: item.quantity } },
        create: {
          cartId: daConta.id,
          offerId: item.offerId,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          addedAt: item.addedAt,
        },
      }),
    ),
    db.cart.delete({ where: { id: visitante.id } }),
  ]);
}
