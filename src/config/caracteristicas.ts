// =============================================================================
// Características técnicas comparadas lado a lado, por tipo de produto de marca
// =============================================================================
// Cada tipo de produto de marca (Product.specTemplate) usa um destes modelos.
// O ADMINISTRADOR preenche as características uma vez, no catálogo central;
// o lojista nunca preenche nada disso.
//
// Tipos de campo:
//   "numero"  número (aceita vírgula), com unidade opcional (ex.: g, mm, meses)
//   "texto"   texto livre curto
//   "simnao"  sim ou não
//   "opcao"   uma das opções da lista
//
// REGRA: só informações OBJETIVAS (medidas, materiais, certificações, garantia).
// Nunca avaliações de qualidade ("boa", "a melhor marca"...).
// Materiais padronizados (cimento, areia, brita...) não têm modelo: continuam
// sendo comparados só pelo preço por kg, m³ etc.
// =============================================================================

export type TipoCampo = "numero" | "texto" | "simnao" | "opcao";

export type CampoCaracteristica = {
  /** Nome interno (também é o nome da coluna na planilha de importação: carac_<chave>) */
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  unidade?: string;
  opcoes?: readonly string[];
};

export type ModeloCaracteristicas = {
  nome: string;
  campos: readonly CampoCaracteristica[];
};

const GARANTIA: CampoCaracteristica = { chave: "garantia_meses", rotulo: "Garantia", tipo: "numero", unidade: "meses" };

export const MODELOS_CARACTERISTICAS = {
  martelo: {
    nome: "Martelo",
    campos: [
      { chave: "peso_cabeca", rotulo: "Peso da cabeça", tipo: "numero", unidade: "g" },
      { chave: "material_cabo", rotulo: "Material do cabo", tipo: "opcao", opcoes: ["Madeira", "Fibra de vidro", "Aço", "Aço com empunhadura emborrachada"] },
      { chave: "comprimento", rotulo: "Comprimento", tipo: "numero", unidade: "mm" },
      GARANTIA,
    ],
  },
  trena: {
    nome: "Trena",
    campos: [
      { chave: "comprimento_fita", rotulo: "Comprimento da fita", tipo: "numero", unidade: "m" },
      { chave: "largura_fita", rotulo: "Largura da fita", tipo: "numero", unidade: "mm" },
      { chave: "trava", rotulo: "Trava da fita", tipo: "simnao" },
      { chave: "material_caixa", rotulo: "Material da caixa", tipo: "texto" },
      GARANTIA,
    ],
  },
  ferramenta: {
    nome: "Ferramenta manual",
    campos: [
      { chave: "material", rotulo: "Material", tipo: "texto" },
      { chave: "tamanho", rotulo: "Tamanho", tipo: "texto" },
      { chave: "material_cabo", rotulo: "Material do cabo", tipo: "texto" },
      GARANTIA,
    ],
  },
  tinta: {
    nome: "Tinta",
    campos: [
      { chave: "rendimento_m2", rotulo: "Rendimento (por lata, 1 demão)", tipo: "numero", unidade: "m²" },
      { chave: "acabamento", rotulo: "Acabamento", tipo: "opcao", opcoes: ["Fosco", "Acetinado", "Semibrilho", "Brilhante"] },
      { chave: "lavavel", rotulo: "Lavável", tipo: "simnao" },
      { chave: "linha", rotulo: "Linha", tipo: "opcao", opcoes: ["Econômica", "Standard", "Premium"] },
    ],
  },
  piso: {
    nome: "Piso e revestimento",
    campos: [
      { chave: "pei", rotulo: "PEI (resistência ao desgaste)", tipo: "opcao", opcoes: ["PEI 1", "PEI 2", "PEI 3", "PEI 4", "PEI 5", "Não se aplica"] },
      { chave: "dimensoes", rotulo: "Dimensões", tipo: "texto" },
      { chave: "retificado", rotulo: "Retificado (borda reta)", tipo: "simnao" },
      { chave: "uso", rotulo: "Uso", tipo: "opcao", opcoes: ["Interno", "Externo", "Interno e externo"] },
    ],
  },
  metais: {
    nome: "Torneira e registro",
    campos: [
      { chave: "material", rotulo: "Material", tipo: "opcao", opcoes: ["Latão", "Bronze", "Metal cromado", "PVC", "Plástico ABS"] },
      { chave: "bitola", rotulo: "Bitola", tipo: "texto" },
      GARANTIA,
    ],
  },
  eletrico: {
    nome: "Disjuntor e tomada",
    campos: [
      { chave: "inmetro", rotulo: "Certificação Inmetro", tipo: "simnao" },
      { chave: "corrente", rotulo: "Corrente", tipo: "numero", unidade: "A" },
      GARANTIA,
    ],
  },
  generico: {
    nome: "Outro produto de marca (só marca e modelo)",
    campos: [GARANTIA],
  },
} as const satisfies Record<string, ModeloCaracteristicas>;

export type ChaveModelo = keyof typeof MODELOS_CARACTERISTICAS;

export function modeloDe(chave: string | null | undefined): ModeloCaracteristicas | null {
  return chave && chave in MODELOS_CARACTERISTICAS ? MODELOS_CARACTERISTICAS[chave as ChaveModelo] : null;
}

/** Texto mostrado quando a característica não foi preenchida (não impede a comparação) */
export const NAO_INFORMADO = "Não informado";

/** De 2 a 3 produtos na comparação lado a lado */
export const COMPARAR_MIN = 2;
export const COMPARAR_MAX = 3;
