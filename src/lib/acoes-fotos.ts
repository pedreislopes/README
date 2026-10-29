"use server";

// =============================================================================
// Fotos dos produtos de marca enviadas pelos lojistas.
// A foto só aparece no site depois que o administrador aprova.
// =============================================================================

import { redirect } from "next/navigation";
import { db } from "./db";
import { processarFoto } from "./fotos";
import { exigirLoja } from "./loja";

export type EstadoFoto = { erro?: string; resposta?: number };

export async function enviarFotoDaLoja(_anterior: EstadoFoto, form: FormData): Promise<EstadoFoto> {
  const { loja } = await exigirLoja();
  const itemId = String(form.get("itemId") ?? "");
  const source = String(form.get("origem") ?? "").trim().slice(0, 120);
  const authorization = String(form.get("autorizacao") ?? "").trim().slice(0, 300);
  const erro = (texto: string) => ({ erro: texto, resposta: Date.now() });

  const item = await db.catalogItem.findFirst({ where: { id: itemId, active: true }, select: { id: true, photoId: true } });
  if (!item) return erro("Produto não encontrado.");
  if (item.photoId) return erro("Este produto já tem foto no site.");
  if (!source) return erro("Informe a origem da imagem.");
  if (authorization.length < 5) return erro("Explique a autorização de uso (ex.: foto tirada pela equipe da loja).");
  if (form.get("declaro") !== "on") return erro("Confirme que a loja pode usar esta imagem.");
  const pendente = await db.photoSubmission.findFirst({ where: { catalogItemId: item.id, storeId: loja.id, status: "PENDENTE" } });
  if (pendente) return erro("Você já enviou uma foto deste produto. Aguarde a análise.");

  const foto = await processarFoto(form.get("foto") as File | null);
  if ("erro" in foto) return erro(foto.erro);

  await db.$transaction(async (tx) => {
    const criada = await tx.photo.create({ data: { ...foto, public: false }, select: { id: true } });
    await tx.photoSubmission.create({ data: { catalogItemId: item.id, storeId: loja.id, photoId: criada.id, source, authorization } });
  });
  redirect("/loja/produtos?foto=1");
}
