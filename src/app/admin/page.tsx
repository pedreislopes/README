// Início do painel do administrador: indicadores e pendências.
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { resumirPedidos } from "@/domain/pedidos";
import { ACOES_ADMIN, type AcaoAdmin } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";

export const metadata = { title: "Administração" };

export default async function InicioAdmin() {
  const [pedidos, ativas, pendentes, suspensas, sugestoes, ultimas] = await Promise.all([
    db.order.findMany({ select: { status: true, subtotalCents: true, commissionCents: true } }),
    db.store.count({ where: { status: "APROVADA" } }),
    db.store.findMany({ where: { status: "PENDENTE" }, orderBy: { createdAt: "asc" } }),
    db.store.count({ where: { status: "SUSPENSA" } }),
    db.materialSuggestion.count({ where: { status: "PENDENTE" } }),
    db.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const r = resumirPedidos(pedidos);

  const cards = [
    { rotulo: "Total vendido", valor: formatarReais(r.vendidoCents), href: "/admin/pedidos" },
    { rotulo: "Total de comissões", valor: formatarReais(r.comissaoCents), href: "/admin/pedidos" },
    { rotulo: "Pedidos", valor: String(r.pedidos), detalhe: r.cancelados ? `+ ${r.cancelados} cancelados` : undefined, href: "/admin/pedidos" },
    { rotulo: "Lojas ativas", valor: String(ativas), detalhe: suspensas ? `${suspensas} suspensas` : undefined, href: "/admin/lojas?status=APROVADA" },
    { rotulo: "Lojas pendentes", valor: String(pendentes.length), href: "/admin/lojas?status=PENDENTE", alerta: pendentes.length > 0 },
    { rotulo: "Sugestões de material", valor: String(sugestoes), href: "/admin/materiais", alerta: sugestoes > 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.rotulo}
            href={c.href}
            className={`rounded-2xl border bg-white p-4 ${c.alerta ? "border-amber-300 ring-1 ring-amber-300" : "border-slate-200"}`}
          >
            <p className="text-sm text-slate-600">{c.rotulo}</p>
            <p className="mt-1 text-xl font-extrabold break-words">{c.valor}</p>
            {c.detalhe && <p className="text-xs text-slate-500">{c.detalhe}</p>}
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-500">Vendas e comissões não incluem pedidos cancelados. Frete não entra nos valores.</p>

      {pendentes.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">Lojas aguardando aprovação</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-amber-200 bg-white">
            {pendentes.map((l) => (
              <li key={l.id}>
                <Link href="/admin/lojas?status=PENDENTE" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <span>
                    <span className="block font-semibold">{l.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" /> {l.region} · desde {l.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Últimas ações</h2>
          <Link href="/admin/registro" className="text-sm font-semibold text-marca-700">
            Ver registro completo
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma ação registrada ainda.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {ultimas.map((a) => (
              <li key={a.id} className="rounded-lg bg-white px-3 py-2">
                <strong>{ACOES_ADMIN[a.action as AcaoAdmin] ?? a.action}</strong> — {a.details}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
