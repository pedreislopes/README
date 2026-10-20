// =============================================================================
// Comissão da plataforma
// =============================================================================
// Cobrada sobre o valor final do pedido de cada loja (já com os descontos de
// atacado; sem frete). A % vem do cadastro da loja e é copiada para o pedido,
// para que mudanças futuras na % não alterem pedidos antigos.
// =============================================================================

/** Comissão em centavos. Ex.: R$ 1.000,00 a 3,5% -> R$ 35,00 */
export function calcularComissao(subtotalCents: number, percentual: number): number {
  if (percentual < 0 || percentual > 100) throw new Error(`Comissão inválida: ${percentual}%`);
  return Math.round((subtotalCents * percentual) / 100);
}
