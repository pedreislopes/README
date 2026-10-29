import Link from "next/link";
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
    include: {
      tiers: { orderBy: { minQuantity: "asc" } },
      catalogItem: {
        select: { id: true, brand: true, model: true, photoId: true, photoSubmissions: { where: { storeId: loja.id }, orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!oferta) notFound();

  const materiais = await db.product.findMany({
    select: { id: true, name: true, category: true, baseUnit: true, brandMatters: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  // Catálogo central de produtos de marca (o lojista só escolhe)
  const itens = await db.catalogItem.findMany({
    where: { active: true },
    select: { id: true, productId: true, brand: true, model: true, ean: true, packageLabel: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Editar produto</h2>
      {oferta.catalogItem && !oferta.catalogItem.photoId && (
        <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          {oferta.catalogItem.photoSubmissions[0]?.status === "PENDENTE" ? (
            <>📷 Sua foto deste produto foi enviada e aguarda a aprovação do Solid.</>
          ) : (
            <>
              📷 <strong>{oferta.catalogItem.brand} {oferta.catalogItem.model}</strong> ainda não tem foto no site.{" "}
              <Link href={`/loja/foto/${oferta.catalogItem.id}`} className="font-semibold text-marca-700 underline">
                Enviar foto
              </Link>
              {oferta.catalogItem.photoSubmissions[0]?.status === "RECUSADA" && " (a foto anterior foi recusada)"}
            </>
          )}
        </p>
      )}
      <FormularioProduto
        materiais={materiais}
        itens={itens}
        valores={{
          id: oferta.id,
          productId: oferta.productId,
          packageLabel: oferta.packageLabel,
          baseQuantity: String(oferta.baseQuantity).replace(".", ","),
          preco: reais(oferta.priceCents),
          brand: oferta.brand ?? "",
          catalogItemId: oferta.catalogItemId ?? "",
          quantityStep: String(oferta.quantityStep),
          tiersForCpf: oferta.tiersForCpf,
          active: oferta.active,
          faixas: oferta.tiers.map((t) => ({ min: String(t.minQuantity), preco: reais(t.priceCents) })),
        }}
      />
    </div>
  );
}
