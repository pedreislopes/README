// =============================================================================
// Configurações de segurança do login e do cadastro
// =============================================================================

/** Bloqueio contra força bruta (muitas senhas testadas seguidas) */
export const LIMITE_LOGIN = {
  /** Erros de senha seguidos permitidos para o MESMO e-mail */
  falhasPorEmail: 5,
  /** Erros de senha permitidos vindos do MESMO endereço de internet (IP) */
  falhasPorIp: 20,
  /** Por quanto tempo os erros são contados e o bloqueio dura */
  janelaMinutos: 15,
};

/** Quanto tempo a pessoa fica logada sem precisar entrar de novo */
export const DURACAO_SESSAO_DIAS = 30;

/**
 * "Custo" da criptografia de senha (bcrypt). Cada +1 dobra o tempo de cálculo.
 * 12 leva ~0,3 s por senha: imperceptível para quem entra, caro para quem ataca.
 */
export const CUSTO_BCRYPT = 12;

/** Senha: tamanho mínimo e máximo (o bcrypt só considera até 72 bytes) */
export const SENHA_MIN = 8;
export const SENHA_MAX = 64;

/** Versão dos Termos de Uso e da Política de Privacidade aceitos no cadastro */
export const VERSAO_TERMOS = "2026-10-provisoria";
