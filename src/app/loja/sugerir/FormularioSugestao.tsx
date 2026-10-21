"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alerta, estiloBotaoPrincipal, estiloCampo } from "@/components/Formulario";
import { CATEGORIAS, UNIDADES_BASE } from "@/config/constantes";
import { sugerirMaterial } from "@/lib/acoes-loja";

const COMO_COMPARAR: Record<string, string> = {
  kg: "Por quilo (kg) — ex.: cimento, argamassa",
  m3: "Por metro cúbico (m³) — ex.: areia, brita",
  m2: "Por metro quadrado (m²) — ex.: piso, revestimento",
  un: "Por unidade — ex.: tijolo, telha, registro",
  m: "Por metro — ex.: cano, fio, vergalhão",
  l: "Por litro — ex.: tinta",
};

export function FormularioSugestao() {
  const [estado, acao, enviando] = useActionState(sugerirMaterial, {});
  const v = (campo: string) => estado.enviado?.[campo] ?? "";
  return (
    <form key={estado.resposta ?? 0} action={acao} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      {estado.ok && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Sugestão enviada! Você verá a resposta aqui embaixo.
        </p>
      )}
      <div>
        <label htmlFor="nome" className="block text-sm font-semibold">
          Nome do material
        </label>
        <input id="nome" name="nome" defaultValue={v("nome")} placeholder="Ex.: Bloco de concreto 19x19x39 cm" className={estiloCampo} />
      </div>
      <div>
        <label htmlFor="categoria" className="block text-sm font-semibold">
          Categoria
        </label>
        <select id="categoria" name="categoria" defaultValue={v("categoria")} className={estiloCampo}>
          <option value="">Escolha…</option>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="unidade" className="block text-sm font-semibold">
          Como comparar o preço entre lojas
        </label>
        <select id="unidade" name="unidade" defaultValue={v("unidade")} className={estiloCampo}>
          <option value="">Escolha…</option>
          {Object.keys(UNIDADES_BASE).map((u) => (
            <option key={u} value={u}>
              {COMO_COMPARAR[u]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="observacao" className="block text-sm font-semibold">
          Observação <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea id="observacao" name="observacao" defaultValue={v("observacao")} rows={2} maxLength={500} placeholder="Ex.: muito procurado por construtoras" className={estiloCampo} />
      </div>
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Enviando…" : "Enviar sugestão"}
      </button>
    </form>
  );
}
