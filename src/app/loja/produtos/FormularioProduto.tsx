"use client";

// Cadastro / edição de um produto da loja.

import Link from "next/link";
import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Alerta, estiloBotaoPrincipal, estiloCampo, MensagemErro } from "@/components/Formulario";
import { UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { excluirProduto, salvarProduto } from "@/lib/acoes-loja";

type Material = { id: string; name: string; category: string; baseUnit: string; brandMatters: boolean };

export type ValoresProduto = {
  id?: string;
  productId: string;
  packageLabel: string;
  baseQuantity: string;
  preco: string;
  brand: string;
  quantityStep: string;
  tiersForCpf: boolean;
  active: boolean;
  faixas: { min: string; preco: string }[];
};

const SUGESTOES_EMBALAGEM = [
  "Saco 50 kg", "Saco 40 kg", "Saco 25 kg", "Saco 20 kg", "m³", "Milheiro", "Unidade",
  "Barra 12 m", "Barra 6 m", "Lata 18 L", "Rolo 100 m", "Rolo 50 m", "Caixa 2,5 m²", "Pacote 1 kg",
];

export function FormularioProduto({ materiais, valores }: { materiais: Material[]; valores: ValoresProduto }) {
  const [estado, acao, enviando] = useActionState(salvarProduto, {});
  const e = estado.erros ?? {};
  // Depois de um erro, os campos voltam com o que foi digitado
  const env = estado.enviado;
  const v = (campo: string, padrao: string) => env?.[campo] ?? padrao;
  const marcado = (campo: string, padrao: boolean) => (env ? env[campo] === "on" : padrao);
  // O material escolhido fica guardado só para mostrar a unidade ("em kg", "em m³").
  // O campo em si não é "controlado", para não se apagar quando o formulário volta com erro.
  const [productId, setProductId] = useState(valores.productId);
  const material = materiais.find((m) => m.id === productId);
  const unidade = material ? (UNIDADES_BASE[material.baseUnit as UnidadeBase] ?? material.baseUnit) : null;
  const categorias = [...new Set(materiais.map((m) => m.category))];
  const faixas = [0, 1, 2].map((i) => ({
    min: v(`faixaMin${i}`, valores.faixas[i]?.min ?? ""),
    preco: v(`faixaPreco${i}`, valores.faixas[i]?.preco ?? ""),
  }));

  return (
    // key: a cada resposta com erro o formulário é redesenhado já com o que foi digitado
    // (sem isso, as caixas de seleção voltariam vazias)
    <form key={estado.resposta ?? 0} action={acao} className="space-y-5">
      {e.geral && <Alerta>{e.geral}</Alerta>}
      {valores.id && <input type="hidden" name="id" value={valores.id} />}

      <div>
        <label htmlFor="productId" className="block text-sm font-semibold">
          Material
        </label>
        <select
          id="productId"
          name="productId"
          defaultValue={v("productId", valores.productId)}
          onChange={(ev) => setProductId(ev.target.value)}
          className={estiloCampo}
          aria-invalid={e.productId ? true : undefined}
        >
          <option value="">Escolha o material…</option>
          {categorias.map((c) => (
            <optgroup key={c} label={c}>
              {materiais
                .filter((m) => m.category === c)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <MensagemErro erro={e.productId} />
        <p className="mt-1 text-xs text-slate-500">
          Não achou o material?{" "}
          <Link href="/loja/sugerir" className="font-semibold text-marca-700 underline">
            Sugerir material
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="packageLabel" className="block text-sm font-semibold">
            Como é vendido
          </label>
          <input
            id="packageLabel"
            name="packageLabel"
            list="sugestoes-embalagem"
            defaultValue={v("packageLabel", valores.packageLabel)}
            placeholder="Ex.: Saco 50 kg"
            className={estiloCampo}
            aria-invalid={e.packageLabel ? true : undefined}
          />
          <datalist id="sugestoes-embalagem">
            {SUGESTOES_EMBALAGEM.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <MensagemErro erro={e.packageLabel} />
        </div>
        <div>
          <label htmlFor="baseQuantity" className="block text-sm font-semibold">
            Quanto vem {unidade ? `(em ${unidade})` : ""}
          </label>
          <input
            id="baseQuantity"
            name="baseQuantity"
            inputMode="decimal"
            defaultValue={v("baseQuantity", valores.baseQuantity)}
            placeholder="Ex.: 50"
            className={estiloCampo}
            aria-invalid={e.baseQuantity ? true : undefined}
          />
          <MensagemErro erro={e.baseQuantity} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-500">
        Usado para comparar preços entre lojas. Ex.: saco de 50 kg → 50; milheiro → 1000; m³ → 1.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="preco" className="block text-sm font-semibold">
            Preço (R$)
          </label>
          <input
            id="preco"
            name="preco"
            inputMode="decimal"
            defaultValue={v("preco", valores.preco)}
            placeholder="0,00"
            className={`${estiloCampo} text-lg font-bold`}
            aria-invalid={e.priceCents ? true : undefined}
          />
          <MensagemErro erro={e.priceCents} />
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-semibold">
            Marca{" "}
            {material?.brandMatters ? (
              <span className="font-normal text-marca-700">(obrigatória)</span>
            ) : (
              <span className="font-normal text-slate-500">(opcional)</span>
            )}
          </label>
          <input
            id="brand"
            name="brand"
            defaultValue={v("brand", valores.brand)}
            className={estiloCampo}
            aria-invalid={e.brand ? true : undefined}
          />
          <MensagemErro erro={e.brand} />
        </div>
      </div>

      {material?.baseUnit === "m3" ? (
        <div>
          <label htmlFor="quantityStep" className="block text-sm font-semibold">
            Vende de quanto em quanto
          </label>
          <select id="quantityStep" name="quantityStep" defaultValue={v("quantityStep", valores.quantityStep)} className={estiloCampo}>
            <option value="0.5">De 0,5 em 0,5 m³ (meio metro)</option>
            <option value="1">Só m³ inteiro</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="quantityStep" value="1" />
      )}

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Preço de atacado (opcional)</legend>
        <p className="text-xs text-slate-500">Preço mais baixo para quem compra em quantidade. Ex.: a partir de 50 sacos, R$ 36,00 cada.</p>
        {faixas.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="shrink-0">A partir de</span>
            <input name={`faixaMin${i}`} inputMode="numeric" defaultValue={f.min} aria-label={`Faixa ${i + 1}: quantidade mínima`} className="w-20 rounded-lg border border-slate-300 px-2 py-2.5 text-center text-base" />
            <span className="shrink-0">por R$</span>
            <input name={`faixaPreco${i}`} inputMode="decimal" defaultValue={f.preco} aria-label={`Faixa ${i + 1}: preço`} className="w-24 rounded-lg border border-slate-300 px-2 py-2.5 text-center text-base" />
          </div>
        ))}
        <MensagemErro erro={e.tiers} />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="tiersForCpf" defaultChecked={marcado("tiersForCpf", valores.tiersForCpf)} className="mt-0.5 h-5 w-5 accent-marca-600" />
          <span>
            Oferecer o atacado também para <strong>pessoa física (CPF)</strong>. Sem marcar, só empresas (CNPJ) veem.
          </span>
        </label>
      </fieldset>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-semibold">
        <input type="checkbox" name="active" defaultChecked={marcado("active", valores.active)} className="h-6 w-6 accent-emerald-600" />
        Disponível para venda
      </label>

      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Salvando…" : "Salvar produto"}
      </button>
      <Link href="/loja/produtos" className="block text-center font-semibold text-slate-600">
        Cancelar
      </Link>

      {valores.id && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remover este produto da loja? Esta ação não pode ser desfeita.\n\nDica: para pausar sem apagar, use \"Sem estoque\".")) {
              void excluirProduto(valores.id!);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-semibold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" /> Remover produto
        </button>
      )}
    </form>
  );
}
