// Confirmação / detalhe de uma compra. Mostra a "foto" dos preços guardada no
// momento da compra, separada por loja, com o contato de cada loja.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, MapPin, Phone, Truck } from "lucide-react";
import { STATUS_PEDIDO, type StatusPedido } from "@/config/constantes";
import { formatarQuantidade, nomeDaEmbalagem } from "@/domain/quantidades";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { numeroDoPedido } from "@/lib/pedidos";
import { usuarioAtual } from "@/lib/sessao";

export const metadata = { title: "Pedido" };

export default async function Pedido(props: PageProps<"/pedido/[id]">) {
  const { id } = await props.params;
  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/entrar?voltar=/pedido/${id}`);

  const compra = await db.purchase.findUnique({
    where: { id },
    include: {
      orders: {
        include: { store: true, items: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  // Só o próprio cliente (ou o administrador) pode ver a compra
  if (!compra || (compra.userId !== usuario.id && usuario.role !== "ADMIN")) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-2 text-2xl font-extrabold text-emerald-900">Pedido registrado!</h1>
        <p className="mt-1 text-emerald-800">
          Número <strong>{numeroDoPedido(compra.id)}</strong> ·{" "}
          {compra.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          {compra.orders.length === 1
            ? "A loja vai entrar em contato para combinar pagamento e entrega."
            : `Seu pedido foi dividido entre ${compra.orders.length} lojas. Cada uma vai entrar em contato para combinar pagamento e entrega.`}
        </p>
      </div>

      {compra.orders.map((pedido) => (
        <section key={pedido.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <h2 className="font-bold">{pedido.store.name}</h2>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {pedido.store.address}
              </p>
              <a href={`tel:${pedido.store.phone.replace(/\D/g, "")}`} className="flex items-center gap-1 text-sm font-medium text-marca-700">
                <Phone className="h-3.5 w-3.5" /> {pedido.store.phone}
              </a>
            </div>
            <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
              {STATUS_PEDIDO[pedido.status as StatusPedido] ?? pedido.status}
            </span>
          </header>
          <ul className="divide-y divide-slate-100 text-sm">
            {pedido.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-slate-500">
                    {formatarQuantidade(item.quantity)} {nomeDaEmbalagem(item.packageLabel, item.quantity)}
                    {/* Mostra o rótulo completo só quando acrescenta algo (ex.: "Saco 50 kg", não "m³") */}
                    {item.packageLabel.includes(" ") ? ` (${item.packageLabel})` : ""} ×{" "}
                    {item.unitPriceCents < item.listUnitPriceCents && (
                      <span className="mr-1 line-through">{formatarReais(item.listUnitPriceCents)}</span>
                    )}
                    {formatarReais(item.unitPriceCents)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatarReais(item.totalCents)}</p>
              </li>
            ))}
          </ul>
          <footer className="space-y-1 border-t border-slate-100 px-4 py-3 text-sm">
            {pedido.savingsCents > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Economia com atacado</span>
                <span>− {formatarReais(pedido.savingsCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" /> Frete
              </span>
              <span>{pedido.freightCents === null ? "a combinar com a loja" : formatarReais(pedido.freightCents)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Subtotal</span>
              <span>{formatarReais(pedido.subtotalCents)}</span>
            </div>
          </footer>
        </section>
      ))}

      <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4">
        {compra.savingsCents > 0 && (
          <p className="flex justify-between font-semibold text-emerald-700">
            <span>Você economizou</span>
            <span>{formatarReais(compra.savingsCents)}</span>
          </p>
        )}
        <p className="flex justify-between text-lg font-extrabold">
          <span>Total (sem frete)</span>
          <span>{formatarReais(compra.totalCents)}</span>
        </p>
        <p className="text-xs text-slate-500">Pagamento combinado diretamente com cada loja (simulação, sem cobrança).</p>
      </div>

      <div className="flex gap-2">
        <Link href="/meus-pedidos" className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-center font-semibold">
          Meus pedidos
        </Link>
        <Link href="/busca" className="flex-1 rounded-xl bg-marca-600 py-3 text-center font-semibold text-white">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
