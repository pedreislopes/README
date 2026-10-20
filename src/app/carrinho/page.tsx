// Carrinho: itens separados por loja, faixas de atacado aplicadas,
// economia, avisos de mudança de preço e finalização do pedido.
import Link from "next/link";
import { AlertTriangle, Briefcase, MapPin, ShoppingCart, TrendingDown, Truck } from "lucide-react";
import { PERTO_DA_PROXIMA_FAIXA } from "@/config/carrinho";
import { montarCarrinho } from "@/domain/carrinho";
import { atacadoSoParaCnpj } from "@/domain/precos";
import { formatarQuantidade, nomeDaEmbalagem } from "@/domain/quantidades";
import { aceitarNovosPrecos } from "@/lib/acoes-carrinho";
import { idDoCarrinho, itensDoCarrinho } from "@/lib/carrinho";
import { formatarReais } from "@/lib/dinheiro";
import { usuarioAtual } from "@/lib/sessao";
import { BotaoFinalizar } from "./BotaoFinalizar";
import { CompletarFaixa, ControlesItem } from "./ControlesItem";

export const metadata = { title: "Carrinho" };

export default async function Carrinho() {
  const usuario = await usuarioAtual();
  const papel = usuario?.role ?? null;
  const cartId = await idDoCarrinho(false);
  const itens = cartId ? await itensDoCarrinho(cartId) : [];

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <ShoppingCart className="h-10 w-10 text-slate-300" />
        <h1 className="mt-3 text-xl font-bold">Seu carrinho está vazio</h1>
        <p className="mt-1 text-slate-600">Busque os materiais ou use a calculadora de obra.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/busca" className="rounded-lg bg-marca-600 px-4 py-2.5 font-semibold text-white">
            Buscar materiais
          </Link>
          <Link href="/calculadora" className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold">
            Calcular obra
          </Link>
        </div>
      </div>
    );
  }

  const carrinho = montarCarrinho(itens, papel, PERTO_DA_PROXIMA_FAIXA);
  const pendente = carrinho.precosMudaram > 0 || carrinho.indisponiveis > 0;

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6 lg:space-y-0">
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold">Carrinho</h1>

        {carrinho.precosMudaram > 0 && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 font-bold text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {carrinho.precosMudaram === 1 ? "1 preço mudou" : `${carrinho.precosMudaram} preços mudaram`} desde que
              você adicionou ao carrinho
            </p>
            <p className="mt-1 text-sm text-red-700">Confira os itens marcados abaixo antes de confirmar.</p>
            <form action={aceitarNovosPrecos} className="mt-3">
              <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
                Entendi, aceitar novos preços
              </button>
            </form>
          </div>
        )}

        {carrinho.lojas.map((grupo) => (
          <section key={grupo.loja.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <header className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="font-bold">{grupo.loja.name}</h2>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {grupo.loja.region}
              </p>
            </header>

            <ul className="divide-y divide-slate-100">
              {grupo.itens.map(({ item, calculo, precoMudou, indisponivel }) => {
                const { offer } = item;
                const umaEmbalagem = nomeDaEmbalagem(offer.packageLabel, 1);
                const prox = calculo.proximaFaixa;
                return (
                  <li key={item.id} className={`space-y-2 px-4 py-4 ${indisponivel ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="leading-snug font-semibold">{offer.product.name}</p>
                        <p className="text-xs text-slate-500">
                          {offer.packageLabel}
                          {offer.brand ? ` · ${offer.brand}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-extrabold">{formatarReais(calculo.totalCents)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ControlesItem
                        // Recria o campo quando a quantidade muda por outro caminho (ex.: "Levar 50 sacos")
                        key={item.quantity}
                        itemId={item.id}
                        quantidade={item.quantity}
                        passo={offer.quantityStep}
                        embalagem={offer.packageLabel}
                      />
                      <p className="text-right text-sm">
                        {calculo.faixaAplicada && (
                          <span className="mr-1 text-slate-400 line-through">{formatarReais(calculo.listUnitCents)}</span>
                        )}
                        <span className="font-semibold">{formatarReais(calculo.unitCents)}</span>
                        <span className="text-slate-500"> / {umaEmbalagem}</span>
                      </p>
                    </div>

                    {calculo.economiaCents > 0 && (
                      <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                        <TrendingDown className="h-4 w-4" />
                        Preço de atacado ({calculo.faixaAplicada?.minQuantity}+): você economiza{" "}
                        {formatarReais(calculo.economiaCents)}
                      </p>
                    )}

                    {prox && !indisponivel && (
                      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                        Adicione mais{" "}
                        <strong>
                          {formatarQuantidade(prox.faltam)} {nomeDaEmbalagem(offer.packageLabel, prox.faltam)}
                        </strong>{" "}
                        e pague <strong>{formatarReais(prox.unitCents)}</strong> por {umaEmbalagem} (economia de{" "}
                        {formatarReais(prox.economiaCents)}).
                        <br />
                        <CompletarFaixa
                          itemId={item.id}
                          ate={prox.minQuantity}
                          texto={`Levar ${formatarQuantidade(prox.minQuantity)} ${nomeDaEmbalagem(offer.packageLabel, prox.minQuantity)}`}
                        />
                      </div>
                    )}

                    {atacadoSoParaCnpj(offer, papel) && (
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase className="h-3.5 w-3.5" /> Preço de atacado disponível para CNPJ
                      </p>
                    )}

                    {precoMudou && !indisponivel && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        Preço mudou: era {formatarReais(precoMudou.antesUnitCents)}, agora{" "}
                        {formatarReais(precoMudou.agoraUnitCents)} por {umaEmbalagem}.
                      </p>
                    )}
                    {indisponivel && (
                      <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                        Indisponível no momento. Remova este item para continuar.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <footer className="space-y-1 border-t border-slate-100 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal da loja</span>
                <span className="font-bold">{formatarReais(grupo.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" /> Frete
                </span>
                <span>a combinar com a loja</span>
              </div>
            </footer>
          </section>
        ))}
      </div>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20">
        <h2 className="font-bold">Resumo</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">
              {carrinho.quantidadeDeItens} {carrinho.quantidadeDeItens === 1 ? "item" : "itens"} em{" "}
              {carrinho.lojas.length} {carrinho.lojas.length === 1 ? "loja" : "lojas"}
            </dt>
            <dd>{formatarReais(carrinho.totalCents + carrinho.economiaCents)}</dd>
          </div>
          {carrinho.economiaCents > 0 && (
            <div className="flex justify-between font-semibold text-emerald-700">
              <dt>Economia com atacado</dt>
              <dd>− {formatarReais(carrinho.economiaCents)}</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <dt>Frete</dt>
            <dd>a combinar com cada loja</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-extrabold">
            <dt>Total</dt>
            <dd>{formatarReais(carrinho.totalCents)}</dd>
          </div>
        </dl>

        {!usuario ? (
          <Link href="/entrar?voltar=/carrinho" className="block rounded-xl bg-marca-600 py-3.5 text-center font-bold text-white">
            Entrar para finalizar
          </Link>
        ) : usuario.role === "CPF" || usuario.role === "CNPJ" ? (
          <BotaoFinalizar bloqueado={pendente} />
        ) : (
          <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
            Contas de lojista e administrador não fazem compras. Entre com uma conta de cliente.
          </p>
        )}
        {!usuario && (
          <p className="text-center text-xs text-slate-500">Seus itens continuam no carrinho depois de entrar.</p>
        )}
        {pendente && usuario && (
          <p className="text-center text-xs font-medium text-red-700">
            Resolva os avisos do carrinho para confirmar o pedido.
          </p>
        )}
      </aside>
    </div>
  );
}
