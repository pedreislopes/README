// Consulta do relatório de pedidos e comissões (usada pela tela E pela planilha CSV,
// para que as duas mostrem exatamente os mesmos números).
import { ehStatusPedido, intervaloDoPeriodo } from "@/domain/pedidos";
import { db } from "./db";

export type FiltrosRelatorio = { de: string; ate: string; loja: string; status: string };

type Params = Record<string, string | string[] | undefined>;
const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export function lerFiltros(params: Params): FiltrosRelatorio {
  const status = texto(params.status);
  return { de: texto(params.de), ate: texto(params.ate), loja: texto(params.loja), status: ehStatusPedido(status) ? status : "" };
}

export function buscarPedidosDoRelatorio(f: FiltrosRelatorio) {
  const periodo = intervaloDoPeriodo(f.de, f.ate);
  return db.order.findMany({
    where: {
      ...(Object.keys(periodo).length ? { createdAt: periodo } : {}),
      ...(f.loja ? { storeId: f.loja } : {}),
      ...(f.status ? { status: f.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true } },
      purchase: { select: { user: { select: { name: true, role: true } } } },
    },
  });
}

/** Monta a URL com os filtros (para links e para o botão da planilha) */
export function consultaDosFiltros(f: FiltrosRelatorio): string {
  const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
  return q.toString();
}
