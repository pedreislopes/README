"use server";

// =============================================================================
// Catálogo central de produtos de marca: ações do ADMINISTRADOR.
// Todas começam com exigirAdmin() e gravam o registro de auditoria junto.
// =============================================================================

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { modeloDe } from "@/config/caracteristicas";
import { planejarImportacaoCatalogo, textoResumoCatalogo, type LinhaCatalogo, type ResumoCatalogo } from "@/domain/importacao-catalogo";
import { VALIDADE_PREVIA_MS } from "@/domain/importacao";
import { eanValido, normalizarEan, validarCaracteristicas } from "@/domain/marcas";
import { validarMotivoAdmin } from "@/domain/catalogo";
import { exigirAdmin } from "./admin";
import { registrarAcao } from "./auditoria";
import { db } from "./db";
import { processarFoto } from "./fotos";
import { lerArquivoPlanilha } from "./planilha";

export type EstadoItem = { erro?: string; erros?: string[]; enviado?: Record<string, string>; resposta?: number };
export type Resultado = { ok?: boolean; erro?: string };

const numero = (t: FormDataEntryValue | null) => Number(String(t ?? "").replace(/\./g, "").replace(",", "."));

/** Cadastrar ou editar um produto de marca (com características e foto) */
export async function salvarItemDeMarca(_anterior: EstadoItem, form: FormData): Promise<EstadoItem> {
  const admin = await exigirAdmin();
  const enviado = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, String(v)]));
  const id = String(form.get("id") ?? "") || null;
  const sugestaoId = String(form.get("sugestaoId") ?? "") || null;
  const falhar = (erros: string[]) => ({ erros, enviado, resposta: Date.now() });

  const atual = id ? await db.catalogItem.findUnique({ where: { id } }) : null;
  if (id && !atual) return falhar(["Produto não encontrado."]);
  const tipo = await db.product.findFirst({ where: { id: atual?.productId ?? String(form.get("tipo") ?? ""), brandMatters: true } });
  const brand = String(form.get("marca") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const model = String(form.get("modelo") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const ean = normalizarEan(String(form.get("ean") ?? ""));
  const packageLabel = String(form.get("embalagem") ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  const baseQuantity = numero(form.get("quantidade"));
  const active = form.get("ativo") === "on";
  const source = String(form.get("origem") ?? "").trim().slice(0, 120);
  const authorization = String(form.get("autorizacao") ?? "").trim().slice(0, 300);
  const removerFoto = form.get("removerFoto") === "on";
  const arquivo = form.get("foto");
  const temArquivo = arquivo instanceof File && arquivo.size > 0;

  const erros: string[] = [];
  if (!tipo) erros.push("Escolha o tipo de produto.");
  if (brand.length < 2) erros.push("Informe a marca.");
  if (!model) erros.push("Informe o modelo.");
  if (ean && !eanValido(ean)) erros.push("Código de barras inválido: confira os números.");
  if (!packageLabel) erros.push("Informe a embalagem (ex.: Unidade, Lata 18 L).");
  if (!(baseQuantity > 0)) erros.push("Informe quanto vem na embalagem.");
  const brutos = Object.fromEntries([...form.entries()].filter(([k]) => k.startsWith("carac_")).map(([k, v]) => [k.slice(6), v]));
  const { valores, erros: errosCarac } = validarCaracteristicas(modeloDe(tipo?.specTemplate), brutos);
  erros.push(...errosCarac);
  const ficaComFoto = temArquivo || (!!atual?.photoId && !removerFoto);
  if (ficaComFoto && (!source || authorization.length < 5)) {
    erros.push("Com foto, informe a origem da imagem e a autorização de uso.");
  }
  if (ean) {
    const dono = await db.catalogItem.findUnique({ where: { ean }, select: { id: true, brand: true, model: true } });
    if (dono && dono.id !== id) erros.push(`Este código de barras já é de ${dono.brand} ${dono.model}.`);
  }
  if (erros.length) return falhar(erros);

  const foto = temArquivo ? await processarFoto(arquivo as File) : null;
  if (foto && "erro" in foto) return falhar([foto.erro]);

  const salvo = await db.$transaction(async (tx) => {
    const photoId = foto ? (await tx.photo.create({ data: { ...foto, public: true }, select: { id: true } })).id : removerFoto ? null : atual?.photoId ?? null;
    const dados = {
      brand,
      model,
      ean: ean || null,
      packageLabel,
      baseQuantity,
      specs: JSON.stringify(valores),
      active,
      photoId,
      photoSource: photoId ? source : null,
      photoAuthorization: photoId ? authorization : null,
    };
    const item = atual
      ? await tx.catalogItem.update({ where: { id: atual.id }, data: dados })
      : await tx.catalogItem.create({ data: { ...dados, productId: tipo!.id } });
    // A foto antiga sai do site quando é trocada ou removida (fica guardada só para o histórico)
    if (atual?.photoId && atual.photoId !== photoId) {
      await tx.photo.update({ where: { id: atual.photoId }, data: { public: false } });
    }
    // As ofertas das lojas acompanham o catálogo (marca, embalagem e quantidade)
    await tx.offer.updateMany({ where: { catalogItemId: item.id }, data: { brand, packageLabel, baseQuantity } });

    const detalhe = `${tipo!.name}: ${brand} ${model}${ean ? ` (EAN ${ean})` : ""}${foto ? " — foto nova" : removerFoto && atual?.photoId ? " — foto removida" : ""}`;
    await registrarAcao(admin, atual ? "PRODUTO_MARCA_ALTERADO" : "PRODUTO_MARCA_CRIADO", { tipo: "CatalogItem", id: item.id }, detalhe, tx);

    if (sugestaoId && !atual) {
      const sugestao = await tx.materialSuggestion.findFirst({ where: { id: sugestaoId, status: "PENDENTE" }, include: { store: true } });
      if (sugestao) {
        await tx.materialSuggestion.update({
          where: { id: sugestao.id },
          data: { status: "APROVADA", catalogItemId: item.id, reviewedAt: new Date(), reviewNote: `Incluído no catálogo: ${brand} ${model}.` },
        });
        await registrarAcao(admin, "SUGESTAO_APROVADA", { tipo: "MaterialSuggestion", id: sugestao.id }, `${brand} ${model} (sugerido por ${sugestao.store.name})`, tx);
      }
    }
    return item;
  });
  redirect(`/admin/catalogo?salvo=${salvo.id}`);
}

// -----------------------------------------------------------------------------
// Fotos enviadas pelos lojistas
// -----------------------------------------------------------------------------
export async function aprovarFoto(envioId: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  const envio = await db.photoSubmission.findUnique({ where: { id: envioId }, include: { store: true, catalogItem: true } });
  if (!envio || envio.status !== "PENDENTE") return { erro: "Esta foto já foi analisada." };
  if (envio.catalogItem.photoId) return { erro: "Este produto já tem foto. Para trocar, edite o produto." };
  await db.$transaction(async (tx) => {
    await tx.photo.update({ where: { id: envio.photoId }, data: { public: true } });
    await tx.catalogItem.update({
      where: { id: envio.catalogItemId },
      data: { photoId: envio.photoId, photoSource: `${envio.source} (${envio.store.name})`, photoAuthorization: envio.authorization },
    });
    await tx.photoSubmission.update({ where: { id: envio.id }, data: { status: "APROVADA", reviewedAt: new Date() } });
    await registrarAcao(
      admin,
      "FOTO_APROVADA",
      { tipo: "PhotoSubmission", id: envio.id },
      `${envio.catalogItem.brand} ${envio.catalogItem.model} — enviada por ${envio.store.name}`,
      tx,
    );
  });
  refresh();
  return { ok: true };
}

export async function recusarFoto(envioId: string, motivo: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  const erro = validarMotivoAdmin(motivo);
  if (erro) return { erro };
  const envio = await db.photoSubmission.findUnique({ where: { id: envioId }, include: { store: true, catalogItem: true } });
  if (!envio || envio.status !== "PENDENTE") return { erro: "Esta foto já foi analisada." };
  await db.$transaction(async (tx) => {
    await tx.photoSubmission.update({ where: { id: envio.id }, data: { status: "RECUSADA", reviewNote: motivo.trim(), reviewedAt: new Date() } });
    await registrarAcao(
      admin,
      "FOTO_RECUSADA",
      { tipo: "PhotoSubmission", id: envio.id },
      `${envio.catalogItem.brand} ${envio.catalogItem.model} — enviada por ${envio.store.name} — motivo: ${motivo.trim()}`,
      tx,
    );
  });
  refresh();
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Importação do catálogo por planilha
// -----------------------------------------------------------------------------
export type EstadoImportacaoCatalogo = { erro?: string; resposta?: number };

const tiposDeMarca = () => db.product.findMany({ where: { brandMatters: true }, select: { id: true, name: true, specTemplate: true, brandMatters: true } });
const itensAtuais = () =>
  db.catalogItem.findMany({ select: { id: true, productId: true, brand: true, model: true, ean: true, packageLabel: true, baseQuantity: true, specs: true } });

export async function previaImportacaoCatalogo(_anterior: EstadoImportacaoCatalogo, form: FormData): Promise<EstadoImportacaoCatalogo> {
  const admin = await exigirAdmin();
  const arquivo = form.get("planilha");
  if (!(arquivo instanceof File)) return { erro: "Escolha o arquivo da planilha.", resposta: Date.now() };
  const lido = await lerArquivoPlanilha(arquivo);
  if ("erro" in lido) return { erro: lido.erro, resposta: Date.now() };
  const plano = planejarImportacaoCatalogo(lido.tabela, await tiposDeMarca(), await itensAtuais());
  if (plano.erroGeral) return { erro: plano.erroGeral, resposta: Date.now() };

  const importacao = await db.$transaction(async (tx) => {
    await tx.catalogImport.updateMany({ where: { status: "PREVIA" }, data: { status: "DESCARTADA" } });
    return tx.catalogImport.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        fileName: arquivo.name.slice(0, 120),
        rows: JSON.stringify(plano.linhas),
        summary: JSON.stringify(plano.resumo),
      },
    });
  });
  redirect(`/admin/catalogo/importar/${importacao.id}`);
}

