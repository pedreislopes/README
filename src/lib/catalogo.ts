// Leitura do catálogo para a busca.
// Só entram ofertas ATIVAS de lojas APROVADAS (lojas pendentes ficam de fora).
//
// No MVP carregamos todas as ofertas e filtramos na memória: são poucas
// centenas, e assim a busca tolerante a erros fica simples. Com milhares de
// produtos, o próximo passo é usar a busca de texto do próprio banco.
import { db } from "./db";

export async function carregarCatalogo() {
  const ofertas = await db.offer.findMany({
    where: { active: true, store: { status: "APROVADA" } },
    include: {
      store: { select: { id: true, name: true, region: true, featured: true } },
      tiers: { orderBy: { minQuantity: "asc" } },
    },
  });
  const produtos = await db.product.findMany({
    where: { id: { in: [...new Set(ofertas.map((o) => o.productId))] } },
    orderBy: { name: "asc" },
  });
  return { ofertas, produtos };
}
