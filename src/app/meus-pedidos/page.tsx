// Histórico de compras do cliente.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { resumirPedidos } from "@/domain/pedidos";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { numeroDoPedido } from "@/lib/pedidos";
import { usuarioAtual } from "@/lib/sessao";

export const metadata = { title: "Meus pedidos" };

export default async function MeusPedidos() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/meus-pedidos");

  const compras = await db.purchase.findMany({
    where: { userId: usuario.id },
    orderBy: { createdAt: "desc" },
    include: { orders: { include: { store: { select: { name: true } } } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Meus pedidos</h1>
      {compras.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 font-semibold">Você ainda não fez pedidos.</p>
          <Link href="/busca" className="mt-3 inline-block font-semibold text-marca-700">
            Buscar materiais
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {compras.map((c) => (
            <li key={c.id}>
              <Link href={`/pedido/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50">
                <div>
                  <p className="font-bold">Pedido {numeroDoPedido(c.id)}</p>
                  <p className="text-sm text-slate-500">
                    {c.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} ·{" "}
                    {c.orders.map((o) => o.store.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatarReais(resumirPedidos(c.orders).vendidoCents)}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