export async function confirmarImportacaoCatalogo(id: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  const importacao = await db.catalogImport.findUnique({ where: { id } });
  if (!importacao || importacao.status !== "PREVIA") return { erro: "Esta importação já foi confirmada ou descartada." };
  if (Date.now() - importacao.createdAt.getTime() > VALIDADE_PREVIA_MS) return { erro: "Esta prévia venceu (vale 24 horas). Envie a planilha de novo." };

  const resumo = JSON.parse(importacao.summary) as ResumoCatalogo;
  const linhas = (JSON.parse(importacao.rows) as LinhaCatalogo[]).filter((l) => l.dados && (l.tipo === "NOVO" || l.tipo === "ALTERADO"));
  const jaConfirmada = new Error("já confirmada");
  try {
    await db.$transaction(
      async (tx) => {
        const marcada = await tx.catalogImport.updateMany({ where: { id, status: "PREVIA" }, data: { status: "APLICADA", appliedAt: new Date() } });
        if (marcada.count !== 1) throw jaConfirmada;
        for (const l of linhas) {
          const d = l.dados!;
          const dados = { productId: d.productId, brand: d.brand, model: d.model, packageLabel: d.packageLabel, baseQuantity: d.baseQuantity, specs: JSON.stringify(d.specs) };
          // Pelo código de barras: atualiza se já existir (mesmo que tenha sido criado depois da prévia)
          const item = await tx.catalogItem.upsert({ where: { ean: d.ean }, create: { ...dados, ean: d.ean }, update: dados });
          await tx.offer.updateMany({ where: { catalogItemId: item.id }, data: { brand: d.brand, packageLabel: d.packageLabel, baseQuantity: d.baseQuantity } });
        }
        await registrarAcao(admin, "CATALOGO_IMPORTADO", { tipo: "CatalogImport", id }, `${importacao.fileName}: ${textoResumoCatalogo(resumo)}`, tx);
      },
      { timeout: 60_000 },
    );
  } catch (erro) {
    if (erro === jaConfirmada) return { erro: "Esta importação já foi confirmada." };
    throw erro;
  }
  refresh();
  return { ok: true };
}

export async function descartarImportacaoCatalogo(id: string) {
  await exigirAdmin();
  await db.catalogImport.updateMany({ where: { id, status: "PREVIA" }, data: { status: "DESCARTADA" } });
  redirect("/admin/catalogo/importar");
}
