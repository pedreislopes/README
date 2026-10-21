// Cartão de uma oferta (um produto em uma loja).
// No celular, o NOME DA LOJA e o PREÇO são o que mais aparece.

import { BadgeCheck, Briefcase, MapPin } from "lucide-react";
import { UNIDADES_BASE, type Papel, type PlanoPago, type UnidadeBase } from "@/config/constantes";
import { atacadoSoParaCnpj, faixasDisponiveis, precoPorUnidadeBase } from "@/domain/precos";
import { formatarPrecoUnidade, formatarReais } from "@/lib/dinheiro";
import { AdicionarAoCarrinho } from "./AdicionarAoCarrinho";
import { SeloDestaque } from "./SeloDestaque";

export type OfertaParaCartao = {
  id: string;
  brand: string | null;
  packageLabel: string;
  priceCents: number;
  baseQuantity: number;
  quantityStep: number;
  tiersForCpf: boolean;
  tiers: { minQuantity: number; priceCents: number }[];
  store: { name: string; region: string };
};

type Props = {
  oferta: OfertaParaCartao;
  unidadeBase: string;
  papel: Papel | null;
  melhorPreco?: boolean;
  /** Anúncio pago: mostra "Oferta destaque" ou "Oferta premium" + "Patrocinado" */
  plano?: PlanoPago;
  /** Mostra o nome do produto no cartão (usado na oferta destaque do topo) */
  nomeProduto?: string;
};

export function CartaoOferta({ oferta, unidadeBase, papel, melhorPreco, plano, nomeProduto }: Props) {
  const unidade = UNIDADES_BASE[unidadeBase as UnidadeBase] ?? unidadeBase;
  const porUnidade = precoPorUnidadeBase(oferta.priceCents, oferta.baseQuantity);
  const faixas = faixasDisponiveis(oferta, papel);
  const avisoCnpj = atacadoSoParaCnpj(oferta, papel);

  return (
    <article
      className={`rounded-xl border bg-white p-3 ${
        plano === "PREMIUM"
          ? "border-violet-300 bg-violet-50/50"
          : plano === "DESTAQUE"
            ? "border-amber-300 bg-amber-50/40"
            : melhorPreco
            ? "border-emerald-400 ring-1 ring-emerald-400"
            : "border-slate-200"
      }`}
    >
      {(melhorPreco || plano) && (
        <div className="mb-2 flex flex-wrap items-start gap-1.5">
          {plano && <SeloDestaque plano={plano} />}
          {melhorPreco && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <BadgeCheck className="h-3.5 w-3.5" /> Melhor preço
            </span>
          )}
        </div>
      )}

      {nomeProduto && <p className="mb-1 text-sm font-medium text-slate-600">{nomeProduto}</p>}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-slate-900">{oferta.store.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {oferta.store.region}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl leading-tight font-extrabold text-slate-900">
            {formatarReais(oferta.priceCents)}
          </p>
          <p className="text-xs text-slate-500">{oferta.packageLabel}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium">
          {formatarPrecoUnidade(porUnidade)}/{unidade}
        </span>
        {oferta.brand && <span>Marca: {oferta.brand}</span>}
      </div>

      {faixas.length > 0 && (
        <p className="mt-2 text-xs text-marca-700">
          <strong>Atacado:</strong>{" "}
          {faixas
            .map((f) => `${f.minQuantity}+ por ${formatarReais(f.priceCents)}`)
            .join(" · ")}
        </p>
      )}
      {avisoCnpj && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Briefcase className="h-3.5 w-3.5" />
          Preço de atacado disponível para CNPJ
        </p>
      )}

      <AdicionarAoCarrinho offerId={oferta.id} passo={oferta.quantityStep} embalagem={oferta.packageLabel} />
    </article>
  );
}
