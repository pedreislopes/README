// Início do painel: aviso de pedidos novos e números da loja.
import Link from "next/link";
import { Bell, ChevronRight, PackageCheck, PackageX, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { contarPedidosNovos, exigirLoja } from "@/lib/loja";

export const metadata = { title: "Painel da loja" };

export default async function PainelLoja() {
  const { loja } = await exigirLoja();
  const [novos, aVenda, semEstoque, vendas] = await Promise.all([
    contarPedidosNovos(loja.id),
    db.offer.count({ where: { storeId: loja.id, active: true } }),
    db.offer.count({ where: { storeId: loja.id, active: false } }),
    // Pedidos cancelados não contam nas vendas nem geram comissão
    db.order.aggregate({
      where: { storeId: loja.id, status: { not: "CANCELADO" } },
      _sum: { subtotalCents: true, commissionCents: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-4">
      {novos > 0 ? (
        <Link
          href="/loja/pedidos?status=NOVO"
          className="flex items-center gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-sm hover:bg-red-700"
        >
          <Bell className="h-8 w-8 shrink-0 animate-pulse" />
          <span className="flex-1">
            <span className="block text-lg font-extrabold">
              {novos === 1 ? "Você tem 1 pedido novo!" : `Você tem ${novos} pedidos novos!`}
            </span>
            <span className="block text-sm text-white/90">Toque para ver e confirmar o recebimento.</span>
          </span>
          <ChevronRight className="h-6 w-6" />
        </Link>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Nenhum pedido novo no momento.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/loja/produtos" className="rounded-2xl border border-slate-200 bg-white p-4">
          <PackageCheck className="h-6 w-6 text-emerald-600" />
          <p className="mt-2 text-2xl font-extrabold">{aVenda}</p>
          <p className="text-sm text-slate-600">produtos à venda</p>
        </Link>
        <Link href="/loja/produtos" className="rounded-2xl border border-slate-200 bg-white p-4">
          <PackageX className="h-6 w-6 text-slate-400" />
          <p className="mt-2 text-2xl font-extrabold">{semEstoque}</p>
          <p className="text-sm text-slate-600">sem estoque (pausados)</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Total vendido pelo Solid ({vendas._count} pedidos)</p>
        <p className="text-2xl font-extrabold">{formatarReais(vendas._sum.subtotalCents ?? 0)}</p>
        <p className="mt-1 text-sm text-slate-600">
          Comissão Solid ({loja.commissionPercent.toLocaleString("pt-BR")}%):{" "}
          <strong>{formatarReais(vendas._sum.commissionCents ?? 0)}</strong>
        </p>
      </div>

      <Link
        href="/loja/produtos/novo"
        className="flex items-center justify-center gap-2 rounded-2xl bg-marca-600 py-4 text-lg font-bold text-white hover:bg-marca-700"
      >
        <Plus className="h-6 w-6" /> Cadastrar produto
      </Link>
    </div>
  );
}
