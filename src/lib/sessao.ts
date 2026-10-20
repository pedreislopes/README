// =============================================================================
// Sessão de login
// =============================================================================
// Ao entrar, o navegador recebe um código secreto aleatório num cookie
// (inacessível a scripts da página: "httpOnly"). No banco guardamos só o hash
// desse código. A cada página, conferimos o cookie para saber quem está logado.
// =============================================================================

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { Papel } from "@/config/constantes";
import { DURACAO_SESSAO_DIAS } from "@/config/seguranca";
import { db } from "./db";

const COOKIE = "solid_sessao";

export type UsuarioAtual = { id: string; name: string; email: string; role: Papel };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Cria a sessão no banco e grava o cookie no navegador */
export async function criarSessao(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: hash(token), userId, expiresAt } });

  // "secure" (só via https) quando o site estiver publicado com https.
  // No computador local (http://localhost) fica desligado para funcionar.
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    expires: expiresAt,
  });
}

/** Apaga a sessão do banco e o cookie do navegador */
export async function encerrarSessao() {
  const loja = await cookies();
  const token = loja.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hash(token) } });
  loja.delete(COOKIE);
}

/**
 * Quem está logado agora (ou null, se ninguém).
 * "cache" evita consultar o banco várias vezes na mesma página.
 */
export const usuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await db.session.findUnique({
    where: { id: hash(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!sessao || sessao.expiresAt < new Date()) return null;

  return { ...sessao.user, role: sessao.user.role as Papel };
});

/** Endereço de internet de quem fez o pedido (usado no limite de tentativas) */
export async function ipDoVisitante(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";
}
