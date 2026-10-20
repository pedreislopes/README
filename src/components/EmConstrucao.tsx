import { Hammer } from "lucide-react";

/** Aviso temporário para páginas que ainda serão construídas nas próximas etapas. */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Hammer className="h-10 w-10 text-marca-500" />
      <h1 className="mt-3 text-xl font-bold">{titulo}</h1>
      <p className="mt-1 text-slate-600">Esta página está em construção.</p>
    </div>
  );
}
