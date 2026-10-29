// Página de um material: todas as lojas que vendem, do melhor preço por unidade ao pior.
// Produtos de marca: filtro por marca, o mais barato de cada marca e os modelos
// para comparar lado a lado.
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft } from "lucide-react";
import { CartaoOferta } from "@/components/CartaoOferta";
import { ListaModelos } from "@/components/ListaModelos";
import { NomeMaterial } from "@/components/NomeMaterial";
import { UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { maisBaratoPorMarca, marcasDasOfertas } from "@/domain/marcas";
import { montarResultados } from "@/domain/resultados";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { carregarItensDeMarca, destaquesDoItem, textoCustoPorM2 } from "@/lib/marcas";
import { usuarioAtual } from "@/lib/sessao";

export default async function Produto(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const { marca: marcaParam } = await props.searchParams;
  const produto = await db.product.findUnique({
    where: { id },
    include: {
      offers: {
        where: { active: true, store: { status: "APROVADA" } },
        include: {
          store: { select: { id: true, name: true, region: true, adPlan: true } },
          tiers: { orderBy: { minQuantity: "asc" } },
          catalogItem: { select: { model: true, photoId: true } },
        },
      },
    },
  });
  if (!produto) notFound();

  const marcas = marcasDasOfertas(produto.offers.map((o) => ({ marca: o.brand })));
  const marca = produto.brandMatters && typeof marcaParam === "string" && marcas.includes(marcaParam) ? marcaParam : undefined;
  const usuario = await usuarioAtual();
  const { grupos } = montarResultados([produto], produto.offers, { ordem: "unidade", marca });
  const grupo = grupos[0];
  const unidade = UNIDADES_BASE[produto.baseUnit as UnidadeBase] ?? produto.baseUnit;

  const itens = produto.brandMatters ? await carregarItensDeMarca({ productId: produto.id }) : [];
  const porMarca = produto.brandMatters ? maisBaratoPorMarca(produto.offers.map((o) => ({ ...o, marca: o.brand }))) : [];
  const enderecoMarca = (m?: string) => `/produto/${produto.id}${m ? `?marca=${encodeURIComponent(m)}` : ""}`;

  return (
    <div className="space-y-5">
      <Link href="/busca" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Voltar para a busca
      </Link>

      <header>
        <p className="text-sm text-slate-500">{produto.category}</p>
        <NomeMaterial id={produto.id} nome={produto.name}>
          <h1 className="text-2xl leading-tight font-extrabold">{produto.name}</h1>
        </NomeMaterial>
        <p className="mt-1 text-sm text-slate-600">
          Ordenado pelo menor preço por {unidade}, para comparar embalagens diferentes.
        </p>
      </header>

      {produto.brandMatters && marcas.length > 0 && (
        <>
          <nav aria-label="Filtrar por marca" className="-mx-1 flex flex-wrap gap-2">
            {[undefined, ...marcas].map((m) => (
              <Link
                key={m ?? "todas"}
                href={enderecoMarca(m)}
                aria-current={m === marca ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  m === marca ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-marca-500"
                }`}
              >
                {m ?? "Todas as marcas"}
              </Link>
            ))}
          </nav>

          {!marca && porMarca.length > 1 && (
            <section aria-labelledby="por-marca" className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 id="por-marca" className="font-bold">
                Mais barato de cada marca
              </h2>
              <ul className="mt-2 divide-y divide-slate-100">
                {porMarca.map(({ marca: m, oferta }, i) => (
                  <li key={m} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <Link href={enderecoMarca(m)} className="font-semibold text-slate-900 hover:text-marca-700">
                        {m}
                      </Link>
                      {i === 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          <BadgeCheck className="h-3.5 w-3.5" /> Melhor preço
                        </span>
                      )}
                      <span className="block truncate text-xs text-slate-500">
                        {oferta.catalogItem?.model} · {oferta.store.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold">{formatarReais(oferta.priceCents)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {itens.length > 0 && (
        <section aria-labelledby="modelos" className="space-y-2">
          <h2 id="modelos" className="font-bold">
            Modelos à venda {marca ? `— ${marca}` : ""}
          </h2>
          <ListaModelos
            categoria={produto.category}
            modelos={itens
              .filter((i) => !marca || i.brand === marca)
              .map((i) => ({
                id: i.id,
                marca: i.brand,
                modelo: i.model,
                fotoId: i.photoId,
                destaques: destaquesDoItem(i),
                aPartirDe: i.menorPreco ? formatarReais(i.menorPreco.priceCents) : null,
                lojas: i.lojas,
                extra: textoCustoPorM2(i, i.menorPreco?.priceCents),
              }))}
          />
        </section>
      )}

      {!grupo ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
          Nenhuma loja tem este material no momento.
        </p>
      ) : (
        <section aria-labelledby="ofertas" className="space-y-2">
          {produto.brandMatters && (
            <h2 id="ofertas" className="font-bold">
              Todas as ofertas {marca ? `— ${marca}` : ""}
            </h2>
          )}
          {grupo.ofertas.map((oferta) => (
            <CartaoOferta
              key={oferta.id}
              oferta={oferta}
              unidadeBase={produto.baseUnit}
              papel={usuario?.role ?? null}
              melhorPreco={oferta.id === grupo.melhorPrecoId}
              plano={oferta.store.adPlan === "PREMIUM" || oferta.store.adPlan === "DESTAQUE" ? oferta.store.adPlan : undefined}
              destacarMarca={produto.brandMatters}
              categoria={produto.category}
            />
          ))}
        </section>
      )}
    </div>
  );
}

export async function generateMetadata(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const produto = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: produto?.name ?? "Material" };
}
