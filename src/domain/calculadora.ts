// =============================================================================
// Calculadora de obra — lógica
// =============================================================================
// Os NÚMEROS (coeficientes, perdas, traços) ficam em src/config/calculadora.ts.
// Aqui fica só a conta:
//   1. medida do serviço (m² ou m³) a partir do que o cliente digitou;
//   2. quantidade de cada material = medida × coeficiente × (1 + perda);
//   3. para cada material, a oferta mais barata, com a quantidade
//      arredondada PARA CIMA no formato vendido (sacos inteiros, 0,5 m³...).
// =============================================================================

import type { Papel } from "@/config/constantes";
import type { MaterialServico, Servico } from "@/config/calculadora";
import { calcularItem, type OfertaPrecificavel } from "./precos";

export type ValoresInformados = Record<string, string | undefined>;

export type Medida = {
  valor: number;
  unidade: "m²" | "m³";
  /** Ex.: "Muro de 10 m × 2 m = 20 m²" */
  texto: string;
};

export type MaterialCalculado = {
  material: MaterialServico;
  /** Sem perda */
  semPerda: number;
  /** Com perda: a quantidade exata que a obra precisa (na unidade do produto) */
  exato: number;
  /** Ex.: "20 m² × 25 tijolos/m² = 500 + 10% de perda = 550 tijolos" */
  explicacao: string;
};

export type ResultadoCalculo =
  | { ok: true; medida: Medida; materiais: MaterialCalculado[]; perda: number }
  | { ok: false; erros: Record<string, string> };

/**
 * Número para a explicação do cálculo: 2 casas, ou até 4 quando é menor que 1
 * (para coeficientes pequenos como 0,0132 m³ de areia por m²).
 */
const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2 });
const lerNumero = (t: string | undefined) => (t ? Number(t.replace(",", ".")) : NaN);

/** Valida os campos e calcula a medida do serviço */
export function calcularMedida(
  servico: Servico,
  valores: ValoresInformados,
): { ok: true; medida: Medida } | { ok: false; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const n: Record<string, number> = {};
  for (const campo of servico.campos) {
    // Campo vazio usa o valor padrão (ex.: espessura de 5 cm), se houver
    const bruto = valores[campo.id]?.trim();
    const v = bruto ? lerNumero(bruto) : (campo.padrao ?? NaN);
    if (!Number.isFinite(v)) erros[campo.id] = `Informe ${campo.rotulo.toLowerCase()}.`;
    else if (v < campo.min || v > campo.max) {
      erros[campo.id] = `Use um valor entre ${fmt(campo.min)} e ${fmt(campo.max)} ${campo.unidade}.`;
    } else n[campo.id] = v;
  }
  if (Object.keys(erros).length > 0) return { ok: false, erros };

  const nome = servico.nome;
  switch (servico.medida) {
    case "comprimento_x_altura": {
      const area = n.comprimento * n.altura;
      return {
        ok: true,
        medida: { valor: area, unidade: "m²", texto: `${nome}: ${fmt(n.comprimento)} m × ${fmt(n.altura)} m = ${fmt(area)} m²` },
      };
    }
    case "area":
      return { ok: true, medida: { valor: n.area, unidade: "m²", texto: `${nome}: ${fmt(n.area)} m²` } };
    case "area_x_espessura": {
      const volume = n.area * (n.espessura / 100);
      return {
        ok: true,
        medida: {
          valor: volume,
          unidade: "m³",
          texto: `${nome}: ${fmt(n.area)} m² × ${fmt(n.espessura)} cm de espessura = ${fmt(volume)} m³`,
        },
      };
    }
  }
}

/** Calcula as quantidades de todos os materiais do serviço */
export function calcularServico(servico: Servico, valores: ValoresInformados, perdaPadrao: number): ResultadoCalculo {
  const r = calcularMedida(servico, valores);
  if (!r.ok) return r;
  const { medida } = r;
  const perda = servico.perda ?? perdaPadrao;
  const opcao = servico.opcao ? (valores[servico.opcao.id] ?? servico.opcao.valores[0].valor) : null;

  const materiais = servico.materiais
    .filter((m) => !m.somenteSe || m.somenteSe.valor === opcao)
    .map((material) => {
      const semPerda = medida.valor * material.coeficiente;
      const exato = semPerda * (1 + perda);
      const explicacao =
        `${fmt(medida.valor)} ${medida.unidade} × ${fmt(material.coeficiente)} ${material.unidadeTexto}/${medida.unidade} = ` +
        `${fmt(semPerda)} + ${Math.round(perda * 100)}% de perda = ${fmt(exato)} ${material.unidadeTexto}`;
      return { material, semPerda, exato, explicacao };
    });

  return { ok: true, medida, materiais, perda };
}

