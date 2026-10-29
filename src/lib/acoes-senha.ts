"use server";

// =============================================================================
// "Esqueci minha senha": pedir o link e criar a nova senha.
// Regras em src/domain/recuperacao.ts.
// =============================================================================

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { CUSTO_BCRYPT, RECUPERACAO_SENHA } from "@/config/seguranca";
import { normalizarEmail, validarNovaSenha } from "@/domain/cadastro";
import { MENSAGEM_LINK, MENSAGEM_PEDIDO_ENVIADO, situacaoDoLink, textoEmailRecuperacao } from "@/domain/recuperacao";
import { verificarBloqueio } from "@/domain/tentativas";
import { db } from "./db";
import { enderecoDoSite, enviarEmail } from "./email";
import { hashDoLink as hash } from "./recuperacao";
import { ipDoVisitante } from "./sessao";


// -----------------------------------------------------------------------------
// 1. Pedir o link
// -----------------------------------------------------------------------------
export type EstadoPedido = { mensagem?: string; erro?: string; email?: string };

export async function pedirNovaSenha(_anterior: EstadoPedido, form: FormData): Promise<EstadoPedido> {
  const email = normalizarEmail(String(form.get("email") ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Informe um e-mail válido.", email };

  // Limite de pedidos (por e-mail e por IP), para ninguém lotar a caixa de alguém
  const ip = await ipDoVisitante();
  const chaves = [`senha-email:${email}`, `senha-ip:${ip}`];
  const { janelaMinutos, pedidosPorEmail, pedidosPorIp } = RECUPERACAO_SENHA;
  const desde = new Date(Date.now() - janelaMinutos * 60_000);
  const pedidos = await db.loginAttempt.findMany({ where: { key: { in: chaves }, createdAt: { gte: desde } } });
  const datas = (chave: string) => pedidos.filter((p) => p.key === chave).map((p) => p.createdAt);
  const porEmail = verificarBloqueio(datas(chaves[0]), pedidosPorEmail, janelaMinutos);
  const porIp = verificarBloqueio(datas(chaves[1]), pedidosPorIp, janelaMinutos);
  if (porEmail.bloqueado || porIp.bloqueado) {
    const minutos = Math.max(porEmail.minutosRestantes, porIp.minutosRestantes);
    return { erro: `Muitos pedidos seguidos. Aguarde ${minutos} ${minutos === 1 ? "minuto" : "minutos"} e tente de novo.`, email };
  }
  await db.loginAttempt.createMany({ data: chaves.map((key) => ({ key })) });

  // O trabalho de verdade roda DEPOIS da resposta: assim a resposta é igual e
  // demora o mesmo tanto, exista ou não uma conta com este e-mail.
  after(async () => {
    const usuario = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
    if (!usuario) return;
    const token = randomBytes(32).toString("base64url");
    await db.$transaction([
      // Um link novo cancela os anteriores que ainda não foram usados
      db.passwordReset.updateMany({ where: { userId: usuario.id, usedAt: null }, data: { usedAt: new Date() } }),
      db.passwordReset.create({
        data: {
          userId: usuario.id,
          tokenHash: hash(token),
          expiresAt: new Date(Date.now() + RECUPERACAO_SENHA.validadeMinutos * 60_000),
        },
      }),
    ]);
    const link = `${enderecoDoSite()}/redefinir-senha?token=${token}`;
    await enviarEmail({ para: usuario.email, ...textoEmailRecuperacao(usuario.name, link, RECUPERACAO_SENHA.validadeMinutos) });
  });

  return { mensagem: MENSAGEM_PEDIDO_ENVIADO, email };
}

// -----------------------------------------------------------------------------
// 2. Criar a nova senha (pelo link)
// -----------------------------------------------------------------------------
export type EstadoRedefinir = { erros?: { senha?: string; confirmacao?: string }; erro?: string };

export async function redefinirSenha(_anterior: EstadoRedefinir, form: FormData): Promise<EstadoRedefinir> {
  const token = String(form.get("token") ?? "");
  const senha = String(form.get("senha") ?? "");
  const confirmacao = String(form.get("confirmacao") ?? "");

  const erros = validarNovaSenha(senha, confirmacao);
  if (erros.senha || erros.confirmacao) return { erros };

  const pedido = token ? await db.passwordReset.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } }) : null;
  const situacao = situacaoDoLink(pedido);
  if (situacao !== "VALIDO") return { erro: MENSAGEM_LINK[situacao] };

  const passwordHash = await bcrypt.hash(senha, CUSTO_BCRYPT);
  const usado = await db.$transaction(async (tx) => {
    // Marca como usado só se ainda estava valendo (dois cliques: só o primeiro vale)
    const marcado = await tx.passwordReset.updateMany({
      where: { id: pedido!.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (marcado.count !== 1) return false;
    await tx.user.update({ where: { id: pedido!.userId }, data: { passwordHash } });
    // Sai de todos os aparelhos (quem tinha a senha antiga perde o acesso)
    await tx.session.deleteMany({ where: { userId: pedido!.userId } });
    // Libera o login, caso a pessoa tenha errado a senha antiga várias vezes
    await tx.loginAttempt.deleteMany({ where: { key: `email:${pedido!.user.email}` } });
    return true;
  });
  if (!usado) return { erro: MENSAGEM_LINK.USADO };
  redirect("/entrar?senha=redefinida");
}
