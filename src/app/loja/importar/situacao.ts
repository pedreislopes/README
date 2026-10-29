// Como cada situação de importação aparece na tela
export const SITUACAO_IMPORTACAO: Record<string, { rotulo: string; cor: string }> = {
  PREVIA: { rotulo: "Aguardando confirmação", cor: "bg-amber-100 text-amber-800" },
  APLICADA: { rotulo: "Aplicada", cor: "bg-emerald-100 text-emerald-800" },
  DESCARTADA: { rotulo: "Descartada", cor: "bg-slate-100 text-slate-600" },
};
