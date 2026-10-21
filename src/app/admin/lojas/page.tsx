// Lojas: aprovar/recusar pendentes, suspender/reativar, comissão e Oferta destaque.
import Link from "next/link";
import { DESTAQUE, STATUS_LOJA, type StatusLoja } from "@/config/constantes";
import { formatarCnpj } from "@/domain/documentos";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { AcoesLojaAdmin } from "./AcoesLojaAdmin";

export const metadata = { title: "Lojas" };

const CORES: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  APROVADA: "bg-emerald-100 text-emerald-800",
  RECUSADA: "bg-slate-200 text-slate-700",
  SUSPENSA: "bg-red-100 text-red-800",
};

export default async function LojasAdmin(props: PageProps<"/admin/lojas">) {
  // Verificação própria em cada página: a moldura (layout) sozinha não garante a proteção
  await exigirAdmin();
  const { status } = await props.searchParams;
  const filtro = Object.keys(STATUS_LOJA).includes(String(status)) ? String(status) : "";
  const lojas = await db.store.findMany({
    where: filtro ? { status: filtro } : {},
    // Pendentes primeiro, depois por nome
    orderBy: [{ createdAt: "asc" }],
    include: {
      owner: { select: { name: true, email: true, phone: true } },
      _count: { select: { offers: true, orders: true } },
    },
  });
  lojas.sort((a, b) => Number(b.status === "PENDENTE") - Number(a.status === "PENDENTE") || a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar lojas">
        {[["", "Todas"], ...Object.entries(STATUS_LOJA)].map(([valor, rotulo]) => (
          <Link
            key={valor}
            href={valor ? `/admin/lojas?status=${valor}` : "/admin/lojas"}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              filtro === valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {rotulo}
          </Link>
        ))}
      </nav>

      {lojas.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">Nenhuma loja.</p>}

      {lojas.map((l) => (
        <article key={l.id} className={`space-y-3 rounded-2xl border bg-white p-4 ${l.status === "PENDENTE" ? "border-amber-300" : "border-slate-200"}`}>
          <header className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg leading-tight font-bold">{l.name}</h2>
              <p className="text-sm text-slate-500">
                {l.region} · CNPJ {formatarCnpj(l.cnpj)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${CORES[l.status] ?? ""}`}>
              {STATUS_LOJA[l.status as StatusLoja] ?? l.status}
            </span>
          </header>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt className="text-slate-500">Responsável</dt>
            <dd>{l.owner.name}</dd>
            <dt className="text-slate-500">Contato</dt>
            <dd className="break-all">
              {l.owner.email}
              <br />
              {l.phone}
            </dd>
            <dt className="text-slate-500">Endereço</dt>
            <dd>{l.address}</dd>
            <dt className="text-slate-500">Produtos / pedidos</dt>
            <dd>
              {l._count.offers} / {l._count.orders}
            </dd>
          </dl>
          {l.statusReason && (l.status === "RECUSADA" || l.status === "SUSPENSA") && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              Motivo: {l.statusReason}
              {l.statusChangedAt && ` (${l.statusChangedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })})`}
            </p>
          )}
          <AcoesLojaAdmin
            loja={{ id: l.id, nome: l.name, status: l.status, comissao: l.commissionPercent, destaque: l.featured }}
            rotuloDestaque={DESTAQUE.selo}
          />
        </article>
      ))}
    </div>
  );
}
