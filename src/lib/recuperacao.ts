// Consulta do link de "Esqueci minha senha" (só no servidor; não é uma ação
// que o navegador possa chamar).
import { createHash } from "node:crypto";
import { situacaoDoLink } from "@/domain/recuperacao";
import { db } from "./db";

/** No banco fica só a "impressão digital" (SHA-256) do código do link */
export const hashDoLink = (token: string) => createHash("sha256").update(token).digest("hex");

/** Situação do link (a página confere antes de mostrar o formulário) */
export async function conferirLink(token: string) {
  if (!token) return situacaoDoLink(null);
  const pedido = await db.passwordReset.findUnique({ where: { tokenHash: hashDoLink(token) } });
  return situacaoDoLink(pedido);
}
