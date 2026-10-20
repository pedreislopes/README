// Minha conta: dados do usuário (com documento mascarado) e botão de sair.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, LogOut, ShieldCheck } from "lucide-react";
import { PAPEIS, STATUS_LOJA, type StatusLoja } from "@/config/constantes";
import { mascararDocumento } from "@/domain/documentos";
import { sair } from "@/lib/acoes-conta";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

export const metadata = { title: "Minha conta" };

function formatarTelefone(n: string | null) {
  if (!n) return "—";
  return n.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}

export default async function Conta() {
  const atual = await usuarioAtual();
  if (!atual) redirect("/entrar?voltar=/conta");

  const usuario = await db.user.findUniqueOrThrow({
    where: { id: atual.id },
    include: { store: true },
  });
  const loja = usuario.store;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-extrabold">Minha conta</h1>

      {usuario.role === "CNPJ" && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <ShieldCheck className="h-5 w-5" /> Conta empresa: você vê os preços de atacado.
        </p>
      )}

      {loja && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Sua loja</p>
          <p className="text-lg font-bold">{loja.name}</p>
          <p className="text-sm text-slate-600">{loja.region}</p>
          <p
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
              loja.status === "APROVADA"
                ? "bg-emerald-100 text-emerald-800"
                : loja.status === "PENDENTE"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {loja.status === "PENDENTE" && <Clock className="h-4 w-4" />}
            {STATUS_LOJA[loja.status as StatusLoja] ?? loja.status}
          </p>
          {loja.status === "PENDENTE" && (
            <p className="mt-2 text-sm text-slate-600">
              Nossa equipe vai analisar seu cadastro. Enquanto isso, seus produtos não aparecem na busca.
            </p>
          )}
        </section>
      )}

      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {[
          ["Nome", usuario.name],
          ["Tipo de conta", PAPEIS[atual.role]],
          [usuario.document.length === 11 ? "CPF" : "CNPJ", mascararDocumento(usuario.document)],
          ["E-mail", usuario.email],
          ["Telefone", formatarTelefone(usuario.phone)],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">{rotulo}</dt>
            <dd className="text-right text-sm font-medium break-all">{valor}</dd>
          </div>
        ))}
      </dl>

      {usuario.termsAcceptedAt && (
        <p className="text-xs text-slate-500">
          Termos e Política de Privacidade aceitos em{" "}
          {usuario.termsAcceptedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.{" "}
          <Link href="/privacidade" className="underline">
            Ver política
          </Link>
        </p>
      )}

      <form action={sair}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </form>
    </div>
  );
}
