"use client";

import { useActionState, useState } from "react";
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

type Tipo = { id: string; name: string; category: string };

export function FormularioSugestao({
  tipos,
  inicial,
}: {
  tipos: Tipo[];
  inicial: { tipo: "material" | "marca"; material: string; ean: string };
}) {
  const [estado, acao, enviando] = useActionState(sugerirMaterial, {});
  const v = (campo: string, padrao = "") => estado.enviado?.[campo] ?? padrao;
  const [tipo, setTipo] = useState<"material" | "marca">(v("tipo", inicial.tipo) === "marca" ? "marca" : "material");
  const categorias = [...new Set(tipos.map((t) => t.category))];

  return (
    <form key={estado.resposta ?? 0} action={acao} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      {estado.ok && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Sugestão enviada! Você verá a resposta aqui embaixo.
        </p>
      )}
      <input type="hidden" name="tipo" value={tipo} />
      <div role="radiogroup" aria-label="O que você quer sugerir?" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            ["material", "Material novo"],
            ["marca", "Produto de marca"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={tipo === valor}
            onClick={() => setTipo(valor)}
            className={`rounded-lg py-2 text-sm font-semibold ${tipo === valor ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {tipo === "marca" ? (
        <>
          <p className="text-sm text-slate-600">
            Para um produto de marca que ainda não está na lista (ex.: um martelo ou uma tinta de outra marca). Informe só
            marca, modelo e código de barras: a equipe Solid completa as características.
          </p>
          <div>
            <label htmlFor="tipoProduto" className="block text-sm font-semibold">
              Tipo de produto
            </label>
            <select id="tipoProduto" name="tipoProduto" defaultValue={v("tipoProduto", inicial.material)} className={estiloCampo}>
              <option value="">Escolha…</option>
              {categorias.map((c) => (
                <optgroup key={c} label={c}>
                  {tipos
                    .filter((t) => t.category === c)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="marca" className="block text-sm font-semibold">
                Marca
              </label>
              <input id="marca" name="marca" defaultValue={v("marca")} maxLength={60} className={estiloCampo} />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-semibold">
                Modelo
              </label>
              <input id="modelo" name="modelo" defaultValue={v("modelo")} maxLength={80} className={estiloCampo} />
            </div>
          </div>
          <div>
            <label htmlFor="codigoBarras" className="block text-sm font-semibold">
              Código de barras (EAN)
            </label>
            <input
              id="codigoBarras"
              name="codigoBarras"
              inputMode="numeric"
              defaultValue={v("codigoBarras", inicial.ean)}
              placeholder="Os números embaixo das barras, ex.: 7891234567890"
              className={estiloCampo}
            />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
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
