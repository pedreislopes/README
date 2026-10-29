import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { FormularioProduto } from "../FormularioProduto";

export const metadata = { title: "Editar produto" };

const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default async function EditarProduto(props: PageProps<"/loja/produtos/[id]">) {
  const { loja } = await exigirLoja();
  const { id } = await props.params;
  // Só encontra se o produto for DESTA loja; de outra loja, a página não existe
  const oferta = await db.offer.findFirst({
    where: { id, storeId: loja.id },
    include: { tiers: { orderBy: { minQuantity: "asc" } } },
  });
  if (!oferta) notFound();

  const materiais = await db.product.findMany({
    select: { id: true, name: true, category: true, baseUnit: true, brandMatters: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Editar produto</h2>
      <FormularioProduto
        materiais={materiais}
        valores={{
          id: oferta.id,
          productId: oferta.productId,
          packageLabel: oferta.packageLabel,
          baseQuantity: String(oferta.baseQuantity).replace(".", ","),
          preco: reais(oferta.priceCents),
          brand: oferta.brand ?? "",
          quantityStep: String(oferta.quantityStep),
          tiersForCpf: oferta.tiersForCpf,
          active: oferta.active,
          faixas: oferta.tiers.map((t) => ({ min: String(t.minQuantity), preco: reais(t.priceCents) })),
        }}
      />
    </div>
  );
}
