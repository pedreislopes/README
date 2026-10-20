/** Número curto do pedido, fácil de ditar por telefone (últimos 6 caracteres do código) */
export function numeroDoPedido(id: string) {
  return id.slice(-6).toUpperCase();
}
