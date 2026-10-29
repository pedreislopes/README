"use server";

// =============================================================================
// Importação de produtos por planilha. Como todas as ações do painel do
// lojista, começa com exigirLoja() e só mexe nos produtos da loja de quem está
// logado. Duas etapas: PRÉVIA (nada é gravado) e CONFIRMAR (grava tudo junto).
// =============================================================================

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  chaveDoProduto,
  mudancasEntre,
  planejarImportacao,
  type LinhaValida,
  type ResultadoLinha,
  type ResumoImportacao,
  VALIDADE_PREVIA_MS,
} from "@/domain/importacao";
import { db } from "./db";
import { exigirLoja } from "./loja";
import { lerArquivoPlanilha } from "./planilha";

export type EstadoImportacao = { erro?: string; resposta?: number };

/** Produtos atuais da loja no formato usado pela comparação */
async function ofertasDaLoja(storeId: string) {
  const ofertas = await db.offer.findMany({ where: { storeId }, include: { tiers: true } });
  return ofertas.map((o) => ({
    id: o.id,
    productId: o.productId,
    packageLabel: o.packageLabel,
    baseQuantity: o.baseQuantity,
    priceCents: o.priceCents,
    brand: o.brand,
    active: o.active,
    quantityStep: o.quantityStep,
    tiersForCpf: o.tiersForCpf,
    tiers: o.tiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
  }));
}

/** 1ª etapa: lê a planilha, compara e guarda a prévia (sem alterar nenhum produto) */
export async function previaImportacao(_anterior: EstadoImportacao, form: FormData): Promise<EstadoImportacao> {
  const { usuario, loja } = await exigirLoja();
  const arquivo = form.get("planilha");
  if (!(arquivo instanceof File)) return { erro: "Escolha o arquivo da planilha.", resposta: Date.now() };

  const lido = await lerArquivoPlanilha(arquivo);
  if ("erro" in lido) return { erro: lido.erro, resposta: Date.now() };

  const catalogo = await db.product.findMany({ select: { id: true, name: true, brandMatters: true } });
  const plano = planejarImportacao(lido.tabela, catalogo, await ofertasDaLoja(loja.id));
  if (plano.erroGeral) return { erro: plano.erroGeral, resposta: Date.now() };

  const importacao = await db.$transaction(async (tx) => {
    // Só uma prévia aberta por loja: a anterior é descartada
    await tx.storeImport.updateMany({ where: { storeId: loja.id, status: "PREVIA" }, data: { status: "DESCARTADA" } });
    return tx.storeImport.create({
      data: {
        storeId: loja.id,
        userName: usuario.name,
        fileName: arquivo.name.slice(0, 120),
        rows: JSON.stringify(plano.linhas),
        summary: JSON.stringify(plano.resumo),
      },
    });
  });
  redirect(`/loja/importar/${importacao.id}`);
}

/**
 * 2ª etapa: grava as linhas sem erro. A comparação é refeita com os produtos de
 * AGORA (se algo mudou desde a prévia, vale o que está na planilha).
 */
export async function confirmarImportacao(id: string): Promise<EstadoImportacao> {
  const { loja } = await exigirLoja();
  const importacao = await db.storeImport.findFirst({ where: { id, storeId: loja.id } });
  if (!importacao || importacao.status !== "PREVIA") return { erro: "Esta importação já foi confirmada ou descartada." };
  if (Date.now() - importacao.createdAt.getTime() > VALIDADE_PREVIA_MS) {
    return { erro: "Esta prévia venceu (vale 24 horas). Envie a planilha de novo." };
  }

  const linhas = (JSON.parse(importacao.rows) as ResultadoLinha[]).filter((l) => l.dados);
  const catalogo = new Set((await db.product.findMany({ select: { id: true } })).map((p) => p.id));
  const atuais = new Map((await ofertasDaLoja(loja.id)).map((o) => [chaveDoProduto(o.productId, o.packageLabel), o]));

  const resumo: ResumoImportacao = { precosAlterados: 0, novos: 0, outrosAlterados: 0, semMudanca: 0, erros: 0 };
  const gravar: { dados: LinhaValida; offerId?: string }[] = [];
  for (const { dados } of linhas) {
    if (!dados || !catalogo.has(dados.productId)) {
      resumo.erros++;
      continue;
    }
    const atual = atuais.get(chaveDoProduto(dados.productId, dados.packageLabel));
    if (!atual) {
      resumo.novos++;
      gravar.push({ dados });
    } else if (mudancasEntre(atual, dados).length > 0) {
      if (atual.priceCents !== dados.priceCents) resumo.precosAlterados++;
      else resumo.outrosAlterados++;
      gravar.push({ dados, offerId: atual.id });
    } else {
      resumo.semMudanca++;
    }
  }
  resumo.erros += (JSON.parse(importacao.summary) as ResumoImportacao).erros;

  const jaConfirmada = new Error("Importação já confirmada.");
  try {
    await db.$transaction(
      async (tx) => {
        // Marca primeiro: com dois cliques seguidos, só o primeiro grava
        const marcada = await tx.storeImport.updateMany({
          where: { id, storeId: loja.id, status: "PREVIA" },
          data: { status: "APLICADA", appliedAt: new Date(), summary: JSON.stringify(resumo) },
        });
        if (marcada.count !== 1) throw jaConfirmada;

        for (const { dados, offerId } of gravar) {
          const campos = {
            packageLabel: dados.packageLabel,
            baseQuantity: dados.baseQuantity,
            priceCents: dados.priceCents,
            brand: dados.brand,
            active: dados.active,
            quantityStep: dados.quantityStep,
            tiersForCpf: dados.tiersForCpf,
          };
          if (offerId) {
            await tx.priceTier.deleteMany({ where: { offerId } });
            // storeId no filtro: só altera produto desta loja
            await tx.offer.update({ where: { id: offerId, storeId: loja.id }, data: { ...campos, tiers: { create: dados.tiers } } });
          } else {
            await tx.offer.create({ data: { ...campos, storeId: loja.id, productId: dados.productId, tiers: { create: dados.tiers } } });
          }
        }
      },
      { timeout: 60_000 },
    );
  } catch (erro) {
    if (erro === jaConfirmada) return { erro: "Esta importação já foi confirmada." };
    throw erro;
  }
  refresh();
  return {};
}

export async function descartarImportacao(id: string): Promise<EstadoImportacao> {
  const { loja } = await exigirLoja();
  await db.storeImport.updateMany({ where: { id, storeId: loja.id, status: "PREVIA" }, data: { status: "DESCARTADA" } });
  redirect("/loja/importar");
}
