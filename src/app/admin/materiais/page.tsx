// Catálogo de materiais: sugestões dos lojistas e cadastro de materiais novos.
import { CATEGORIAS, UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { FormularioMaterial, RevisarSugestao, SugestaoDeMarca } from "./Formularios";

export const metadata = { title: "Materiais" };

export default async function MateriaisAdmin() {
  // Verificação própria em cada página: a moldura (layout) sozinha não garante a proteção
  await exigirAdmin();
  const [sugestoes, analisadas, produtos] = await Promise.all([
    db.materialSuggestion.findMany({ where: { status: "PENDENTE" }, include: { store: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    db.materialSuggestion.findMany({
      where: { status: { not: "PENDENTE" } },
      include: { store: { select: { name: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
    db.product.findMany({ include: { _count: { select: { offers: true } } }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-bold">Sugestões dos lojistas {sugestoes.length > 0 && `(${sugestoes.length})`}</h2>
        {sugestoes.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma sugestão aguardando análise.</p>
        ) : (
          sugestoes.map((s) =>
            s.kind === "PRODUTO_MARCA" ? (
              <SugestaoDeMarca
                key={s.id}
                sugestao={{ id: s.id, nome: s.name, ean: s.ean, observacao: s.note, loja: s.store.name, tipo: produtos.find((p) => p.id === s.typeProductId)?.name ?? "" }}
              />
            ) : (
            <RevisarSugestao
              key={s.id}
              sugestao={{ id: s.id, nome: s.name, categoria: s.category, unidade: s.baseUnit, observacao: s.note, loja: s.store.name }}
            />
            ),
          )
        )}
        {analisadas.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600">Últimas analisadas</summary>
            <ul className="mt-2 space-y-1">
              {analisadas.map((s) => (
                <li key={s.id}>
                  {s.status === "APROVADA" ? "✓" : "✗"} {s.name} ({s.store.name}){s.reviewNote ? ` — ${s.reviewNote}` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Incluir material no catálogo</h2>
        <FormularioMaterial />
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Catálogo ({produtos.length} materiais)</h2>
        {CATEGORIAS.map((c) => {
          const daCategoria = produtos.filter((p) => p.category === c);
          if (daCategoria.length === 0) return null;
          return (
            <details key={c} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <summary className="cursor-pointer font-semibold">
                {c} ({daCategoria.length})
              </summary>
              <ul className="mt-2 space-y-1 text-sm">
                {daCategoria.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span>
                      {p.name}
                      {p.brandMatters && <span className="ml-1 rounded bg-violet-100 px-1.5 text-xs font-semibold text-violet-800">de marca</span>}
                    </span>
                    <span className="shrink-0 text-slate-500">
                      por {UNIDADES_BASE[p.baseUnit as UnidadeBase] ?? p.baseUnit} · {p._count.offers} ofertas
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}
