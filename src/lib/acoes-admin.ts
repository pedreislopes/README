"use server";

// =============================================================================
// Ações do administrador. TODAS:
//   1. conferem se quem pede é administrador (exigirAdmin);
//   2. gravam a alteração E o registro de auditoria na mesma transação.
// =============================================================================

import { refresh } from "next/cache";
import { CATEGORIAS, PLANOS_ANUNCIO, UNIDADES_BASE, type PlanoAnuncio } from "@/config/constantes";
import { gerarIdMaterial, validarMotivoAdmin } from "@/domain/catalogo";
import { validarComissao } from "@/domain/pedidos";
import { registrarAcao } from "./auditoria";
import { exigirAdmin } from "./admin";
import { db } from "./db";

export type Resultado = { ok?: boolean; erro?: string };

const pct = (n: number) => `${n.toLocaleString("pt-BR")}%`;

// -----------------------------------------------------------------------------
// Lojas
// -----------------------------------------------------------------------------

/** Muda a situação da loja, conferindo de qual situação ela pode vir */
async function mudarSituacao(
  storeId: string,
  de: string[],
  para: "APROVADA" | "RECUSADA" | "SUSPENSA",
  acao: "LOJA_APROVADA" | "LOJA_RECUSADA" | "LOJA_SUSPENSA" | "LOJA_REATIVADA",
  motivo: string | null,
): Promise<Resultado> {
  const admin = await exigirAdmin();
  if (motivo !== null) {
    const erro = validarMotivoAdmin(motivo);
    if (erro) return { erro };
  }
  const loja = await db.store.findUnique({ where: { id: storeId } });
  if (!loja) return { erro: "Loja não encontrada." };
  if (!de.includes(loja.status)) return { erro: "A situação da loja mudou. Atualize a página." };

  await db.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: storeId },
      data: { status: para, statusReason: motivo?.trim() ?? null, statusChangedAt: new Date() },
    });
    await registrarAcao(admin, acao, { tipo: "Store", id: storeId }, `${loja.name}${motivo ? ` — motivo: ${motivo.trim()}` : ""}`, tx);
  });
  refresh();
  return { ok: true };
}

export async function aprovarLoja(storeId: string) {
  return mudarSituacao(storeId, ["PENDENTE", "RECUSADA"], "APROVADA", "LOJA_APROVADA", null);
}
export async function recusarLoja(storeId: string, motivo: string) {
  return mudarSituacao(storeId, ["PENDENTE"], "RECUSADA", "LOJA_RECUSADA", motivo);
}
/** Suspensa: some da busca, mas produtos, pedidos e histórico continuam guardados */
export async function suspenderLoja(storeId: string, motivo: string) {
  return mudarSituacao(storeId, ["APROVADA"], "SUSPENSA", "LOJA_SUSPENSA", motivo);
}
export async function reativarLoja(storeId: string) {
  return mudarSituacao(storeId, ["SUSPENSA"], "APROVADA", "LOJA_REATIVADA", null);
}

/**
 * Altera a comissão da loja. Vale SÓ para pedidos novos: cada pedido já feito
 * guarda a própria cópia da porcentagem e do valor (Order.commissionPercent).
 */
export async function alterarComissao(storeId: string, texto: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  const novo = Number(texto.replace(",", ".").replace("%", "").trim());
  const erro = validarComissao(novo);
  if (erro) return { erro };
  const loja = await db.store.findUnique({ where: { id: storeId } });
  if (!loja) return { erro: "Loja não encontrada." };
  if (loja.commissionPercent === novo) return { ok: true };

  await db.$transaction(async (tx) => {
    await tx.store.update({ where: { id: storeId }, data: { commissionPercent: novo } });
    await registrarAcao(
      admin,
      "COMISSAO_ALTERADA",
      { tipo: "Store", id: storeId },
      `${loja.name}: de ${pct(loja.commissionPercent)} para ${pct(novo)} (vale para pedidos novos)`,
      tx,
    );
  });
  refresh();
  return { ok: true };
}

