// Catálogo central de produtos de marca: fotos para aprovar e a lista por tipo.
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Plus } from "lucide-react";
import { modeloDe } from "@/config/caracteristicas";
import { caracteristicasPreenchidas, lerCaracteristicas } from "@/domain/marcas";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { urlDaFoto } from "@/config/fotos";
import { RevisarFoto } from "./RevisarFoto";

export const metadata = { title: "Produtos de marca" };

export default async function CatalogoDeMarca(props: PageProps<"/admin/catalogo">) {
  // Verificação própria em cada página: a moldura (layout) sozinha não garante a proteção
  await exigirAdmin();
  const { salvo } = await props.searchParams;
  const [envios, tipos] = await Promise.all([
    db.photoSubmission.findMany({
      where: { status: "PENDENTE" },
      include: { store: { select: { name: true } }, catalogItem: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.product.findMany({
      where: { brandMatters: true },
      include: { catalogItems: { include: { _count: { select: { offers: true } } }, orderBy: [{ brand: "asc" }, { model: "asc" }] } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);
  const total = tipos.reduce((s, t) => s + t.catalogItems.length, 0);
  const semFoto = tipos.reduce((s, t) => s + t.catalogItems.filter((i) => !i.photoId).length, 0);

  return (
    <div className="space-y-6">
      {typeof salvo === "string" && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Produto de marca salvo.
        </p>
      )}
      <p className="text-sm text-slate-600">
        Cada produto de marca é cadastrado <strong>uma vez</strong> aqui, com marca, modelo, código de barras e
        características. As lojas só escolhem o produto e informam preço e disponibilidade.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/admin/catalogo/novo" className="flex items-center justify-center gap-2 rounded-xl bg-marca-600 py-3 font-bold text-white">
          <Plus className="h-5 w-5" /> Novo produto
        </Link>
        <Link href="/admin/catalogo/importar" className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-semibold">
          <FileSpreadsheet className="h-5 w-5 text-emerald-700" /> Importar planilha
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold">Fotos enviadas pelas lojas {envios.length > 0 && `(${envios.length})`}</h2>
        {envios.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma foto aguardando aprovação.</p>
        ) : (
          envios.map((e) => (
            <RevisarFoto
              key={e.id}
              envio={{
                id: e.id,
                fotoId: e.photoId,
                produto: `${e.catalogItem.product.name} — ${e.catalogItem.brand} ${e.catalogItem.model}`,
                loja: e.store.name,
                origem: e.source,
                autorizacao: e.authorization,
                data: e.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
              }}
            />
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">
          Catálogo ({total} produtos, {semFoto} sem foto)
        </h2>
        {tipos.map((t) => {
          const modelo = modeloDe(t.specTemplate);
          return (
            <details key={t.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <summary className="cursor-pointer font-semibold">
                {t.name} ({t.catalogItems.length})
              </summary>
              <ul className="mt-2 divide-y divide-slate-100">
                {t.catalogItems.map((i) => {
                  const { preenchidas, total: campos } = caracteristicasPreenchidas(modelo, lerCaracteristicas(i.specs));
                  return (
                    <li key={i.id}>
                      <Link href={`/admin/catalogo/${i.id}`} className="flex items-center gap-3 py-2 hover:bg-slate-50">
                        {i.photoId ? (
                          // eslint-disable-next-line @next/next/no-img-element -- miniatura já otimizada
                          <img src={urlDaFoto(i.photoId, true)} alt="" className="h-12 w-12 shrink-0 rounded border border-slate-200 object-contain" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">
                            sem foto
                          </span>
                        )}
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="block font-semibold">
                            {i.brand} — {i.model} {!i.active && <span className="text-red-700">(inativo)</span>}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {i.ean ? `EAN ${i.ean}` : "Sem código de barras"} · {i.packageLabel} · características {preenchidas}/{campos} ·{" "}
                            {i._count.offers} {i._count.offers === 1 ? "oferta" : "ofertas"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </section>
    </div>
  );
}
