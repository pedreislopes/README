// Acesso ao painel do administrador: toda página e ação começa com exigirAdmin().
import { redirect } from "next/navigation";
import { usuarioAtual } from "./sessao";

export async function exigirAdmin() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/admin");
  if (usuario.role !== "ADMIN") redirect("/conta");
  return usuario;
}
