// Comparação lado a lado de 2 a 3 produtos de marca do mesmo tipo:
// /comparar?item=<id>&item=<id>(&item=<id>)
// Só informações objetivas: marca, características cadastradas e o menor preço.
import { Fragment } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FotoProduto } from "@/components/FotoProduto";
import { NAO_INFORMADO } from "@/config/caracteristicas";
import { linhasDaComparacao, validarEscolha } from "@/domain/marcas";
import { formatarReais } from "@/lib/dinheiro";
import { carregarItensDeMarca, textoCustoPorM2 } from "@/lib/marcas";

export const metadata = { title: "Comparar produtos" };

export default async function Comparar(props: PageProps<"/comparar">) {
  const { item } = await props.searchParams;
  const ids = [...new Set((Array.isArray(item) ? item : item ? [item] : []).filter((x) => typeof x === "string"))].slice(0, 10);
  const encontrados = ids.length ? await carregarItensDeMarca({ ids }) : [];
  // Mantém a ordem em que o cliente marcou
  const itens = ids.map((id) => encontrados.find((i) => i.id === id)).filter((i) => i !== undefined);
  const erro = itens.length < ids.length ? "Algum dos produtos escolhidos não está mais no catálogo." : validarEscolha(itens);

  if (erro || itens.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold">Comparar produtos</h1>
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          {erro ?? "Escolha os produtos para comparar."} Na página de um produto de marca, marque “Comparar” em 2 ou 3 modelos.
        </p>
        <Link href="/busca" className="font-semibold text-marca-700">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  const produto = itens[0].product;
  const modelo = itens[0].modelo;
  const linhas = linhasDaComparacao(modelo, itens);
  const custos = itens.map((i) => textoCustoPorM2(i, i.menorPreco?.priceCents));
  const n = itens.length;

  // Cada característica: uma linha com o nome (ocupando a largura toda) e, abaixo,
  // os valores lado a lado. Assim a tabela cabe na tela do celular.
  const tabela: { rotulo: string; valores: { texto: string; forte?: boolean; detalhe?: string }[] }[] = [
    {
      rotulo: "Menor preço",
      valores: itens.map((i) =>
        i.menorPreco
          ? { texto: formatarReais(i.menorPreco.priceCents), forte: true, detalhe: i.menorPreco.loja }
          : { texto: "Nenhuma loja vende agora" },
      ),
    },
    ...(custos.some(Boolean)
      ? [{ rotulo: "Custo por m² pintado (1 demão)", valores: custos.map((c) => ({ texto: c ? c.replace(" por m² pintado (1 demão)", "/m²") : NAO_INFORMADO, forte: true })) }]
      : []),
    { rotulo: "Embalagem", valores: itens.map((i) => ({ texto: i.packageLabel })) },
    ...linhas.map((l) => ({ rotulo: l.rotulo, valores: l.valores.map((texto) => ({ texto })) })),
  ];

  return (
    <div className="space-y-4">
      <Link href={`/produto/${produto.id}`} className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> {produto.name}
      </Link>
      <h1 className="text-xl leading-tight font-extrabold">Comparar: {produto.name}</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Comparação lado a lado de {n} produtos</caption>
          <thead>
            <tr>
              {itens.map((i) => (
                <th key={i.id} scope="col" className="px-2 pt-3 pb-2 text-left align-top">
                  <FotoProduto fotoId={i.photoId} categoria={produto.category} descricao={`${i.brand} ${i.model}`} tamanho={88} className="mb-2" />
                  <span className="block text-sm font-bold break-words text-slate-900">{i.brand}</span>
                  <span className="block text-sm font-normal break-words text-slate-700">{i.model}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.map((linha) => (
              <Fragment key={linha.rotulo}>
                <tr>
                  <th colSpan={n} scope="colgroup" className="bg-slate-50 px-2 pt-2 pb-1 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {linha.rotulo}
                  </th>
                </tr>
                <tr>
                  {linha.valores.map((v, k) => (
                    <td
                      key={k}
                      className={`px-2 pt-1 pb-2 align-top text-sm break-words ${
                        v.texto === NAO_INFORMADO || v.texto === "Nenhuma loja vende agora"
                          ? "text-slate-400 italic"
                          : v.forte
                            ? "text-base font-bold text-slate-900"
                            : "text-slate-800"
                      }`}
                    >
                      {v.texto}
                      {v.detalhe && <span className="block text-xs font-normal text-slate-500">{v.detalhe}</span>}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
            <tr>
              {itens.map((i) => (
                <td key={i.id} className="px-2 py-3 align-top">
                  <Link href={`/produto/${produto.id}?marca=${encodeURIComponent(i.brand)}`} className="text-sm font-semibold text-marca-700">
                    Ver lojas
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        {custos.some(Boolean) && "Custo por m² = preço da lata ÷ rendimento informado pelo fabricante, para 1 demão. "}
        Características cadastradas pelo Solid a partir das informações do fabricante; confira na embalagem.
      </p>
    </div>
  );
}

