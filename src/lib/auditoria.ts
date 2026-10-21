// =============================================================================
// Registro de auditoria: TODA ação do administrador passa por aqui.
// Guarda quem fez, o quê, em quem e quando. O site não tem opção de apagar.
// =============================================================================

import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Admin = { id: string; name: string };

/** Ações registradas (o código fica no banco; o texto aparece na tela de registro) */
export const ACOES_ADMIN = {
  LOJA_APROVADA: "Aprovou loja",
  LOJA_RECUSADA: "Recusou loja",
  LOJA_SUSPENSA: "Suspendeu loja",
  LOJA_REATIVADA: "Reativou loja",
  COMISSAO_ALTERADA: "Alterou comissão",
  PLANO_ALTERADO: "Alterou plano de anúncio",
  /** Ação antiga (antes dos planos Destaque/Premium), mantida para registros antigos */
  DESTAQUE_ALTERADO: "Alterou Oferta destaque",
  PEDIDO_CANCELADO: "Cancelou pedido",
  MATERIAL_CRIADO: "Criou material no catálogo",
  SUGESTAO_APROVADA: "Aprovou sugestão de material",
  SUGESTAO_RECUSADA: "Recusou sugestão de material",
  RELATORIO_EXPORTADO: "Baixou relatório em planilha",
} as const;
export type AcaoAdmin = keyof typeof ACOES_ADMIN;

/**
 * Grava uma linha no registro. Aceita "tx" para gravar junto com a própria
 * alteração (se uma falhar, nenhuma das duas é gravada).
 */
export async function registrarAcao(
  admin: Admin,
  action: AcaoAdmin,
  alvo: { tipo: "Store" | "Order" | "Product" | "MaterialSuggestion" | "Relatorio"; id: string },
  details: string,
  tx: Prisma.TransactionClient = db,
) {
  await tx.adminLog.create({
    data: { adminId: admin.id, adminName: admin.name, action, targetType: alvo.tipo, targetId: alvo.id, details },
  });
}
