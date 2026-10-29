// Página aberta pelo link do e-mail: /redefinir-senha?token=...
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { MENSAGEM_LINK } from "@/domain/recuperacao";
import { conferirLink } from "@/lib/recuperacao";
import { FormularioNovaSenha } from "./FormularioNovaSenha";

export const metadata = { title: "Criar nova senha", referrer: "no-referrer" };

export default async function RedefinirSenha(props: PageProps<"/redefinir-senha">) {
  const { token } = await props.searchParams;
  const codigo = typeof token === "string" ? token : "";
  const situacao = await conferirLink(codigo);

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <h1 className="text-2xl font-extrabold">Criar nova senha</h1>
      {situacao === "VALIDO" ? (
        <FormularioNovaSenha token={codigo} />
      ) : (
        <div className="space-y-3">
          <p role="alert" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" /> {MENSAGEM_LINK[situacao]}
          </p>
          <Link href="/esqueci-senha" className="block text-center font-semibold text-marca-700">
            Pedir um novo link
          </Link>
        </div>
      )}
    </div>
  );
}
