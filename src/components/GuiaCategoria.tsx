// Guia "Qual escolher?" da página de cada categoria: compara materiais parecidos
// em linguagem simples. Os textos ficam em src/config/explicacoes-materiais.ts.

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { AVISO_EXPLICACAO, GUIAS_CATEGORIA } from "@/config/explicacoes-materiais";
import type { Categoria } from "@/config/constantes";

type Props = {
  categoria: Categoria;
  /** Nome de cada material, pelo código */
  nomes: Map<string, string>;
};

export function GuiaCategoria({ categoria, nomes }: Props) {
  const guia = GUIAS_CATEGORIA[categoria];
  if (!guia) return null;

  return (
    <section aria-labelledby="qual-escolher" className="rounded-xl border border-marca-100 bg-marca-50/60 p-4">
      <h2 id="qual-escolher" className="flex items-center gap-2 font-bold">
        <Lightbulb className="h-5 w-5 text-marca-600" aria-hidden /> Qual escolher?
      </h2>
      <ul className="mt-3 space-y-3">
        {guia.comparacoes.map((c) => (
          <li key={c.pergunta} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="font-semibold">{c.pergunta}</p>
            <p className="mt-1 flex flex-wrap gap-1.5">
              {c.materiais
                .filter((id) => nomes.has(id))
                .map((id) => (
                  <Link
                    key={id}
                    href={`/produto/${id}`}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 hover:border-marca-400 hover:text-marca-700"
                  >
                    {nomes.get(id)}
                  </Link>
                ))}
            </p>
            <p className="mt-1.5 text-sm text-slate-700">{c.resposta}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">{AVISO_EXPLICACAO}</p>
    </section>
  );
}
