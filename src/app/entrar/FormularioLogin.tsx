"use client";

import Link from "next/link";
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
      <div>
        <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
        <p className="mt-1 text-right text-sm">
          <Link href="/esqueci-senha" className="font-semibold text-marca-700">
            Esqueci minha senha
          </Link>
        </p>
      </div>
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
