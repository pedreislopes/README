import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { FormularioItemDeMarca } from "../FormularioItemDeMarca";

export const metadata = { title: "Novo produto de marca" };

export default async function NovoItem(props: PageProps<"/admin/catalogo/novo">) {
  await exigirAdmin();
  const { sugestao: sugestaoId } = await props.searchParams;
  const sugestao =
    typeof sugestaoId === "string"
      ? await db.materialSuggestion.findFirst({ where: { id: sugestaoId, kind: "PRODUTO_MARCA", status: "PENDENTE" }, include: { store: true } })
      : null;
  const tipos = await db.product.findMany({ where: { brandMatters: true }, select: { id: true, name: true, specTemplate: true }, orderBy: { name: "asc" } });
  // Embalagem mais comum do tipo sugerido, para adiantar o preenchimento
  const parecido = sugestao?.typeProductId
    ? await db.catalogItem.findFirst({ where: { productId: sugestao.typeProductId }, select: { packageLabel: true, baseQuantity: true } })
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Novo produto de marca</h2>
      {sugestao && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Sugerido por <strong>{sugestao.store.name}</strong>
          {sugestao.note ? ` — “${sugestao.note}”` : ""}. Complete a embalagem e as características e salve para aprovar a
          sugestão.
        </p>
      )}
      <FormularioItemDeMarca
        tipos={tipos}
        sugestaoId={sugestao?.id}
        valores={{
          tipo: sugestao?.typeProductId ?? "",
          marca: sugestao?.brand ?? "",
          modelo: sugestao?.model ?? "",
          ean: sugestao?.ean ?? "",
          embalagem: parecido?.packageLabel ?? "",
          quantidade: parecido ? String(parecido.baseQuantity).replace(".", ",") : "",
          ativo: true,
          caracteristicas: {},
          foto: null,
        }}
      />
    </div>
  );
}
