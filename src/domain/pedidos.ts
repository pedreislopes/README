// =============================================================================
// Regras de pedidos: cancelamento, comissão efetiva, relatório e planilha
// =============================================================================

import type { StatusPedido } from "@/config/constantes";

export type QuemCancela = "CLIENTE" | "LOJA" | "ADMIN";

/**
 * Quem pode cancelar e quando:
 * - cliente e loja: só enquanto o pedido NÃO estiver "Separado" (Novo ou Recebido);
 * - administrador: a qualquer momento (exceto se já estiver cancelado).
 */
export function podeCancelar(status: string, quem: QuemCancela): boolean {
  if (status === "CANCELADO") return false;
  if (quem === "ADMIN") return true;
  return status === "NOVO" || status === "RECEBIDO";
}

/**
 * Monta o texto do motivo. "Outro" exige uma explicação escrita.
 * Devolve { motivo } pronto para gravar ou { erro } para mostrar na tela.
 */
export function montarMotivo(escolhido: string, detalhe: string): { motivo: string } | { erro: string } {
  const texto = detalhe.trim();
  if (!escolhido) return { erro: "Escolha o motivo do cancelamento." };
  if (escolhido === "Outro") {
    if (texto.length < 5) return { erro: "Explique o motivo em poucas palavras." };
    return { motivo: texto.slice(0, 300) };
  }
  return { motivo: texto ? `${escolhido} — ${texto.slice(0, 300)}` : escolhido };
}

type PedidoResumivel = { status: string; subtotalCents: number; commissionCents: number };

/** Pedido cancelado não gera comissão (o valor original fica guardado, mas não conta) */
export function comissaoEfetiva(p: PedidoResumivel): number {
  return p.status === "CANCELADO" ? 0 : p.commissionCents;
}

/** Totais para indicadores e relatórios. Cancelados não entram em vendas nem comissões. */
export function resumirPedidos(pedidos: PedidoResumivel[]) {
  const validos = pedidos.filter((p) => p.status !== "CANCELADO");
  return {
    pedidos: validos.length,
    cancelados: pedidos.length - validos.length,
    vendidoCents: validos.reduce((s, p) => s + p.subtotalCents, 0),
    comissaoCents: validos.reduce((s, p) => s + comissaoEfetiva(p), 0),
  };
}

// -----------------------------------------------------------------------------
// Período do relatório (datas no horário de Brasília)
// -----------------------------------------------------------------------------

/** Brasília está em UTC−3 o ano todo (sem horário de verão desde 2019) */
const FUSO_BRASILIA = "-03:00";

/**
 * "2026-10-01" até "2026-10-31" -> do início do dia 1 ao fim do dia 31, horário de Brasília.
 * Datas vazias ou inválidas são ignoradas.
 */
export function intervaloDoPeriodo(de?: string, ate?: string): { gte?: Date; lte?: Date } {
  const valida = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const inicio = valida(de);
  const fim = valida(ate);
  return {
    ...(inicio ? { gte: new Date(`${inicio}T00:00:00.000${FUSO_BRASILIA}`) } : {}),
    ...(fim ? { lte: new Date(`${fim}T23:59:59.999${FUSO_BRASILIA}`) } : {}),
  };
}

// -----------------------------------------------------------------------------
// Planilha (CSV)
// -----------------------------------------------------------------------------

/**
 * Gera um CSV que abre direto no Excel em português:
 * separador ";", acentos preservados (marca BOM UTF-8) e textos com ; ou aspas protegidos.
 */
export function gerarCsv(linhas: (string | number)[][]): string {
  const celula = (v: string | number) => {
    let t = String(v);
    // Texto começando com = + - @ vira fórmula no Excel ("injeção de fórmula"):
    // um apóstrofo na frente faz o Excel mostrar como texto. Números ficam como estão.
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(t) && !/^-?\d+(,\d+)?$/.test(t)) t = `'${t}`;
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n") + "\r\n";
}

/** 123456 centavos -> "1234,56" (número com vírgula, que o Excel brasileiro entende) */
export function centavosParaCsv(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// -----------------------------------------------------------------------------
// Comissão da loja
// -----------------------------------------------------------------------------
export const COMISSAO_MAXIMA = 50;

export function validarComissao(percentual: number): string | null {
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > COMISSAO_MAXIMA) {
    return `A comissão deve ficar entre 0% e ${COMISSAO_MAXIMA}%.`;
  }
  if (Math.round(percentual * 100) !== percentual * 100) return "Use no máximo duas casas decimais.";
  return null;
}

/** Garante que o status vindo da tela é um dos conhecidos */
export function ehStatusPedido(s: string): s is StatusPedido {
  return ["NOVO", "RECEBIDO", "SEPARADO", "ENTREGUE", "CANCELADO"].includes(s);
}
