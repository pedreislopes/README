"use server";

// =============================================================================
// Cancelamento de pedido, usado pelo cliente, pela loja e pelo administrador.
// O servidor descobre QUEM está cancelando e aplica a regra de cada um
// (ver podeCancelar em src/domain/pedidos.ts).
// =============================================================================

import { refresh } from "next/cache";
import { montarMotivo, podeCancelar, type QuemCancela } from "@/domain/pedidos";
import { registrarAcao } from "./auditoria";
import { db } from "./db";
import { numeroDoPedido } from "./pedidos";
import { usuarioAtual } from "./sessao";

export async function cancelarPedido(
  orderId: string,
  motivoEscolhido: string,
  detalhe: string,
): Promise<{ ok?: boolean; erro?: string }> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para cancelar." };

  const pedido = await db.order.findUnique({
    where: { id: orderId },
    include: { store: { select: { ownerId: true, name: true } }, purchase: { select: { userId: true } } },
  });
  if (!pedido) return { erro: "Pedido não encontrado." };

  // Quem está cancelando? Só o dono da compra, a loja do pedido ou o administrador.
  let quem: QuemCancela | null = null;
  if (usuario.role === "ADMIN") quem = "ADMIN";
  else if (usuario.role === "LOJISTA" && pedido.store.ownerId === usuario.id) quem = "LOJA";
  else if (pedido.purchase.userId === usuario.id) quem = "CLIENTE";
  if (!quem) return { erro: "Pedido não encontrado." };

  if (!podeCancelar(pedido.status, quem)) {
    return {
      erro:
        pedido.status === "CANCELADO"
          ? "Este pedido já foi cancelado."
          : "Este pedido já foi separado e não pode mais ser cancelado por aqui. Fale com a equipe Solid.",
    };
  }
  const m = montarMotivo(motivoEscolhido, detalhe);
  if ("erro" in m) return { erro: m.erro };

  await db.$transaction(async (tx) => {
    // "status: pedido.status" evita cancelar algo que mudou nesse meio-tempo
    const r = await tx.order.updateMany({
      where: { id: orderId, status: pedido.status },
      data: { status: "CANCELADO", canceledBy: quem, canceledAt: new Date(), cancelReason: m.motivo },
    });
    if (r.count === 1 && quem === "ADMIN") {
      await registrarAcao(
        usuario,
        "PEDIDO_CANCELADO",
        { tipo: "Order", id: orderId },
        `Pedido ${numeroDoPedido(pedido.purchaseId)} (${pedido.store.name}): ${m.motivo}`,
        tx,
      );
    }
  });
  refresh();
  return { ok: true };
}
