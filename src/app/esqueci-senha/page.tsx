import Link from "next/link";
import { RECUPERACAO_SENHA } from "@/config/seguranca";
import { FormularioPedido } from "./FormularioPedido";

export const metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenha() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-extrabold">Esqueci minha senha</h1>
        <p className="mt-1 text-slate-600">
          Informe o e-mail do cadastro. Vamos enviar um link para você criar uma nova senha (ele vale por{" "}
          {RECUPERACAO_SENHA.validadeMinutos} minutos).
        </p>
      </div>
      <FormularioPedido />
      <p className="text-center text-slate-600">
        Lembrou?{" "}
        <Link href="/entrar" className="font-semibold text-marca-700">
          Voltar para Entrar
        </Link>
      </p>
    </div>
  );
}
