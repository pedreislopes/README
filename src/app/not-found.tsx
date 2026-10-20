import Link from "next/link";
import { SearchX } from "lucide-react";

/** Página mostrada quando o endereço não existe (ou o conteúdo não pertence a quem está acessando) */
export default function NaoEncontrado() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <SearchX className="h-10 w-10 text-slate-400" />
      <h1 className="mt-3 text-xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-slate-600">O endereço pode estar errado ou o conteúdo não está mais disponível.</p>
      <Link href="/" className="mt-4 rounded-lg bg-marca-600 px-4 py-2.5 font-semibold text-white">
        Voltar ao início
      </Link>
    </div>
  );
}
