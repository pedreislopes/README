"use client";

import { useActionState } from "react";
import { Alerta, estiloBotaoPrincipal } from "@/components/Formulario";
import { finalizarPedido } from "@/lib/acoes-carrinho";

export function BotaoFinalizar({ bloqueado }: { bloqueado: boolean }) {
  const [estado, acao, enviando] = useActionState(finalizarPedido, {});
  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <button type="submit" disabled={bloqueado || enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Registrando pedido…" : "Confirmar pedido"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Nenhum pagamento é feito agora. O pedido é enviado às lojas, que combinam pagamento e entrega com você.
      </p>
    </form>
  );
}
