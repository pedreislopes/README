// Pedidos recebidos pela loja, com o valor da comissão de cada um.
import Link from "next/link";
import { Phone } from "lucide-react";
import { CancelarPedido } from "@/components/CancelarPedido";
import { MOTIVOS_CANCELAMENTO, STATUS_PEDIDO, type StatusPedido } from "@/config/constantes";
import { PROXIMO_STATUS } from "@/domain/ofertas";
import { comissaoEfetiva, podeCancelar } from "@/domain/pedidos";
import { formatarQuantidade, nomeDaEmbalagem } from "@/domain/quantidades";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { exigirLoja } from "@/lib/loja";
import { numeroDoPedido } from "@/lib/pedidos";
import { BotaoAvancar } from "./BotaoAvancar";

export const metadata = { title: "Pedidos da loja" };

const CORES: Record<StatusPedido, string> = {
  NOVO: "bg-red-100 text-red-800",
  RECEBIDO: "bg-sky-100 text-sky-800",
  SEPARADO: "bg-amber-100 text-amber-800",
  ENTREGUE: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-200 text-slate-700",
};

export default async function PedidosLoja(props: PageProps<"/loja/pedidos">) {
  const { loja } = await exigirLoja();
  const { status } = await props.searchParams;
  const filtro = Object.keys(STATUS_PEDIDO).includes(String(status)) ? (status as StatusPedido) : null;

  const pedidos = await db.order.findMany({
    where: { storeId: loja.id, ...(filtro ? { status: filtro } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      purchase: { include: { user: { select: { name: true, phone: true, role: true } } } },
    },
  });

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por situação">
        {[["", "Todos"], ...Object.entries(STATUS_PEDIDO)].map(([valor, rotulo]) => (
          <Link
            key={valor}
            href={valor ? `/loja/pedidos?status=${valor}` : "/loja/pedidos"}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              (filtro ?? "") === valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {rotulo}
          </Link>
        ))}
      </nav>

      {pedidos.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
          Nenhum pedido {filtro ? `com a situação "${STATUS_PEDIDO[filtro]}"` : "ainda"}.
        </p>
      )}

      {pedidos.map((p) => {
        const st = p.status as StatusPedido;
        const proximo = PROXIMO_STATUS[st];
        const cliente = p.purchase.user;
        const cancelado = st === "CANCELADO";
        const comissao = comissaoEfetiva(p);
        return (
          <article key={p.id} className={`rounded-2xl border bg-white ${st === "NOVO" ? "border-red-300 ring-1 ring-red-300" : "border-slate-200"}`}>
            <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-lg font-extrabold">Pedido {numeroDoPedido(p.purchaseId)}</p>
                <p className="text-sm text-slate-500">
                  {p.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${CORES[st]}`}>{STATUS_PEDIDO[st]}</span>
            </header>

            <div className="space-y-3 px-4 py-3">
              <div className="text-sm">
                <p className="font-semibold">
                  {cliente.name} <span className="font-normal text-slate-500">({cliente.role === "CNPJ" ? "empresa" : "pessoa física"})</span>
                </p>
                {cliente.phone && (
                  <a href={`tel:${cliente.phone}`} className="inline-flex items-center gap-1 font-medium text-marca-700">
                    <Phone className="h-4 w-4" /> {cliente.phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3")}
                  </a>
                )}
              </div>

              <ul className="divide-y divide-slate-100 rounded-lg bg-slate-50 text-sm">
                {p.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 px-3 py-2">
                    <span>
                      <strong>
                        {formatarQuantidade(i.quantity)} {nomeDaEmbalagem(i.packageLabel, i.quantity)}
                      </strong>{" "}
                      {i.productName}
                      {i.packageLabel.includes(" ") ? ` (${i.packageLabel})` : ""}
                    </span>
                    <span className="shrink-0">{formatarReais(i.totalCents)}</span>
                  </li>
                ))}
              </ul>

              {cancelado && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <strong>Cancelado</strong> pel{p.canceledBy === "LOJA" ? "a loja" : p.canceledBy === "CLIENTE" ? "o cliente" : "a equipe Solid"}
                  {p.canceledAt ? ` em ${p.canceledAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}. Motivo:{" "}
                  {p.cancelReason}
                </p>
              )}

              <dl className={`space-y-1 text-sm ${cancelado ? "opacity-60" : ""}`}>
                <div className="flex justify-between">
                  <dt>Valor do pedido</dt>
                  <dd className="font-bold">{formatarReais(p.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Comissão Solid ({p.commissionPercent.toLocaleString("pt-BR")}%)</dt>
                  <dd>{cancelado ? "R$ 0,00 (cancelado)" : `− ${formatarReais(comissao)}`}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-emerald-700">
                  <dt>Você recebe</dt>
                  <dd>{cancelado ? "—" : formatarReais(p.subtotalCents - comissao)}</dd>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <dt>Frete</dt>
                  <dd>a combinar com o cliente</dd>
                </div>
              </dl>

              {proximo && <BotaoAvancar orderId={p.id} rotulo={`Marcar como ${STATUS_PEDIDO[proximo]}`} />}
              {podeCancelar(st, "LOJA") && <CancelarPedido orderId={p.id} motivos={MOTIVOS_CANCELAMENTO.LOJA} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}
