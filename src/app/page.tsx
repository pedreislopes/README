import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Scale, Search, ShoppingCart } from "lucide-react";
import { CATEGORIAS } from "@/config/constantes";
import { imagemDaCategoria } from "@/config/imagens-categorias";

const COMO_FUNCIONA = [
  {
    icone: Search,
    titulo: "Busque",
    texto: "Digite o material ou escolha uma categoria. Entendemos nomes populares e erros de digitação.",
  },
  {
    icone: Scale,
    titulo: "Compare",
    texto: "Veja o preço por kg, m³ ou unidade em várias lojas do DF e do Entorno, lado a lado.",
  },
  {
    icone: ShoppingCart,
    titulo: "Compre",
    texto: "Monte o carrinho com uma ou mais lojas e combine a entrega direto com cada uma.",
  },
];

/** Página inicial: busca em destaque, categorias com imagem, como funciona e a calculadora. */
export default function Inicio() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-marca-600 to-marca-500 px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">Material de construção pelo menor preço do DF</h1>
        <p className="mt-2 text-white/90">Compare lojas e depósitos da sua região e compre tudo em um só lugar.</p>

        <form action="/busca" className="mt-5 flex gap-2">
          <label htmlFor="busca" className="sr-only">
            O que você precisa?
          </label>
          <input
            id="busca"
            name="q"
            type="search"
            placeholder="Ex.: cimento CP II, areia média…"
            className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-white/40 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
          >
            <Search className="h-5 w-5" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </form>
      </section>

      <section aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="mb-3 text-lg font-bold">
          Categorias
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIAS.map((categoria, i) => (
            <li key={categoria}>
              <Link
                href={`/busca?categoria=${encodeURIComponent(categoria)}`}
                className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-marca-500 focus-visible:outline-none"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-marca-50">
                  <Image
                    src={imagemDaCategoria(categoria)}
                    alt=""
                    fill
                    // As primeiras aparecem logo na tela do celular: carregam primeiro
                    priority={i < 4}
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="block px-3 py-2.5 text-sm leading-snug font-semibold text-slate-900 group-hover:text-marca-700">
                  {categoria}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-calculadora">
        <Link
          href="/calculadora"
          className="group flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-marca-500">
            <Calculator className="h-8 w-8" />
          </span>
          <span className="flex-1">
            <span id="titulo-calculadora" className="block text-xl font-extrabold">
              Não sabe quanto comprar?
            </span>
            <span className="mt-1 block text-white/80">
              Use a calculadora de obra: informe as medidas do muro, reboco, piso, contrapiso ou laje e montamos a lista de materiais
              com o carrinho mais barato.
            </span>
          </span>
          <span className="inline-flex items-center gap-2 self-start rounded-xl bg-marca-500 px-4 py-3 font-bold group-hover:bg-marca-600 sm:self-center">
            Calcular minha obra <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </section>

      <section aria-labelledby="titulo-como-funciona">
        <h2 id="titulo-como-funciona" className="mb-3 text-lg font-bold">
          Como funciona
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {COMO_FUNCIONA.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                  <Icone className="h-5 w-5" />
                </span>
                <span className="font-bold">
                  <span className="text-marca-600">{i + 1}.</span> {titulo}
                </span>
              </span>
              <p className="mt-2 text-sm text-slate-600">{texto}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
