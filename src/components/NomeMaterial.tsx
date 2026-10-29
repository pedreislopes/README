// Nome do material + ícone "?" (quando houver explicação cadastrada).
// O título e o ícone ficam numa linha que quebra: a explicação abre logo abaixo.

import type { ReactNode } from "react";
import { EXPLICACOES } from "@/config/explicacoes-materiais";
import { AjudaMaterial } from "./AjudaMaterial";

type Props = {
  id: string;
  nome: string;
  /** O título em si (ex.: <h1>), para cada página escolher o tamanho */
  children: ReactNode;
};

export function NomeMaterial({ id, nome, children }: Props) {
  const explicacao = EXPLICACOES[id];
  if (!explicacao) return <>{children}</>;
  return (
    <div className="flex flex-wrap items-center gap-x-1">
      {children}
      <AjudaMaterial nome={nome} explicacao={explicacao} />
    </div>
  );
}
