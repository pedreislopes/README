import Link from "next/link";
import { redirect } from "next/navigation";
import { ehAmbienteDeTeste } from "@/config/ambiente";
import { usuarioAtual } from "@/lib/sessao";
import { FormularioLogin } from "./FormularioLogin";

export const metadata = { title: "Entrar" };

export default async function Entrar(props: PageProps<"/entrar">) {
  if (await usuarioAtual()) redirect("/conta");
  const { voltar, senha } = await props.searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-extrabold">Entrar no Solid</h1>
        <p className="mt-1 text-slate-600">Use o e-mail e a senha do seu cadastro.</p>
      </div>
      {senha === "redefinida" && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
          Senha alterada! Entre com a nova senha.
        </p>
      )}
      <FormularioLogin voltar={typeof voltar === "string" ? voltar : ""} />
      {ehAmbienteDeTeste() && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-bold">Contas de teste (senha: solid123)</p>
          <ul className="mt-1 space-y-0.5">
            <li>Cliente: cpf@teste.com</li>
            <li>Empresa (atacado): cnpj@teste.com</li>
            <li>Lojista: lojista@teste.com</li>
            <li>Administrador: admin@teste.com</li>
          </ul>
        </div>
      )}
      <p className="text-center text-slate-600">
        Ainda não tem conta?{" "}
        <Link
          href={`/cadastro${typeof voltar === "string" ? `?voltar=${encodeURIComponent(voltar)}` : ""}`}
          className="font-semibold text-marca-700"
        >
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  );
}
