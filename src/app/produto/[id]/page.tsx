// Página de um material: todas as lojas que vendem, do melhor preço por unidade ao pior.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CartaoOferta } from "@/components/CartaoOferta";
import { UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { montarResultados } from "@/domain/resultados";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

export default async function Produto(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const produto = await db.product.findUnique({
    where: { id },
    include: {
      offers: {
        where: { active: true, store: { status: "APROVADA" } },
        include: {
          store: { select: { id: true, name: true, region: true, featured: true } },
          tiers: { orderBy: { minQuantity: "asc" } },
        },
      },
    },
  });
  if (!produto) notFound();

  const usuario = await usuarioAtual();
  const { grupos } = montarResultados([produto], produto.offers, { ordem: "unidade" });
  const grupo = grupos[0];
  const unidade = UNIDADES_BASE[produto.baseUnit as UnidadeBase] ?? produto.baseUnit;

  return (
    <div className="space-y-4">
      <Link href="/busca" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Voltar para a busca
      </Link>

      <header>
        <p className="text-sm text-slate-500">{produto.category}</p>
        <h1 className="text-2xl leading-tight font-extrabold">{produto.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ordenado pelo menor preço por {unidade}, para comparar embalagens diferentes.
        </p>
      </header>

      {!grupo ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
          Nenhuma loja tem este material no momento.
        </p>
      ) : (
        <div className="space-y-2">
          {grupo.ofertas.map((oferta) => (
            <CartaoOferta
              key={oferta.id}
              oferta={oferta}
              unidadeBase={produto.baseUnit}
              papel={usuario?.role ?? null}
              melhorPreco={oferta.id === grupo.melhorPrecoId}
              patrocinado={oferta.store.featured}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata(props: PageProps<"/produto/[id]">) {
  const { id } = await props.params;
  const produto = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: produto?.name ?? "Material" };
}
