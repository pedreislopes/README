"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alerta, Campo, estiloBotaoPrincipal } from "@/components/Formulario";
import { SENHA_MIN } from "@/config/seguranca";
import { redefinirSenha } from "@/lib/acoes-senha";

export function FormularioNovaSenha({ token }: { token: string }) {
  const [estado, acao, enviando] = useActionState(redefinirSenha, {});
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && (
        <Alerta>
          {estado.erro}{" "}
          <Link href="/esqueci-senha" className="font-semibold underline">
            Pedir novo link
          </Link>
        </Alerta>
      )}
      <input type="hidden" name="token" value={token} />
      <Campo
        rotulo="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        erro={estado.erros?.senha}
        dica={`Pelo menos ${SENHA_MIN} caracteres, com letras e números.`}
      />
      <Campo rotulo="Repita a nova senha" name="confirmacao" type="password" autoComplete="new-password" required erro={estado.erros?.confirmacao} />
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
      <p className="text-xs text-slate-500">Por segurança, você sairá da conta em todos os aparelhos.</p>
    </form>
  );
}
