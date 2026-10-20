// Peças de formulário reaproveitadas (campo com rótulo e mensagem de erro).
// Letras e áreas de toque grandes, pensando em quem usa o celular na obra.

import type { ComponentProps, ReactNode } from "react";

export const estiloCampo =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base focus:border-marca-500 focus:ring-2 focus:ring-marca-100 focus:outline-none aria-[invalid=true]:border-red-500";

export const estiloBotaoPrincipal =
  "w-full rounded-xl bg-marca-600 py-3.5 text-base font-bold text-white hover:bg-marca-700 disabled:opacity-60";

type CampoProps = ComponentProps<"input"> & {
  rotulo: string;
  erro?: string;
  dica?: ReactNode;
};

export function Campo({ rotulo, erro, dica, id, name, ...props }: CampoProps) {
  const idCampo = id ?? name;
  return (
    <div>
      <label htmlFor={idCampo} className="block text-sm font-semibold text-slate-800">
        {rotulo}
      </label>
      <input
        id={idCampo}
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idCampo}-erro` : undefined}
        className={estiloCampo}
        {...props}
      />
      {dica && !erro && <p className="mt-1 text-xs text-slate-500">{dica}</p>}
      <MensagemErro id={`${idCampo}-erro`} erro={erro} />
    </div>
  );
}

export function MensagemErro({ id, erro }: { id?: string; erro?: string }) {
  if (!erro) return null;
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-600">
      {erro}
    </p>
  );
}

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {children}
    </div>
  );
}
