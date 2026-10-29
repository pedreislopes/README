"use server";

// =============================================================================
// Ações do painel do lojista. TODAS começam com exigirLoja() e filtram pelo
// id da loja de quem está logado (ver src/lib/loja.ts).
// =============================================================================

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIAS, UNIDADES_BASE, type StatusPedido } from "@/config/constantes";
import { eanValido, normalizarEan } from "@/domain/marcas";
import { PROXIMO_STATUS, reajustarPreco, validarOferta, validarPercentual, type ErrosOferta } from "@/domain/ofertas";
import { db } from "./db";
import { reaisParaCentavos } from "./dinheiro";
import { exigirLoja } from "./loja";

export type ResultadoLoja = { ok?: boolean; erro?: string };

const numero = (t: FormDataEntryValue | null) => Number(String(t ?? "").replace(",", "."));

// -----------------------------------------------------------------------------
// Cadastrar / editar produto
// -----------------------------------------------------------------------------
export type EstadoProduto = {
  erros?: ErrosOferta & { geral?: string };
  /** O que foi digitado, para o formulário não apagar tudo quando há erro */
  enviado?: Record<string, string>;
  /** Muda a cada resposta: faz o formulário ser redesenhado com os valores enviados */
  resposta?: number;
};

export async function salvarProduto(_anterior: EstadoProduto, form: FormData): Promise<EstadoProduto> {
  const { loja } = await exigirLoja();
  const id = String(form.get("id") ?? "") || null;
  const enviado = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));

  const tiers = [0, 1, 2]
    .map((i) => ({ min: String(form.get(`faixaMin${i}`) ?? "").trim(), preco: String(form.get(`faixaPreco${i}`) ?? "").trim() }))
    .filter((f) => f.min || f.preco)
    .map((f) => ({ minQuantity: Number(f.min), priceCents: reaisParaCentavos(f.preco) ?? 0 }));

  const dados = {
    productId: String(form.get("productId") ?? ""),
    packageLabel: String(form.get("packageLabel") ?? "").trim(),
    baseQuantity: numero(form.get("baseQuantity")),
    priceCents: reaisParaCentavos(String(form.get("preco") ?? "")) ?? 0,
    quantityStep: numero(form.get("quantityStep")) || 1,
    tiers,
    brand: String(form.get("brand") ?? "").trim() || null,
    catalogItemId: null as string | null,
  };
  const material = dados.productId ? await db.product.findUnique({ where: { id: dados.productId } }) : null;
  // Produto de marca: embalagem, quantidade e marca vêm do item do catálogo central
  if (material?.brandMatters) {
    const item = await db.catalogItem.findFirst({
      where: { id: String(form.get("catalogItemId") ?? ""), productId: material.id, active: true },
    });
    if (item) {
      Object.assign(dados, { catalogItemId: item.id, packageLabel: item.packageLabel, baseQuantity: item.baseQuantity, brand: item.brand });
    }
  }
  const erros: EstadoProduto["erros"] = validarOferta({ ...dados, exigeItemDeMarca: material?.brandMatters });
  if (dados.productId && !material) erros.productId = "Material não encontrado.";
  if (Object.keys(erros).length > 0) return { erros, enviado, resposta: Date.now() };

  // O mesmo produto repetido na loja (de marca: o mesmo item; padronizado: mesma embalagem)
  const repetida = await db.offer.findFirst({
    where: {
      storeId: loja.id,
      NOT: id ? { id } : undefined,
      ...(dados.catalogItemId ? { catalogItemId: dados.catalogItemId } : { productId: dados.productId, packageLabel: dados.packageLabel, catalogItemId: null }),
    },
  });
  if (repetida) {
    const erro = dados.catalogItemId
      ? { catalogItemId: "Você já cadastrou este produto." }
      : { packageLabel: "Você já cadastrou este material com esta embalagem." };
    return { erros: erro, enviado, resposta: Date.now() };
  }

  const campos = {
    productId: dados.productId,
    packageLabel: dados.packageLabel,
    baseQuantity: dados.baseQuantity,
    priceCents: dados.priceCents,
    quantityStep: dados.quantityStep,
    brand: dados.brand,
    catalogItemId: dados.catalogItemId,
    tiersForCpf: form.get("tiersForCpf") === "on",
    active: form.get("active") === "on",
  };

  if (id) {
    const existente = await db.offer.findFirst({ where: { id, storeId: loja.id } });
    if (!existente) return { erros: { geral: "Produto não encontrado." } };
    await db.$transaction([
      db.priceTier.deleteMany({ where: { offerId: id } }),
      db.offer.update({ where: { id }, data: { ...campos, tiers: { create: tiers } } }),
    ]);
  } else {
    await db.offer.create({ data: { ...campos, storeId: loja.id, tiers: { create: tiers } } });
  }
  redirect("/loja/produtos?salvo=1");
}

