"use server";

// =============================================================================
// Ações de conta: entrar, cadastrar e sair
// =============================================================================
// "use server" = estas funções rodam só no servidor, nunca no navegador.
// =============================================================================

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { CUSTO_BCRYPT, LIMITE_LOGIN, VERSAO_TERMOS } from "@/config/seguranca";
import { normalizarEmail, validarCadastro, type ErrosCadastro } from "@/domain/cadastro";
import { verificarBloqueio } from "@/domain/tentativas";
import { juntarCarrinhoDoVisitante } from "./carrinho";
import { db } from "./db";
import { criarSessao, encerrarSessao, ipDoVisitante } from "./sessao";

/** Só aceita voltar para páginas do próprio site (evita redirecionar para sites falsos) */
function destinoSeguro(voltar: FormDataEntryValue | null, padrao = "/"): string {
  const v = typeof voltar === "string" ? voltar : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : padrao;
}

// -----------------------------------------------------------------------------
// Entrar
// -----------------------------------------------------------------------------
export type EstadoLogin = { erro?: string; email?: string };

const MENSAGEM_GENERICA = "E-mail ou senha incorretos.";

/**
 * Hash de uma senha qualquer, usado quando o e-mail não existe:
 * assim a resposta demora o mesmo tempo e não revela se o e-mail está cadastrado.
 */
const HASH_FICTICIO = bcrypt.hashSync("senha-ficticia-para-tempo-igual", CUSTO_BCRYPT);

export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = normalizarEmail(String(form.get("email") ?? ""));
  const senha = String(form.get("senha") ?? "");
  const ip = await ipDoVisitante();
  const chaves = [`email:${email}`, `ip:${ip}`];

  // 1. Bloqueio por excesso de tentativas
  const desde = new Date(Date.now() - LIMITE_LOGIN.janelaMinutos * 60_000);
  const falhas = await db.loginAttempt.findMany({
    where: { key: { in: chaves }, createdAt: { gte: desde } },
    select: { key: true, createdAt: true },
  });
  const datas = (chave: string) => falhas.filter((f) => f.key === chave).map((f) => f.createdAt);
  const porEmail = verificarBloqueio(datas(chaves[0]), LIMITE_LOGIN.falhasPorEmail, LIMITE_LOGIN.janelaMinutos);
  const porIp = verificarBloqueio(datas(chaves[1]), LIMITE_LOGIN.falhasPorIp, LIMITE_LOGIN.janelaMinutos);
  if (porEmail.bloqueado || porIp.bloqueado) {
    const minutos = Math.max(porEmail.minutosRestantes, porIp.minutosRestantes);
    return {
      email,
      erro: `Muitas tentativas seguidas. Por segurança, aguarde ${minutos} ${minutos === 1 ? "minuto" : "minutos"} e tente de novo.`,
    };
  }

  // 2. Confere a senha (sempre roda o bcrypt, mesmo se o e-mail não existir)
  const usuario = await db.user.findUnique({ where: { email } });
  const senhaCorreta = await bcrypt.compare(senha, usuario?.passwordHash ?? HASH_FICTICIO);

  if (!usuario || !senhaCorreta) {
    await db.loginAttempt.createMany({ data: chaves.map((key) => ({ key })) });
    // Faxina: apaga registros antigos que já não contam
    await db.loginAttempt.deleteMany({ where: { createdAt: { lt: desde } } });
    return { email, erro: MENSAGEM_GENERICA };
  }

  // 3. Deu certo: zera os erros deste e-mail e cria a sessão
  await db.loginAttempt.deleteMany({ where: { key: chaves[0] } });
  await criarSessao(usuario.id);
  await juntarCarrinhoDoVisitante(usuario.id);
  const inicial = usuario.role === "LOJISTA" ? "/loja" : usuario.role === "ADMIN" ? "/admin" : "/";
  redirect(destinoSeguro(form.get("voltar"), inicial));
}

// -----------------------------------------------------------------------------
// Cadastrar
// -----------------------------------------------------------------------------
export type EstadoCadastro = {
  erros?: ErrosCadastro;
  /** Valores digitados, para não apagar o formulário quando há erro (sem as senhas) */
  valores?: Record<string, string>;
  /** Muda a cada resposta: faz o formulário ser redesenhado com os valores enviados */
  resposta?: number;
};

export async function cadastrar(_anterior: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const texto = (campo: string) => String(form.get(campo) ?? "");
  const dados = {
    tipo: texto("tipo"),
    nome: texto("nome"),
    documento: texto("documento"),
    email: texto("email"),
    telefone: texto("telefone"),
    senha: texto("senha"),
    confirmacao: texto("confirmacao"),
    aceiteTermos: form.get("aceiteTermos") === "on",
    nomeLoja: texto("nomeLoja"),
    regiao: texto("regiao"),
    endereco: texto("endereco"),
  };
  const valores = Object.fromEntries(
    Object.entries(dados)
      .filter(([campo]) => campo !== "senha" && campo !== "confirmacao")
      .map(([campo, valor]) => [campo, String(valor)]),
  );

  const resultado = validarCadastro(dados);
  if (!resultado.ok) return { erros: resultado.erros, valores, resposta: Date.now() };
  const v = resultado.dados;

  // Documento e e-mail não podem repetir
  const existente = await db.user.findFirst({
    where: { OR: [{ email: v.email }, { document: v.documento }] },
    select: { email: true, document: true },
  });
  if (existente) {
    const erros: ErrosCadastro = {};
    if (existente.document === v.documento) {
      erros.documento = `Já existe uma conta com este ${v.tipo === "CPF" ? "CPF" : "CNPJ"}.`;
    }
    if (existente.email === v.email) erros.email = "Este e-mail já está cadastrado. Tente entrar.";
    return { erros, valores, resposta: Date.now() };
  }

  let usuarioId: string;
  try {
    const usuario = await db.user.create({
      data: {
        name: v.nome,
        email: v.email,
        passwordHash: await bcrypt.hash(v.senha, CUSTO_BCRYPT),
        role: v.tipo,
        document: v.documento,
        phone: v.telefone,
        termsAcceptedAt: new Date(),
        termsVersion: VERSAO_TERMOS,
        // Lojista: a loja nasce PENDENTE e só aparece na busca após aprovação
        store: v.loja
          ? {
              create: {
                name: v.loja.nome,
                cnpj: v.documento,
                region: v.loja.regiao,
                address: v.loja.endereco,
                phone: v.telefone,
                status: "PENDENTE",
              },
            }
          : undefined,
      },
    });
    usuarioId = usuario.id;
  } catch (erro) {
    // Duas pessoas cadastrando o mesmo dado ao mesmo tempo
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return { erros: { documento: "Este CPF/CNPJ ou e-mail já está cadastrado." }, valores, resposta: Date.now() };
    }
    throw erro;
  }

  await criarSessao(usuarioId);
  await juntarCarrinhoDoVisitante(usuarioId);
  redirect(v.tipo === "LOJISTA" ? "/loja" : destinoSeguro(form.get("voltar")));
}

// -----------------------------------------------------------------------------
// Sair
// -----------------------------------------------------------------------------
export async function sair() {
  await encerrarSessao();
  redirect("/");
}
