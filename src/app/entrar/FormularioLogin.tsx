"use client";

import { useActionState } from "react";
import { Alerta, Campo, estiloBotaoPrincipal } from "@/components/Formulario";
import { entrar } from "@/lib/acoes-conta";

export function FormularioLogin({ voltar }: { voltar: string }) {
  const [estado, acao, enviando] = useActionState(entrar, {});

  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <input type="hidden" name="voltar" value={voltar} />
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={estado.email}
      />
      <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
