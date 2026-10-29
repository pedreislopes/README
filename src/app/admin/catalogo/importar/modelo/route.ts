// Modelo da planilha do catálogo de marca (administrador), já com os produtos cadastrados.
import { db } from "@/lib/db";
import { gerarModeloCatalogoXlsx } from "@/lib/planilha";
import { usuarioAtual } from "@/lib/sessao";

export async function GET() {
  const usuario = await usuarioAtual();
  if (!usuario || usuario.role !== "ADMIN") return new Response("Acesso negado.", { status: 403 });
  const [tipos, itens] = await Promise.all([
    db.product.findMany({ where: { brandMatters: true }, select: { id: true, name: true, specTemplate: true }, orderBy: { name: "asc" } }),
    db.catalogItem.findMany({ include: { product: { select: { name: true } } }, orderBy: [{ productId: "asc" }, { brand: "asc" }, { model: "asc" }] }),
  ]);
  const arquivo = await gerarModeloCatalogoXlsx(tipos, itens);
  return new Response(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="solid-catalogo-de-marca.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
