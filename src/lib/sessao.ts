// Usuário logado no momento.
// PROVISÓRIO: o login será criado na Etapa 4. Até lá, todo mundo é visitante
// e vê os preços como cliente CPF.
import type { Papel } from "@/config/constantes";

export type UsuarioAtual = { id: string; name: string; role: Papel };

export async function usuarioAtual(): Promise<UsuarioAtual | null> {
  return null;
}
