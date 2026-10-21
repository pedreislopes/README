// Relatório de pedidos e comissões, filtrável por período, loja e situação.
import Link from "next/link";
import { Download } from "lucide-react";
import { CancelarPedido } from "@/components/CancelarPedido";
import { estiloCampo } from "@/components/Formulario";
import { MOTIVOS_CANCELAMENTO, STATUS_PEDIDO, type StatusPedido } from "@/config/constantes";
import { comissaoEfetiva, podeCancelar, resumirPedidos } from "@/domain/pedidos";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatarReais } from "@/lib/dinheiro";
import { numeroDoPedido } from "@/lib/pedidos";
import { buscarPedidosDoRelatorio, consultaDosFiltros, lerFiltros } from "@/lib/relatorio";

export const metadata = { title: "Pedidos e comissões" };

/** "AAAA-MM-DD" no horário de Brasília */
const dataBrasilia = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

export default async function PedidosAdmin(props: PageProps<"/admin/pedidos">) {
  // Verificação própria em cada página: a moldura (layout) sozinha não garante a proteção
  await exigirAdmin();
  const filtros = lerFiltros(await props.searchParams);
  const [pedidos, lojas] = await Promise.all([
    buscarPedidosDoRelatorio(filtros),
    db.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const r = resumirPedidos(pedidos);

  // Atalhos de período
  const hoje = new Date();
  const inicioMes = dataBrasilia(new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12));
  const inicioMesPassado = dataBrasilia(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 12));
  const fimMesPassado = dataBrasilia(new Date(hoje.getFullYear(), hoje.getMonth(), 0, 12));
  const atalho = (de: string, ate: string) => `/admin/pedidos?${consultaDosFiltros({ ...filtros, de, ate })}`;

  return (
    <div className="space-y-4">
      <form action="/admin/pedidos" className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <label className="text-sm font-semibold">
          De
          <input type="date" name="de" defaultValue={filtros.de} className={estiloCampo} />
        </label>
        <label className="text-sm font-semibold">
          Até
          <input type="date" name="ate" defaultValue={filtros.ate} className={estiloCampo} />
        </label>
        <label className="text-sm font-semibold">
          Loja
          <select name="loja" defaultValue={filtros.loja} className={estiloCampo}>
            <option value="">Todas</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Situação
          <select name="status" defaultValue={filtros.status} className={estiloCampo}>
            <option value="">Todas</option>
            {Object.entries(STATUS_PEDIDO).map(([v, rot]) => (
              <option key={v} value={v}>
                {rot}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-4">
          <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 font-bold text-white">
            Filtrar
          </button>
          <Link href={atalho(inicioMes, dataBrasilia(hoje))} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm">
            Este mês
          </Link>
          <Link href={atalho(inicioMesPassado, fimMesPassado)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm">
            Mês passado
          </Link>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-slate-600">
            Limpar
          </Link>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Pedidos", String(r.pedidos)],
          ["Cancelados", String(r.cancelados)],
          ["Total vendido", formatarReais(r.vendidoCents)],
          ["Comissões", formatarReais(r.comissaoCents)],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">{rotulo}</p>
            <p className="text-lg font-extrabold">{valor}</p>
          </div>
        ))}
      </div>

      <a
        href={`/admin/pedidos/csv?${consultaDosFiltros(filtros)}`}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 py-3 font-bold hover:bg-slate-50"
      >
        <Download className="h-5 w-5" /> Baixar planilha (CSV) com estes filtros
      </a>

      {pedidos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">Nenhum pedido com esses filtros.</p>
      ) : (
        <ul className="space-y-2">
          {pedidos.map((p) => {
            const cancelado = p.status === "CANCELADO";
            return (
              <li key={p.id} className={`space-y-2 rounded-2xl border border-slate-200 bg-white p-4 ${cancelado ? "bg-slate-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      <Link href={`/pedido/${p.purchaseId}`} className="hover:underline">
                        Pedido {numeroDoPedido(p.purchaseId)}
                      </Link>{" "}
                      · {p.store.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} ·{" "}
                      {p.purchase.user.name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                    {STATUS_PEDIDO[p.status as StatusPedido] ?? p.status}
                  </span>
                </div>
                <div className={`flex justify-between text-sm ${cancelado ? "text-slate-400 line-through" : ""}`}>
                  <span>{formatarReais(p.subtotalCents)}</span>
                  <span>
                    Comissão {p.commissionPercent.toLocaleString("pt-BR")}%: {formatarReais(comissaoEfetiva(p))}
                  </span>
                </div>
                {cancelado && <p className="text-xs text-slate-600">Cancelado ({p.canceledBy?.toLowerCase()}): {p.cancelReason}</p>}
                {podeCancelar(p.status, "ADMIN") && <CancelarPedido orderId={p.id} motivos={MOTIVOS_CANCELAMENTO.ADMIN} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
