// Moldura do painel do lojista: aviso de loja pendente + abas.
// exigirLoja() barra quem não é lojista (ver src/lib/loja.ts).
import { Clock } from "lucide-react";
import { contarPedidosNovos, exigirLoja } from "@/lib/loja";
import { AbasLoja } from "./AbasLoja";

export default async function LayoutLoja({ children }: LayoutProps<"/loja">) {
  const { loja } = await exigirLoja();
  const novos = await contarPedidosNovos(loja.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Painel da loja</p>
        <h1 className="text-xl font-extrabold">{loja.name}</h1>
      </div>
      {loja.status === "PENDENTE" && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 font-semibold text-amber-900">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          Sua loja ainda não aparece na busca. Aguardando aprovação.
        </p>
      )}
      {loja.status === "BLOQUEADA" && (
        <p role="status" className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          Sua loja está bloqueada e não aparece na busca. Fale com a equipe Solid.
        </p>
      )}
      <AbasLoja novos={novos} />
      {children}
    </div>
  );
}
