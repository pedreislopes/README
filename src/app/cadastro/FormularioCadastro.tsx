"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Briefcase, Store, User } from "lucide-react";
import { Campo, estiloBotaoPrincipal, estiloCampo, MensagemErro } from "@/components/Formulario";
import { REGIOES } from "@/config/constantes";
import { SENHA_MIN } from "@/config/seguranca";
import { cadastrar } from "@/lib/acoes-conta";

type Tipo = "CPF" | "CNPJ" | "LOJISTA";

const TIPOS = [
  { valor: "CPF", titulo: "Pessoa física", texto: "Vou reformar ou construir", Icone: User },
  { valor: "CNPJ", titulo: "Empresa", texto: "Construtora ou empreiteiro: preço de atacado", Icone: Briefcase },
  { valor: "LOJISTA", titulo: "Lojista", texto: "Quero vender no Solid", Icone: Store },
] as const;

/** Vai pondo pontos, barra e traço enquanto a pessoa digita o CPF/CNPJ */
function mascaraDocumento(texto: string, tipo: Tipo): string {
  const n = texto.replace(/\D/g, "");
  if (tipo === "CPF") {
    return n
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return n
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function FormularioCadastro({ voltar, tipoInicial }: { voltar: string; tipoInicial: Tipo }) {
  const [estado, acao, enviando] = useActionState(cadastrar, {});
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  const [tipo, setTipo] = useState<Tipo>((v.tipo as Tipo) || tipoInicial);
  const [documento, setDocumento] = useState(v.documento ?? "");
  const ehEmpresa = tipo !== "CPF";

  return (
    <form action={acao} className="space-y-5" noValidate>
      <input type="hidden" name="voltar" value={voltar} />

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">Tipo de conta</legend>
        <div className="mt-2 grid gap-2">
          {TIPOS.map(({ valor, titulo, texto, Icone }) => (
            <label
              key={valor}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${
                tipo === valor ? "border-marca-500 bg-marca-50" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={tipo === valor}
                onChange={() => {
                  setTipo(valor);
                  setDocumento(mascaraDocumento(documento, valor));
                }}
                className="sr-only"
              />
              <Icone className={`h-6 w-6 shrink-0 ${tipo === valor ? "text-marca-600" : "text-slate-400"}`} />
              <span>
                <span className="block font-bold">{titulo}</span>
                <span className="block text-sm text-slate-600">{texto}</span>
              </span>
            </label>
          ))}
        </div>
        <MensagemErro erro={e.tipo} />
      </fieldset>

      <Campo
        rotulo={ehEmpresa ? "Razão social ou nome da empresa" : "Nome completo"}
        name="nome"
        autoComplete={ehEmpresa ? "organization" : "name"}
        defaultValue={v.nome}
        erro={e.nome}
      />
      <Campo
        rotulo={ehEmpresa ? "CNPJ" : "CPF"}
        name="documento"
        inputMode="numeric"
        placeholder={ehEmpresa ? "00.000.000/0000-00" : "000.000.000-00"}
        value={documento}
        onChange={(ev) => setDocumento(mascaraDocumento(ev.target.value, tipo))}
        erro={e.documento}
      />
      <Campo rotulo="E-mail" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} erro={e.email} />
      <Campo rotulo="Telefone com DDD" name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(61) 99999-9999" defaultValue={v.telefone} erro={e.telefone} />

      {tipo === "LOJISTA" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800">Dados da loja</p>
          <Campo rotulo="Nome da loja" name="nomeLoja" defaultValue={v.nomeLoja} erro={e.nomeLoja} />
          <div>
            <label htmlFor="regiao" className="block text-sm font-semibold text-slate-800">
              Região do DF
            </label>
            <select id="regiao" name="regiao" defaultValue={v.regiao ?? ""} className={estiloCampo} aria-invalid={e.regiao ? true : undefined}>
              <option value="">Escolha…</option>
              {REGIOES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <MensagemErro erro={e.regiao} />
          </div>
          <Campo rotulo="Endereço da loja" name="endereco" autoComplete="street-address" defaultValue={v.endereco} erro={e.endereco} />
          <p className="text-xs text-slate-500">
            Sua loja será analisada pela equipe Solid antes de aparecer nas buscas.
          </p>
        </div>
      )}

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        dica={`Pelo menos ${SENHA_MIN} caracteres, com letras e números.`}
        erro={e.senha}
      />
      <Campo rotulo="Repita a senha" name="confirmacao" type="password" autoComplete="new-password" erro={e.confirmacao} />

      <div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" name="aceiteTermos" defaultChecked={v.aceiteTermos === "true"} className="mt-0.5 h-5 w-5 shrink-0 accent-marca-600" />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="font-semibold text-marca-700 underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="font-semibold text-marca-700 underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        <MensagemErro erro={e.aceiteTermos} />
      </div>

      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
