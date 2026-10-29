// Leitura dos produtos de marca (itens do catálogo central) com o menor preço
// entre as lojas. Só entram ofertas ATIVAS de lojas APROVADAS.
import { modeloDe } from "@/config/caracteristicas";
import { custoPorM2Pintado, formatarCaracteristica, lerCaracteristicas } from "@/domain/marcas";
import { formatarReais } from "./dinheiro";
import { db } from "./db";

const ofertasVisiveis = { where: { active: true, store: { status: "APROVADA" } }, include: { store: { select: { name: true } } } } as const;

/** Itens do catálogo, com as ofertas visíveis de cada um */
export async function carregarItensDeMarca(filtro: { productId?: string; ids?: string[] }) {
  const itens = await db.catalogItem.findMany({
    where: { active: true, productId: filtro.productId, id: filtro.ids ? { in: filtro.ids } : undefined },
    include: { offers: ofertasVisiveis, product: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
  return itens.map((item) => {
    const caracteristicas = lerCaracteristicas(item.specs);
    const maisBarata = [...item.offers].sort((a, b) => a.priceCents - b.priceCents)[0] ?? null;
    return {
      ...item,
      caracteristicas,
      modelo: modeloDe(item.product.specTemplate),
      menorPreco: maisBarata ? { priceCents: maisBarata.priceCents, loja: maisBarata.store.name } : null,
      lojas: new Set(item.offers.map((o) => o.storeId)).size,
    };
  });
}

export type ItemDeMarca = Awaited<ReturnType<typeof carregarItensDeMarca>>[number];

/** Custo por m² pintado (tintas), em texto: "R$ 0,92 por m² pintado (1 demão)" */
export function textoCustoPorM2(item: ItemDeMarca, priceCents: number | undefined): string | undefined {
  if (item.product.specTemplate !== "tinta" || priceCents === undefined) return undefined;
  const custo = custoPorM2Pintado(priceCents, item.caracteristicas.rendimento_m2);
  return custo === null ? undefined : `${formatarReais(Math.round(custo))} por m² pintado (1 demão)`;
}

/** As 2 primeiras características preenchidas, para a lista de modelos */
export function destaquesDoItem(item: ItemDeMarca): string[] {
  return (item.modelo?.campos ?? [])
    .filter((c) => item.caracteristicas[c.chave] !== undefined)
    .slice(0, 2)
    .map((c) => (c.tipo === "simnao" ? `${c.rotulo}: ${formatarCaracteristica(c, item.caracteristicas[c.chave])}` : formatarCaracteristica(c, item.caracteristicas[c.chave])));
}
