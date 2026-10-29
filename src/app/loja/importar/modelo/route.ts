// Baixar o modelo da planilha de produtos (Excel ou CSV), já preenchido com os
// produtos da loja de quem está logado.
import { db } from "@/lib/db";
import { gerarModeloCsv, gerarModeloXlsx } from "@/lib/planilha";
import { usuarioAtual } from "@/lib/sessao";

export async function GET(request: Request) {
  const usuario = await usuarioAtual();
  if (!usuario || usuario.role !== "LOJISTA") return new Response("Acesso negado.", { status: 403 });
  const loja = await db.store.findUnique({ where: { ownerId: usuario.id } });
  if (!loja) return new Response("Acesso negado.", { status: 403 });

  const ofertas = await db.offer.findMany({
    where: { storeId: loja.id },
    include: { product: { select: { name: true, baseUnit: true } }, tiers: true, catalogItem: { select: { ean: true, brand: true, model: true } } },
    orderBy: [{ product: { category: "asc" } }, { product: { name: "asc" } }, { packageLabel: "asc" }],
  });
  const formato = new URL(request.url).searchParams.get("formato") === "csv" ? "csv" : "xlsx";
  const cabecalhos = (tipo: string, extensao: string) => ({
    "Content-Type": tipo,
    "Content-Disposition": `attachment; filename="solid-produtos-${loja.id.slice(0, 20)}.${extensao}"`,
    "Cache-Control": "no-store",
  });

  if (formato === "csv") {
    return new Response(gerarModeloCsv(ofertas), { headers: cabecalhos("text/csv; charset=utf-8", "csv") });
  }
  const [materiais, itens] = await Promise.all([
    db.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.catalogItem.findMany({
      where: { active: true },
      include: { product: { select: { name: true } } },
      orderBy: [{ productId: "asc" }, { brand: "asc" }, { model: "asc" }],
    }),
  ]);
  const arquivo = await gerarModeloXlsx(ofertas, materiais, itens);
  return new Response(new Uint8Array(arquivo), {
    headers: cabecalhos("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
  });
}
