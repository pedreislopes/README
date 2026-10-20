// =============================================================================
// Limite de tentativas de login (proteção contra força bruta)
// =============================================================================
// Contamos os erros de senha recentes. Ao chegar no limite, o login fica
// bloqueado até o erro mais antigo "vencer" (sair da janela de tempo).
// =============================================================================

export type SituacaoTentativas = {
  bloqueado: boolean;
  /** Minutos até liberar (arredondado para cima), quando bloqueado */
  minutosRestantes: number;
};

/**
 * @param falhas  datas dos erros de senha recentes
 * @param maximo  quantos erros são permitidos dentro da janela
 * @param janelaMinutos  tamanho da janela de tempo
 */
export function verificarBloqueio(
  falhas: Date[],
  maximo: number,
  janelaMinutos: number,
  agora: Date = new Date(),
): SituacaoTentativas {
  const janelaMs = janelaMinutos * 60_000;
  const recentes = falhas
    .filter((f) => agora.getTime() - f.getTime() < janelaMs)
    .sort((a, b) => a.getTime() - b.getTime());

  if (recentes.length < maximo) return { bloqueado: false, minutosRestantes: 0 };

  // Libera quando sobrarem menos que "maximo" erros dentro da janela
  const libera = recentes[recentes.length - maximo].getTime() + janelaMs;
  return { bloqueado: true, minutosRestantes: Math.max(1, Math.ceil((libera - agora.getTime()) / 60_000)) };
}
