// Sugerir um material novo para o catálogo + acompanhar as sugestões enviadas.
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { FormularioSugestao } from "./FormularioSugestao";

export const metadata = { title: "Sugerir material" };

const SITUACAO: Record<string, { texto: string; cor: string }> = {
  PENDENTE: { texto: "Em análise", cor: "bg-amber-100 text-amber-800" },
  APROVADA: { texto: "Aprovada — já está no catálogo", cor: "bg-emerald-100 text-emerald-800" },
  RECUSADA: { texto: "Recusada", cor: "bg-slate-200 text-slate-700" },
};

export default async function Sugerir(props: PageProps<"/loja/sugerir">) {
  const { loja } = await exigirLoja();
  const { tipo, material, ean } = await props.searchParams;
  const [sugestoes, tipos] = await Promise.all([
    db.materialSuggestion.findMany({ where: { storeId: loja.id }, orderBy: { createdAt: "desc" } }),
    // Tipos de produto de marca (martelo, tinta, piso…)
    db.product.findMany({ where: { brandMatters: true }, select: { id: true, name: true, category: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Sugerir material</h2>
        <p className="text-sm text-slate-600">
          O catálogo é o mesmo para todas as lojas, para que o cliente compare preços do mesmo produto. A equipe Solid
          analisa a sugestão e, se aprovada, o material aparece na lista de cadastro.
        </p>
      </div>
      <FormularioSugestao
        tipos={tipos}
        inicial={{
          tipo: tipo === "marca" ? "marca" : "material",
          material: typeof material === "string" ? material : "",
          ean: typeof ean === "string" ? ean.replace(/\D/g, "").slice(0, 14) : "",
        }}
      />
      {sugestoes.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-bold">Suas sugestões</h3>
          <ul className="space-y-2">
            {sugestoes.map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${SITUACAO[s.status]?.cor}`}>
                    {SITUACAO[s.status]?.texto ?? s.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {s.kind === "PRODUTO_MARCA" ? `Produto de marca${s.ean ? ` · código de barras ${s.ean}` : ""}` : s.category} · enviada em {s.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
                {s.reviewNote && <p className="mt-1 text-sm text-slate-700">Resposta: {s.reviewNote}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