export async function excluirProduto(id: string) {
  const { loja } = await exigirLoja();
  await db.offer.deleteMany({ where: { id, storeId: loja.id } });
  redirect("/loja/produtos?excluido=1");
}

// -----------------------------------------------------------------------------
// Ações rápidas na lista de produtos
// -----------------------------------------------------------------------------

/** Edição rápida do preço normal, direto na lista */
export async function alterarPreco(id: string, texto: string): Promise<ResultadoLoja> {
  const { loja } = await exigirLoja();
  const priceCents = reaisParaCentavos(texto);
  if (!priceCents) return { erro: "Preço inválido." };
  const oferta = await db.offer.findFirst({ where: { id, storeId: loja.id }, include: { tiers: true } });
  if (!oferta) return { erro: "Produto não encontrado." };
  if (oferta.tiers.some((t) => t.priceCents >= priceCents)) {
    return { erro: "O preço ficou igual ou abaixo do preço de atacado. Ajuste as faixas abrindo o produto." };
  }
  await db.offer.update({ where: { id }, data: { priceCents } });
  refresh();
  return { ok: true };
}

/** Disponível / Sem estoque (sem estoque = some da busca, mas não é apagado) */
export async function alternarDisponivel(id: string): Promise<ResultadoLoja> {
  const { loja } = await exigirLoja();
  const oferta = await db.offer.findFirst({ where: { id, storeId: loja.id } });
  if (!oferta) return { erro: "Produto não encontrado." };
  await db.offer.update({ where: { id }, data: { active: !oferta.active } });
  refresh();
  return { ok: true };
}

