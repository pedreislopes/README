// =============================================================================
// "Esqueci minha senha": regras do link enviado por e-mail
// =============================================================================
// - O link tem um código aleatório; no banco guardamos só o hash dele.
// - Vale pouco tempo (RECUPERACAO_SENHA.validadeMinutos) e só uma vez.
// - Pedir um link novo cancela os anteriores.
// - A resposta ao pedir o link é SEMPRE a mesma, exista ou não a conta.
// =============================================================================

export type SituacaoLink = "VALIDO" | "EXPIRADO" | "USADO" | "INEXISTENTE";

export function situacaoDoLink(
  pedido: { expiresAt: Date; usedAt: Date | null } | null,
  agora: Date = new Date(),
): SituacaoLink {
  if (!pedido) return "INEXISTENTE";
  if (pedido.usedAt) return "USADO";
  if (pedido.expiresAt.getTime() <= agora.getTime()) return "EXPIRADO";
  return "VALIDO";
}

export const MENSAGEM_LINK: Record<Exclude<SituacaoLink, "VALIDO">, string> = {
  INEXISTENTE: "Este link de redefinição não é válido. Confira se copiou o endereço inteiro, ou peça um novo.",
  USADO: "Este link já foi usado (ou um link mais novo foi pedido). Peça um novo se precisar.",
  EXPIRADO: "Este link venceu. Por segurança, ele vale só por pouco tempo. Peça um novo.",
};

/** Resposta mostrada sempre, exista ou não uma conta com o e-mail */
export const MENSAGEM_PEDIDO_ENVIADO =
  "Se houver uma conta com este e-mail, enviaremos um link para criar uma nova senha. Confira também a caixa de spam.";

export function textoEmailRecuperacao(nome: string, link: string, validadeMinutos: number) {
  const primeiroNome = nome.split(" ")[0];
  return {
    assunto: "Solid: crie uma nova senha",
    texto: [
      `Olá, ${primeiroNome}!`,
      "",
      "Recebemos um pedido para criar uma nova senha na sua conta do Solid.",
      `Use o link abaixo (vale por ${validadeMinutos} minutos e só pode ser usado uma vez):`,
      "",
      link,
      "",
      "Se não foi você, ignore este e-mail: sua senha continua a mesma.",
      "",
      "Equipe Solid",
    ].join("\n"),
  };
}
