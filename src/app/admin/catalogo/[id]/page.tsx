import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { lerCaracteristicas } from "@/domain/marcas";
import { FormularioItemDeMarca } from "../FormularioItemDeMarca";

export const metadata = { title: "Editar produto de marca" };

/** Valor guardado -> texto do formulário (sim/não, número com vírgula) */
const comoTexto = (v: unknown) => (v === true ? "Sim" : v === false ? "Não" : typeof v === "number" ? String(v).replace(".", ",") : String(v ?? ""));

export default async function EditarItem(props: PageProps<"/admin/catalogo/[id]">) {
  await exigirAdmin();
  const { id } = await props.params;
  const item = await db.catalogItem.findUnique({ where: { id }, include: { product: { select: { name: true } } } });
  if (!item) notFound();
  const tipos = await db.product.findMany({ where: { brandMatters: true }, select: { id: true, name: true, specTemplate: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">
        {item.brand} {item.model}
      </h2>
      <FormularioItemDeMarca
        tipos={tipos}
        valores={{
          id: item.id,
          tipo: item.productId,
          marca: item.brand,
          modelo: item.model,
          ean: item.ean ?? "",
          embalagem: item.packageLabel,
          quantidade: String(item.baseQuantity).replace(".", ","),
          ativo: item.active,
          caracteristicas: Object.fromEntries(Object.entries(lerCaracteristicas(item.specs)).map(([k, v]) => [k, comoTexto(v)])),
          foto: item.photoId ? { id: item.photoId, origem: item.photoSource ?? "", autorizacao: item.photoAuthorization ?? "" } : null,
        }}
      />
    </div>
  );
}