// -----------------------------------------------------------------------------
// Escolha da oferta mais barata
// -----------------------------------------------------------------------------

export type OfertaCandidata = OfertaPrecificavel & { id: string; quantityStep: number };

export type Escolha<O> = {
  oferta: O;
  /** Quantas embalagens comprar (já arredondado para cima no passo da oferta) */
  embalagens: number;
  /** Quantas embalagens seriam exatamente necessárias (sem arredondar) */
  embalagensExatas: number;
  totalCents: number;
};

/** Arredonda PARA CIMA até o próximo múltiplo do passo (tolerando erros de conta como 2.0000001) */
export function arredondarParaCima(valor: number, passo: number): number {
  const multiplos = Math.ceil(valor / passo - 1e-9);
  return Math.max(1, multiplos) * passo;
}

/**
 * Entre as ofertas do material, escolhe a de MENOR CUSTO TOTAL para cobrir a
 * quantidade exata (considerando embalagem, arredondamento e faixas de atacado).
 * Ex.: 550 tijolos -> 1 milheiro (sobram 450) ou 550 unidades avulsas: vence o mais barato.
 */
export function escolherOfertaMaisBarata<O extends OfertaCandidata>(
  quantidadeExata: number,
  ofertas: O[],
  papel: Papel | null,
): Escolha<O> | null {
  let melhor: Escolha<O> | null = null;
  for (const oferta of ofertas) {
    const embalagensExatas = quantidadeExata / oferta.baseQuantity;
    const embalagens = arredondarParaCima(embalagensExatas, oferta.quantityStep);
    const { totalCents } = calcularItem(oferta, papel, embalagens, 1);
    if (!melhor || totalCents < melhor.totalCents) {
      melhor = { oferta, embalagens, embalagensExatas, totalCents };
    }
  }
  return melhor;
}

// -----------------------------------------------------------------------------
// "Tudo numa loja só"
// -----------------------------------------------------------------------------

export type LojaUnica<O> = {
  storeId: string;
  /** Escolha de cada material NESTA loja (null = a loja não vende o item) */
  escolhas: Map<string, Escolha<O> | null>;
  totalCents: number;
  /** Quantos materiais da lista a loja tem */
  cobertos: number;
};

/**
 * Escolhe UMA loja para comprar a lista inteira: a que tem mais itens da lista
 * (de preferência todos) e, entre essas, a de menor total.
 */
export function escolherLojaUnica<O extends OfertaCandidata & { storeId: string }>(
  materiais: { produtoId: string; exato: number }[],
  ofertasPorProduto: Map<string, O[]>,
  papel: Papel | null,
): LojaUnica<O> | null {
  const lojas = new Set([...ofertasPorProduto.values()].flat().map((o) => o.storeId));
  let melhor: LojaUnica<O> | null = null;

  for (const storeId of lojas) {
    const escolhas = new Map<string, Escolha<O> | null>();
    let totalCents = 0;
    let cobertos = 0;
    for (const m of materiais) {
      const daLoja = (ofertasPorProduto.get(m.produtoId) ?? []).filter((o) => o.storeId === storeId);
      const escolha = escolherOfertaMaisBarata(m.exato, daLoja, papel);
      escolhas.set(m.produtoId, escolha);
      if (escolha) {
        totalCents += escolha.totalCents;
        cobertos++;
      }
    }
    const ehMelhor =
      !melhor || cobertos > melhor.cobertos || (cobertos === melhor.cobertos && totalCents < melhor.totalCents);
    if (cobertos > 0 && ehMelhor) melhor = { storeId, escolhas, totalCents, cobertos };
  }
  return melhor;
}
