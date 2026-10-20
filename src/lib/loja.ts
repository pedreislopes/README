// =============================================================================
// Acesso do lojista ao painel
// =============================================================================
// REGRA DE SEGURANÇA: toda página e toda ação do painel começa com
// exigirLoja(). Ela devolve a loja de QUEM ESTÁ LOGADO, e todas as consultas
// usam esse id ("storeId"). Assim, mesmo que alguém troque um número no
// endereço da página, nunca enxerga nem altera dados de outra loja.
// =============================================================================

import { redirect } from "next/navigation";
import { db } from "./db";
import { usuarioAtual } from "./sessao";

export async function exigirLoja() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/loja");
  if (usuario.role !== "LOJISTA") redirect("/conta");

  const loja = await db.store.findUnique({ where: { ownerId: usuario.id } });
  if (!loja) redirect("/conta");
  return { usuario, loja };
}

/** Quantos pedidos da loja ainda estão como "Novo" (para o aviso com contador) */
export async function contarPedidosNovos(storeId: string): Promise<number> {
  return db.order.count({ where: { storeId, status: "NOVO" } });
}
