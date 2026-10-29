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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Cadastrar produto</h2>
      <FormularioProduto
        materiais={materiais}
        valores={{
          productId: "",
          packageLabel: "",
          baseQuantity: "",
          preco: "",
          brand: "",
          quantityStep: "0.5",
          tiersForCpf: false,
          active: true,
          faixas: [],
        }}
      />
    </div>
  );
}
