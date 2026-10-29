import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { FormularioProduto } from "../FormularioProduto";

export const metadata = { title: "Cadastrar produto" };

export default async function NovoProduto() {
  await exigirLoja();
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
      <h2 className="text-lg font-bold">Cadastrar produto</h2>
      <FormularioProduto
        materiais={materiais}
        itens={itens}
        valores={{
          productId: "",
          packageLabel: "",
          baseQuantity: "",
          preco: "",
          brand: "",
          catalogItemId: "",
          quantityStep: "0.5",
          tiersForCpf: false,
          active: true,
          faixas: [],
        }}
      />
    </div>
  );
}
