// =============================================================================
// Validação do formulário de cadastro
// =============================================================================
// Recebe o que a pessoa digitou e devolve:
// - os erros de cada campo (para mostrar embaixo do campo), ou
// - os dados limpos e prontos para gravar.
// A checagem de "e-mail/CPF já cadastrado" acontece depois, no banco.
// =============================================================================

import { REGIOES } from "@/config/constantes";
import { SENHA_MAX, SENHA_MIN } from "@/config/seguranca";
import { cnpjValido, cpfValido, somenteNumeros } from "./documentos";

export type TipoCadastro = "CPF" | "CNPJ" | "LOJISTA";

export type DadosCadastro = {
  tipo: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  senha: string;
  confirmacao: string;
  aceiteTermos: boolean;
  // Só para lojista
  nomeLoja?: string;
  regiao?: string;
  endereco?: string;
};

export type CadastroValido = {
  tipo: TipoCadastro;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  senha: string;
  loja?: { nome: string; regiao: string; endereco: string };
};

export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>;

/** E-mail em minúsculas e sem espaços: "Ana@Email.com " -> "ana@email.com" */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarCadastro(
  d: DadosCadastro,
): { ok: true; dados: CadastroValido } | { ok: false; erros: ErrosCadastro } {
  const erros: ErrosCadastro = {};
  const tipo = (["CPF", "CNPJ", "LOJISTA"] as const).find((t) => t === d.tipo);
  if (!tipo) erros.tipo = "Escolha o tipo de conta.";

  const nome = d.nome.trim().replace(/\s+/g, " ");
  if (nome.length < 3) {
    erros.nome = tipo === "CPF" ? "Informe seu nome completo." : "Informe a razão social ou nome da empresa.";
  }

  const documento = somenteNumeros(d.documento);
  if (tipo === "CPF" && !cpfValido(documento)) erros.documento = "CPF inválido. Confira os números.";
  if (tipo && tipo !== "CPF" && !cnpjValido(documento)) erros.documento = "CNPJ inválido. Confira os números.";

  const email = normalizarEmail(d.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";

  const telefone = somenteNumeros(d.telefone);
  if (telefone.length < 10 || telefone.length > 11) erros.telefone = "Informe o telefone com DDD.";

  if (d.senha.length < SENHA_MIN || d.senha.length > SENHA_MAX) {
    erros.senha = `A senha deve ter de ${SENHA_MIN} a ${SENHA_MAX} caracteres.`;
  } else if (!/[a-zA-Z]/.test(d.senha) || !/\d/.test(d.senha)) {
    erros.senha = "Use pelo menos uma letra e um número.";
  }
  if (d.confirmacao !== d.senha) erros.confirmacao = "As senhas não são iguais.";

  if (!d.aceiteTermos) erros.aceiteTermos = "É preciso aceitar os Termos de Uso e a Política de Privacidade.";

  let loja: CadastroValido["loja"];
  if (tipo === "LOJISTA") {
    const nomeLoja = (d.nomeLoja ?? "").trim();
    const regiao = REGIOES.find((r) => r === d.regiao);
    const endereco = (d.endereco ?? "").trim();
    if (nomeLoja.length < 3) erros.nomeLoja = "Informe o nome da loja.";
    if (!regiao) erros.regiao = "Escolha a região da loja.";
    if (endereco.length < 5) erros.endereco = "Informe o endereço da loja.";
    if (regiao) loja = { nome: nomeLoja, regiao, endereco };
  }

  if (Object.keys(erros).length > 0 || !tipo) return { ok: false, erros };
  return { ok: true, dados: { tipo, nome, documento, email, telefone, senha: d.senha, loja } };
}
