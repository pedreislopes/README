import Link from "next/link";
import { Calculator, Search } from "lucide-react";
import { CATEGORIAS } from "@/config/constantes";

/** Página inicial: busca em destaque, atalho para a calculadora e categorias. */
export default function Inicio() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-marca-600 to-marca-500 px-5 py-8 text-white shadow-sm">
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
          Material de construção pelo menor preço do DF
        </h1>
        <p className="mt-2 text-white/90">
          Compare lojas e depósitos da sua região e compre tudo em um só lugar.
        </p>

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

      <Link
        href="/calculadora"
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-marca-500"
      >
        <span className="rounded-xl bg-marca-50 p-3 text-marca-600">
          <Calculator className="h-7 w-7" />
        </span>
        <span>
          <span className="block font-bold">Calcular minha obra</span>
          <span className="block text-sm text-slate-600">
            Informe as medidas do muro, piso ou laje e montamos o carrinho mais barato.
          </span>
        </span>
      </Link>

      <section>
        <h2 className="mb-3 text-lg font-bold">Categorias</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIAS.map((categoria) => (
            <li key={categoria}>
              <Link
                href={`/busca?categoria=${encodeURIComponent(categoria)}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-marca-500 hover:text-marca-700"
              >
                {categoria}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
