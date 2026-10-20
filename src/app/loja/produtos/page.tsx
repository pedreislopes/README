// Produtos da loja: edição rápida de preço, disponível/sem estoque e reajuste em massa.
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { ListaProdutosLoja } from "./ListaProdutosLoja";

export const metadata = { title: "Meus produtos" };

export default async function ProdutosLoja(props: PageProps<"/loja/produtos">) {
  const { loja } = await exigirLoja();
  const { salvo, excluido } = await props.searchParams;
  const ofertas = await db.offer.findMany({
    where: { storeId: loja.id },
    include: { product: { select: { name: true, category: true } }, tiers: { orderBy: { minQuantity: "asc" } } },
    orderBy: [{ product: { category: "asc" } }, { product: { name: "asc" } }],
  });

  return (
    <div className="space-y-4">
      {(salvo || excluido) && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> {salvo ? "Produto salvo." : "Produto removido."}
        </p>
      )}
      <Link
        href="/loja/produtos/novo"
        className="flex items-center justify-center gap-2 rounded-xl bg-marca-600 py-3.5 font-bold text-white hover:bg-marca-700"
      >
        <Plus className="h-5 w-5" /> Cadastrar produto
      </Link>
      {ofertas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
          Você ainda não cadastrou produtos.
        </p>
      ) : (
        <ListaProdutosLoja
          produtos={ofertas.map((o) => ({
            id: o.id,
            nome: o.product.name,
            categoria: o.product.category,
            embalagem: o.packageLabel,
            marca: o.brand,
            priceCents: o.priceCents,
            ativo: o.active,
            faixas: o.tiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
          }))}
        />
      )}
    </div>
  );
}
