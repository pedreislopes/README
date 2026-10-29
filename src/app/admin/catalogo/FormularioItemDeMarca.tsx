"use client";

// Cadastro / edição de um produto de marca do catálogo central (administrador).
// As características mudam conforme o tipo de produto (src/config/caracteristicas.ts).

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alerta, estiloBotaoPrincipal, estiloCampo } from "@/components/Formulario";
import { CampoFoto } from "@/components/CampoFoto";
import { urlDaFoto } from "@/config/fotos";
import { modeloDe } from "@/config/caracteristicas";
import { ORIGENS_FOTO } from "@/config/fotos";
import { salvarItemDeMarca } from "@/lib/acoes-catalogo";

type Tipo = { id: string; name: string; specTemplate: string };
export type ValoresItem = {
  id?: string;
  tipo: string;
  marca: string;
  modelo: string;
  ean: string;
  embalagem: string;
  quantidade: string;
  ativo: boolean;
  /** Valores das características, já em texto (sim/não, números com vírgula) */
  caracteristicas: Record<string, string>;
  foto: { id: string; origem: string; autorizacao: string } | null;
};

export function FormularioItemDeMarca({ tipos, valores, sugestaoId }: { tipos: Tipo[]; valores: ValoresItem; sugestaoId?: string }) {
  const [estado, acao, enviando] = useActionState(salvarItemDeMarca, {});
  const env = estado.enviado;
  const v = (campo: string, padrao: string) => env?.[campo] ?? padrao;
  const [tipoId, setTipoId] = useState(v("tipo", valores.tipo));
  const tipo = tipos.find((t) => t.id === tipoId);
  const modelo = modeloDe(tipo?.specTemplate);

  return (
    <form key={estado.resposta ?? 0} action={acao} className="space-y-4">
      {estado.erros && estado.erros.length > 0 && (
        <Alerta>
          <ul className="list-disc pl-4">
            {estado.erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alerta>
      )}
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      {sugestaoId && <input type="hidden" name="sugestaoId" value={sugestaoId} />}

      <div>
        <label htmlFor="tipo" className="block text-sm font-semibold">
          Tipo de produto
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipoId}
          disabled={!!valores.id}
          onChange={(e) => setTipoId(e.target.value)}
          className={estiloCampo}
        >
          <option value="">Escolha…</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Texto rotulo="Marca" name="marca" valor={v("marca", valores.marca)} />
        <Texto rotulo="Modelo" name="modelo" valor={v("modelo", valores.modelo)} />
        <Texto rotulo="Código de barras (EAN)" name="ean" valor={v("ean", valores.ean)} inputMode="numeric" />
        <Texto rotulo="Embalagem" name="embalagem" valor={v("embalagem", valores.embalagem)} placeholder="Ex.: Unidade" />
        <Texto rotulo="Qtd. na embalagem" name="quantidade" valor={v("quantidade", valores.quantidade)} inputMode="decimal" />
      </div>

      {modelo && modelo.campos.length > 0 && (
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold">Características ({modelo.nome})</legend>
          <p className="text-xs text-slate-500">Só informações objetivas do fabricante. Em branco aparece como “Não informado”.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {modelo.campos.map((c) => {
              const nome = `carac_${c.chave}`;
              const valor = v(nome, valores.caracteristicas[c.chave] ?? "");
              const rotulo = `${c.rotulo}${c.unidade ? ` (${c.unidade})` : ""}`;
              if (c.tipo === "simnao" || c.tipo === "opcao") {
                const opcoes = c.tipo === "simnao" ? ["Sim", "Não"] : (c.opcoes ?? []);
                return (
                  <div key={c.chave}>
                    <label htmlFor={nome} className="block text-sm font-medium">
                      {rotulo}
                    </label>
                    <select id={nome} name={nome} defaultValue={valor} className={estiloCampo}>
                      <option value="">Não informado</option>
                      {opcoes.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              return <Texto key={c.chave} rotulo={rotulo} name={nome} valor={valor} inputMode={c.tipo === "numero" ? "decimal" : undefined} />;
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Foto principal</legend>
        {valores.foto && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura já otimizada */}
            <img src={urlDaFoto(valores.foto.id, true)} alt="Foto atual" className="h-20 w-20 rounded-lg border border-slate-200 object-contain" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removerFoto" className="h-5 w-5" /> Remover a foto atual
            </label>
          </div>
        )}
        <CampoFoto obrigatoria={false} rotulo={valores.foto ? "Trocar a foto" : "Foto"} />
        <div>
          <label htmlFor="origem" className="block text-sm font-medium">
            Origem da imagem
          </label>
          <input id="origem" name="origem" list="origens" defaultValue={v("origem", valores.foto?.origem ?? "")} className={estiloCampo} />
          <datalist id="origens">
            {ORIGENS_FOTO.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <Texto
          rotulo="Autorização de uso"
          name="autorizacao"
          valor={v("autorizacao", valores.foto?.autorizacao ?? "")}
          placeholder="Ex.: kit de imagens enviado pelo fabricante em 10/11/2026"
        />
      </fieldset>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-semibold">
        <input type="checkbox" name="ativo" defaultChecked={env ? env.ativo === "on" : valores.ativo} className="h-6 w-6 accent-emerald-600" />
        Ativo no catálogo (as lojas podem vender)
      </label>
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Salvando…" : "Salvar produto de marca"}
      </button>
      <Link href="/admin/catalogo" className="block text-center font-semibold text-slate-600">
        Cancelar
      </Link>
    </form>
  );
}

function Texto(props: { rotulo: string; name: string; valor: string; placeholder?: string; inputMode?: "numeric" | "decimal" }) {
  return (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium">
        {props.rotulo}
      </label>
      <input
        id={props.name}
        name={props.name}
        defaultValue={props.valor}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        className={estiloCampo}
      />
    </div>
  );
}
