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
      store: { select: { id: true, name: true, region: true, adPlan: true } },
      tiers: { orderBy: { minQuantity: "asc" } },
      catalogItem: { select: { model: true, photoId: true } },
    },
  });
  const produtos = await db.product.findMany({
    where: { id: { in: [...new Set(ofertas.map((o) => o.productId))] } },
    orderBy: { name: "asc" },
    include: { catalogItems: { where: { active: true }, select: { brand: true, model: true, ean: true } } },
  });
  // Marca, modelo e código de barras dos produtos de marca também são encontrados na busca
  // (ex.: buscar "Forja Cerrado" ou o código de barras traz o martelo)
  return {
    ofertas,
    produtos: produtos.map(({ catalogItems, ...p }) => ({
      ...p,
      keywords: [p.keywords, ...catalogItems.map((i) => `${i.brand} ${i.model} ${i.ean ?? ""}`)].join(" "),
    })),
  };
}
