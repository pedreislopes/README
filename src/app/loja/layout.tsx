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
      {(loja.status === "SUSPENSA" || loja.status === "RECUSADA") && (
        <div role="status" className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800">
          <p className="font-semibold">
            {loja.status === "SUSPENSA"
              ? "Sua loja está suspensa e não aparece na busca. Seus pedidos e produtos continuam guardados."
              : "O cadastro da sua loja não foi aprovado."}
          </p>
          {loja.statusReason && <p className="mt-1 text-sm">Motivo: {loja.statusReason}</p>}
          <p className="mt-1 text-sm">Em caso de dúvida, fale com a equipe Solid.</p>
        </div>
      )}
      <AbasLoja novos={novos} />
      {children}
    </div>
  );
}