/** Reajuste em massa: +X% ou -X% no preço normal E nas faixas de atacado */
export async function reajustarEmMassa(ids: string[], percentual: number): Promise<ResultadoLoja> {
  const { loja } = await exigirLoja();
  const erro = validarPercentual(percentual);
  if (erro) return { erro };
  if (ids.length === 0) return { erro: "Selecione pelo menos um produto." };

  const ofertas = await db.offer.findMany({ where: { id: { in: ids }, storeId: loja.id }, include: { tiers: true } });
  await db.$transaction(
    ofertas.flatMap((o) => [
      db.offer.update({ where: { id: o.id }, data: { priceCents: reajustarPreco(o.priceCents, percentual) } }),
      ...o.tiers.map((t) =>
        db.priceTier.update({ where: { id: t.id }, data: { priceCents: reajustarPreco(t.priceCents, percentual) } }),
      ),
    ]),
  );
  refresh();
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Pedidos
// -----------------------------------------------------------------------------

/** Avança o pedido para a próxima etapa (Novo → Recebido → Separado → Entregue) */
export async function avancarStatus(orderId: string): Promise<ResultadoLoja> {
  const { loja } = await exigirLoja();
  const pedido = await db.order.findFirst({ where: { id: orderId, storeId: loja.id } });
  if (!pedido) return { erro: "Pedido não encontrado." };
  const proximo = PROXIMO_STATUS[pedido.status as StatusPedido];
  if (!proximo) return { erro: "Este pedido já foi entregue." };
  // "status: pedido.status" evita pular etapa se o botão for tocado duas vezes
  await db.order.updateMany({ where: { id: orderId, storeId: loja.id, status: pedido.status }, data: { status: proximo } });
  refresh();
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Sugestão de material novo para o catálogo (o administrador aprova ou recusa)
// -----------------------------------------------------------------------------
export type EstadoSugestao = {
  erro?: string;
  ok?: boolean;
  resposta?: number;
  /** O que foi digitado, para não apagar o formulário quando há erro */
  enviado?: Record<string, string>;
};

export async function sugerirMaterial(_anterior: EstadoSugestao, form: FormData): Promise<EstadoSugestao> {
  const { loja } = await exigirLoja();
  if (form.get("tipo") === "marca") return sugerirProdutoDeMarca(loja.id, form);
  const name = String(form.get("nome") ?? "").trim();
  const category = String(form.get("categoria") ?? "");
  const baseUnit = String(form.get("unidade") ?? "");
  const note = String(form.get("observacao") ?? "").trim().slice(0, 500) || null;
  const enviado = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));

  if (name.length < 3) return { erro: "Informe o nome do material.", resposta: Date.now(), enviado };
  if (!(CATEGORIAS as readonly string[]).includes(category)) return { erro: "Escolha a categoria.", resposta: Date.now(), enviado };
  if (!(baseUnit in UNIDADES_BASE)) return { erro: "Escolha como o preço deve ser comparado.", resposta: Date.now(), enviado };

  // Evita a mesma loja mandar a mesma sugestão duas vezes
  const repetida = await db.materialSuggestion.findFirst({ where: { storeId: loja.id, name, status: "PENDENTE" } });
  if (repetida) return { erro: "Você já enviou esta sugestão. Aguarde a análise.", resposta: Date.now(), enviado };

  await db.materialSuggestion.create({ data: { storeId: loja.id, name, category, baseUnit, note } });
  refresh();
  return { ok: true, resposta: Date.now() };
}

/** Produto de marca: a loja informa só o tipo, a marca, o modelo e o código de barras */
async function sugerirProdutoDeMarca(storeId: string, form: FormData): Promise<EstadoSugestao> {
  const enviado = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const erro = (texto: string) => ({ erro: texto, resposta: Date.now(), enviado });
  const tipo = await db.product.findFirst({ where: { id: String(form.get("tipoProduto") ?? ""), brandMatters: true } });
  const brand = String(form.get("marca") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const model = String(form.get("modelo") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const ean = normalizarEan(String(form.get("codigoBarras") ?? ""));
  const note = String(form.get("observacao") ?? "").trim().slice(0, 500) || null;

  if (!tipo) return erro("Escolha o tipo de produto.");
  if (brand.length < 2) return erro("Informe a marca.");
  if (model.length < 1) return erro("Informe o modelo.");
  if (!eanValido(ean)) return erro("Código de barras inválido. Confira os números embaixo das barras (8, 12, 13 ou 14 números).");

  const existente = await db.catalogItem.findUnique({ where: { ean }, select: { brand: true, model: true } });
  if (existente) return erro(`Este código de barras já está no catálogo: ${existente.brand} ${existente.model}. Cadastre o produto normalmente.`);
  const repetida = await db.materialSuggestion.findFirst({ where: { ean, status: "PENDENTE" } });
  if (repetida) return erro("Este produto já foi sugerido e está em análise.");

  await db.materialSuggestion.create({
    data: {
      storeId,
      kind: "PRODUTO_MARCA",
      name: `${brand} ${model}`,
      category: tipo.category,
      baseUnit: tipo.baseUnit,
      typeProductId: tipo.id,
      brand,
      model,
      ean,
      note,
    },
  });
  refresh();
  return { ok: true, resposta: Date.now() };
}
