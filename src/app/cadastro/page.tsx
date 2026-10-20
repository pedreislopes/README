import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/sessao";
import { FormularioCadastro } from "./FormularioCadastro";

export const metadata = { title: "Criar conta" };

export default async function Cadastro(props: PageProps<"/cadastro">) {
  if (await usuarioAtual()) redirect("/conta");
  const { voltar, tipo } = await props.searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-extrabold">Criar conta</h1>
        <p className="mt-1 text-slate-600">É grátis e leva menos de um minuto.</p>
      </div>
      <FormularioCadastro
        voltar={typeof voltar === "string" ? voltar : ""}
        tipoInicial={tipo === "CNPJ" || tipo === "LOJISTA" ? tipo : "CPF"}
      />
      <p className="text-center text-slate-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-marca-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
