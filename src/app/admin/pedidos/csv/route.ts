// Baixar o relatório de pedidos em planilha (CSV), com os mesmos filtros da tela.
// Só administrador. O download fica registrado na auditoria.
import { STATUS_PEDIDO, type StatusPedido } from "@/config/constantes";
import { centavosParaCsv, comissaoEfetiva, gerarCsv } from "@/domain/pedidos";
import { registrarAcao } from "@/lib/auditoria";
import { numeroDoPedido } from "@/lib/pedidos";
import { buscarPedidosDoRelatorio, consultaDosFiltros, lerFiltros } from "@/lib/relatorio";
import { usuarioAtual } from "@/lib/sessao";

export async function GET(request: Request) {
  const admin = await usuarioAtual();
  if (!admin || admin.role !== "ADMIN") return new Response("Acesso negado.", { status: 403 });

  const filtros = lerFiltros(Object.fromEntries(new URL(request.url).searchParams));
  const pedidos = await buscarPedidosDoRelatorio(filtros);

  const linhas: (string | number)[][] = [
    ["Data", "Pedido", "Loja", "Cliente", "Tipo de cliente", "Situação", "Valor (R$)", "Comissão (%)", "Comissão (R$)", "Motivo do cancelamento"],
    ...pedidos.map((p) => [
      p.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      numeroDoPedido(p.purchaseId),
      p.store.name,
      p.purchase.user.name,
      p.purchase.user.role,
      STATUS_PEDIDO[p.status as StatusPedido] ?? p.status,
      centavosParaCsv(p.subtotalCents),
      p.commissionPercent.toLocaleString("pt-BR"),
      centavosParaCsv(comissaoEfetiva(p)),
      p.cancelReason ?? "",
    ]),
  ];

  await registrarAcao(
    admin,
    "RELATORIO_EXPORTADO",
    { tipo: "Relatorio", id: "pedidos" },
    `${pedidos.length} pedidos${consultaDosFiltros(filtros) ? ` (filtros: ${consultaDosFiltros(filtros)})` : ""}`,
  );

  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // 2026-10-21
  return new Response(gerarCsv(linhas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solid-pedidos-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
