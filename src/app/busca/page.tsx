// Página de busca e comparação de preços: /busca?q=cimento&regiao=Gama&ordem=unidade
import Link from "next/link";
import { ChevronRight, SearchX } from "lucide-react";
import { CartaoOferta } from "@/components/CartaoOferta";
import { FiltrosBusca, type ValoresFiltros } from "@/components/FiltrosBusca";
import { CATEGORIAS, REGIOES } from "@/config/constantes";
import { MATERIAIS_POPULARES } from "@/config/sinonimos";
import { buscarProdutos } from "@/domain/busca";
import { MAX_ANUNCIOS_NO_TOPO } from "@/config/anuncios";
import { escolherAnuncios, montarResultados, type Ordem } from "@/domain/resultados";
import { proximaRodada } from "@/lib/anuncios";
import { carregarCatalogo } from "@/lib/catalogo";
import { reaisParaCentavos } from "@/lib/dinheiro";
import { usuarioAtual } from "@/lib/sessao";

export const metadata = { title: "Buscar materiais" };

/** Quando a busca encontra vários produtos, mostramos só as primeiras ofertas de cada um */
const OFERTAS_POR_PRODUTO = 4;

function texto(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
}

export default async function Busca(props: PageProps<"/busca">) {
  const params = await props.searchParams;
  const valores: ValoresFiltros = {
    q: texto(params.q),
    regiao: REGIOES.find((r) => r === texto(params.regiao)) ?? "",
    categoria: CATEGORIAS.find((c) => c === texto(params.categoria)) ?? "",
    min: texto(params.min),
    max: texto(params.max),
    // Padrão: menor preço por unidade padronizada (o 1º resultado é sempre o "Melhor preço")
    ordem: texto(params.ordem) === "preco" ? "preco" : "unidade",
  };

  const usuario = await usuarioAtual();
  const papel = usuario?.role ?? null;
  const nadaBuscado = !valores.q && !valores.categoria && !valores.regiao;

  const { ofertas, produtos } = await carregarCatalogo();
  const { encontrados, sugeridos } = buscarProdutos(produtos, valores.q);
  const naCategoria = encontrados.filter((p) => !valores.categoria || p.category === valores.categoria);

  const { grupos, destaque } = montarResultados(naCategoria, ofertas, {
    ordem: valores.ordem as Ordem,
    regiao: valores.regiao || undefined,
    precoMin: reaisParaCentavos(valores.min) ?? undefined,
    precoMax: reaisParaCentavos(valores.max) ?? undefined,
  });

  // Anúncios no topo (até MAX_ANUNCIOS_NO_TOPO): Premium primeiro, depois Destaque.
  // Cada plano só gira (rodízio) quando tem mais lojas do que vagas disponíveis.
  const anuncios = (() => {
    if (!destaque) return [];
    const { premium, destaque: lojasDestaque, produto } = destaque;
    const vagasDestaque = Math.max(0, MAX_ANUNCIOS_NO_TOPO - premium.length);
    return escolherAnuncios(
      premium,
      lojasDestaque,
      MAX_ANUNCIOS_NO_TOPO,
      premium.length > MAX_ANUNCIOS_NO_TOPO ? proximaRodada(`${produto.id}:PREMIUM`) : 0,
      lojasDestaque.length > vagasDestaque && vagasDestaque > 0 ? proximaRodada(`${produto.id}:DESTAQUE`) : 0,
    );
  })();

  // Sugestões quando nada foi encontrado: parecidos, ou os mais procurados
  const sugestoes =
    sugeridos.length > 0
      ? sugeridos
      : produtos.filter((p) => MATERIAIS_POPULARES.includes(p.id));

  return (
    <div className="space-y-5">
      <FiltrosBusca valores={valores} />

      {nadaBuscado ? (
        <section>
          <h1 className="text-lg font-bold">O que você precisa para a obra?</h1>
          <p className="mt-1 text-slate-600">Digite o material acima ou escolha uma categoria:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <li key={c}>
                <Link
                  href={`/busca?categoria=${encodeURIComponent(c)}`}
                  className="block rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-marca-500"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : encontrados.length === 0 ? (
        <NadaEncontrado consulta={valores.q} sugestoes={sugestoes} parecidos={sugeridos.length > 0} />
      ) : grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <SearchX className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 font-semibold">Nenhuma loja com esses filtros.</p>
          <p className="text-sm text-slate-600">
            {valores.regiao
              ? `Ainda não temos lojas com esse material em ${valores.regiao}. `
              : ""}
            Tente outra região ou outra faixa de preço.
          </p>
          <Link
            href={`/busca?q=${encodeURIComponent(valores.q)}`}
            className="mt-3 inline-block font-semibold text-marca-700"
          >
            Limpar filtros
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            {grupos.length === 1 ? "1 material encontrado" : `${grupos.length} materiais encontrados`}
            {valores.q && (
              <>
                {" "}para <strong className="text-slate-900">“{valores.q}”</strong>
              </>
            )}
          </p>

          {papel === "CNPJ" && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              Conta empresa: as faixas de atacado aparecem em cada oferta.
            </p>
          )}

          {destaque &&
            anuncios.map(({ oferta, plano }) => (
              <CartaoOferta
                key={`anuncio-${oferta.id}`}
                oferta={oferta}
                unidadeBase={destaque.produto.baseUnit}
                papel={papel}
                plano={plano}
                nomeProduto={destaque.produto.name}
              />
            ))}

          {grupos.map(({ produto, ofertas: doProduto, melhorPrecoId }) => {
            const limite = grupos.length === 1 ? doProduto.length : OFERTAS_POR_PRODUTO;
            return (
              <section key={produto.id} className="space-y-2">
                <div className="flex items-end justify-between gap-2 pt-2">
                  <div>
                    <h2 className="text-lg leading-tight font-bold">{produto.name}</h2>
                    <p className="text-xs text-slate-500">
                      {produto.category} · {doProduto.length}{" "}
                      {doProduto.length === 1 ? "oferta" : "ofertas"}
                    </p>
                  </div>
                </div>
                {doProduto.slice(0, limite).map((oferta) => (
                  <CartaoOferta
                    key={oferta.id}
                    oferta={oferta}
                    unidadeBase={produto.baseUnit}
                    papel={papel}
                    melhorPreco={oferta.id === melhorPrecoId}
                  />
                ))}
                {doProduto.length > limite && (
                  <Link
                    href={`/produto/${produto.id}`}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-marca-700 hover:bg-marca-50"
                  >
                    Ver todas as {doProduto.length} ofertas <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </section>
            );
          })}

          <p className="pt-2 text-xs text-slate-500">
            O selo <strong>Melhor preço</strong> compara o preço por kg, m³, metro ou unidade, para
            ser justo entre embalagens diferentes.
          </p>
        </>
      )}
    </div>
  );
}

function NadaEncontrado({
  consulta,
  sugestoes,
  parecidos,
}: {
  consulta: string;
  sugestoes: { id: string; name: string; category: string }[];
  parecidos: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
        <SearchX className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 font-semibold">Não encontramos “{consulta}”.</p>
        <p className="text-sm text-slate-600">Confira se o nome está certo ou veja as sugestões abaixo.</p>
      </div>
      <h2 className="font-bold">{parecidos ? "Materiais parecidos" : "Materiais mais procurados"}</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {sugestoes.map((p) => (
          <li key={p.id}>
            <Link href={`/produto/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <span>
                <span className="block font-medium">{p.name}</span>
                <span className="block text-xs text-slate-500">{p.category}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