/** Escolhe o plano de anúncio da loja: Nenhum, Destaque ou Premium (fica registrado na auditoria) */
export async function alterarPlano(storeId: string, plano: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  if (!(plano in PLANOS_ANUNCIO)) return { erro: "Plano inválido." };
  const loja = await db.store.findUnique({ where: { id: storeId } });
  if (!loja) return { erro: "Loja não encontrada." };
  if (loja.adPlan === plano) return { ok: true };
  const nome = (p: string) => PLANOS_ANUNCIO[p as PlanoAnuncio] ?? p;
  await db.$transaction(async (tx) => {
    await tx.store.update({ where: { id: storeId }, data: { adPlan: plano } });
    await registrarAcao(
      admin,
      "PLANO_ALTERADO",
      { tipo: "Store", id: storeId },
      `${loja.name}: de ${nome(loja.adPlan)} para ${nome(plano)}`,
      tx,
    );
  });
  refresh();
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Catálogo de materiais
// -----------------------------------------------------------------------------
export type EstadoMaterial = { erro?: string; ok?: string; resposta?: number; enviado?: Record<string, string> };

function lerMaterial(form: FormData) {
  return {
    name: String(form.get("nome") ?? "").trim().replace(/\s+/g, " "),
    category: String(form.get("categoria") ?? ""),
    baseUnit: String(form.get("unidade") ?? ""),
    keywords: String(form.get("palavras") ?? "").trim().slice(0, 300),
    brandMatters: form.get("compararMarca") === "on",
  };
}

function validarMaterial(m: ReturnType<typeof lerMaterial>): string | null {
  if (m.name.length < 3) return "Informe o nome do material.";
  if (!(CATEGORIAS as readonly string[]).includes(m.category)) return "Escolha a categoria.";
  if (!(m.baseUnit in UNIDADES_BASE)) return "Escolha a unidade de comparação.";
  return null;
}

async function criarNoCatalogo(m: ReturnType<typeof lerMaterial>, tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) {
  const ids = new Set((await tx.product.findMany({ select: { id: true } })).map((p) => p.id));
  return tx.product.create({ data: { id: gerarIdMaterial(m.name, ids), ...m } });
}

export async function criarMaterial(_anterior: EstadoMaterial, form: FormData): Promise<EstadoMaterial> {
  const admin = await exigirAdmin();
  const m = lerMaterial(form);
  const enviado = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const erro = validarMaterial(m);
  if (erro) return { erro, enviado, resposta: Date.now() };
  if (await db.product.findFirst({ where: { name: m.name } })) {
    return { erro: "Já existe um material com este nome.", enviado, resposta: Date.now() };
  }
  await db.$transaction(async (tx) => {
    const p = await criarNoCatalogo(m, tx);
    await registrarAcao(admin, "MATERIAL_CRIADO", { tipo: "Product", id: p.id }, `${p.name} (${p.category})`, tx);
  });
  refresh();
  return { ok: `“${m.name}” incluído no catálogo.`, resposta: Date.now() };
}

/** Aprova a sugestão do lojista, criando o material (o admin pode corrigir nome, categoria e unidade) */
export async function aprovarSugestao(sugestaoId: string, form: FormData): Promise<Resultado> {
  const admin = await exigirAdmin();
  const m = lerMaterial(form);
  const erro = validarMaterial(m);
  if (erro) return { erro };
  const sugestao = await db.materialSuggestion.findUnique({ where: { id: sugestaoId }, include: { store: true } });
  if (!sugestao || sugestao.status !== "PENDENTE") return { erro: "Esta sugestão já foi analisada." };
  if (await db.product.findFirst({ where: { name: m.name } })) return { erro: "Já existe um material com este nome." };

  await db.$transaction(async (tx) => {
    const p = await criarNoCatalogo(m, tx);
    await tx.materialSuggestion.update({
      where: { id: sugestaoId },
      data: { status: "APROVADA", productId: p.id, reviewedAt: new Date(), reviewNote: `Incluído como “${p.name}”.` },
    });
    await registrarAcao(admin, "SUGESTAO_APROVADA", { tipo: "MaterialSuggestion", id: sugestaoId }, `${p.name} (sugerido por ${sugestao.store.name})`, tx);
  });
  refresh();
  return { ok: true };
}

export async function recusarSugestao(sugestaoId: string, motivo: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  const erro = validarMotivoAdmin(motivo);
  if (erro) return { erro };
  const sugestao = await db.materialSuggestion.findUnique({ where: { id: sugestaoId }, include: { store: true } });
  if (!sugestao || sugestao.status !== "PENDENTE") return { erro: "Esta sugestão já foi analisada." };
  await db.$transaction(async (tx) => {
    await tx.materialSuggestion.update({
      where: { id: sugestaoId },
      data: { status: "RECUSADA", reviewedAt: new Date(), reviewNote: motivo.trim() },
    });
    await registrarAcao(
      admin,
      "SUGESTAO_RECUSADA",
      { tipo: "MaterialSuggestion", id: sugestaoId },
      `${sugestao.name} (sugerido por ${sugestao.store.name}) — motivo: ${motivo.trim()}`,
      tx,
    );
  });
  refresh();
  return { ok: true };
}
