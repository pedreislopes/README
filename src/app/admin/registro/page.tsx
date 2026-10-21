// Registro de auditoria: quem fez o quê e quando. Somente leitura.
import Link from "next/link";
import { ACOES_ADMIN, type AcaoAdmin } from "@/lib/auditoria";
import { exigirAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata = { title: "Registro de ações" };

const LIMITE = 200;

export default async function Registro(props: PageProps<"/admin/registro">) {
  // Verificação própria em cada página: a moldura (layout) sozinha não garante a proteção
  await exigirAdmin();
  const { acao } = await props.searchParams;
  const filtro = typeof acao === "string" && acao in ACOES_ADMIN ? acao : "";
  const registros = await db.adminLog.findMany({
    where: filtro ? { action: filtro } : {},
    orderBy: { createdAt: "desc" },
    take: LIMITE,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Todas as ações feitas no painel do administrador ficam registradas aqui e não podem ser apagadas pelo site.
      </p>
      <form action="/admin/registro" className="flex gap-2">
        <select name="acao" defaultValue={filtro} aria-label="Tipo de ação" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <option value="">Todas as ações</option>
          {Object.entries(ACOES_ADMIN).map(([v, rot]) => (
            <option key={v} value={v}>
              {rot}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 font-bold text-white">
          Filtrar
        </button>
      </form>
      {registros.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">Nenhuma ação registrada.</p>
      ) : (
        <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {registros.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <p>
                <strong>{ACOES_ADMIN[r.action as AcaoAdmin] ?? r.action}</strong> — {r.details}
              </p>
              <p className="text-xs text-slate-500">
                {r.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · por {r.adminName}
              </p>
            </li>
          ))}
        </ol>
      )}
      {registros.length === LIMITE && (
        <p className="text-center text-xs text-slate-500">
          Mostrando as {LIMITE} mais recentes. <Link href="/admin/registro">Use o filtro</Link> para encontrar ações antigas.
        </p>
      )}
    </div>
  );
}
