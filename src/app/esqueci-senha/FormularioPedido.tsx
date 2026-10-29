"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Alerta, Campo, estiloBotaoPrincipal } from "@/components/Formulario";
import { pedirNovaSenha } from "@/lib/acoes-senha";

export function FormularioPedido() {
  const [estado, acao, enviando] = useActionState(pedirNovaSenha, {});

  if (estado.mensagem) {
    return (
      <div role="status" className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <p className="flex items-center gap-2 font-bold">
          <MailCheck className="h-5 w-5" /> Pedido recebido
        </p>
        <p className="text-sm">{estado.mensagem}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <Campo
        rotulo="E-mail da sua conta"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={estado.email}
      />
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Enviando…" : "Enviar link"}
      </button>
    </form>
  );
}
