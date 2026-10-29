// =============================================================================
// Listas fixas usadas em todo o sistema.
// Para adicionar uma região ou categoria, basta incluir aqui.
// =============================================================================

/**
 * As 35 regiões administrativas oficiais do DF, na ordem oficial (I a XXXV).
 * Fonte: GDF. São 35 desde dez/2022, com a criação de Arapoanga e Água Quente.
 * Asa Norte, Asa Sul e Noroeste ficam dentro do "Plano Piloto" (RA I).
 */
export const REGIOES_DF = [
  "Plano Piloto", // I
  "Gama", // II
  "Taguatinga", // III
  "Brazlândia", // IV
  "Sobradinho", // V
  "Planaltina", // VI
  "Paranoá", // VII
  "Núcleo Bandeirante", // VIII
  "Ceilândia", // IX
  "Guará", // X
  "Cruzeiro", // XI
  "Samambaia", // XII
  "Santa Maria", // XIII
  "São Sebastião", // XIV
  "Recanto das Emas", // XV
  "Lago Sul", // XVI
  "Riacho Fundo", // XVII
  "Lago Norte", // XVIII
  "Candangolândia", // XIX
  "Águas Claras", // XX
  "Riacho Fundo II", // XXI
  "Sudoeste/Octogonal", // XXII
  "Varjão", // XXIII
  "Park Way", // XXIV
  "SCIA/Estrutural", // XXV
  "Sobradinho II", // XXVI
  "Jardim Botânico", // XXVII
  "Itapoã", // XXVIII
  "SIA", // XXIX
  "Vicente Pires", // XXX
  "Fercal", // XXXI
  "Sol Nascente/Pôr do Sol", // XXXII
  "Arniqueira", // XXXIII
  "Arapoanga", // XXXIV
  "Água Quente", // XXXV
] as const;

/** Principais cidades do Entorno (Goiás), atendidas por lojas da região */
export const REGIOES_ENTORNO = [
  "Águas Lindas de Goiás",
  "Alexânia",
  "Cidade Ocidental",
  "Cocalzinho de Goiás",
  "Cristalina",
  "Formosa",
  "Luziânia",
  "Novo Gama",
  "Padre Bernardo",
  "Planaltina de Goiás",
  "Santo Antônio do Descoberto",
  "Valparaíso de Goiás",
] as const;

/** Todas as regiões aceitas no cadastro de lojas */
export const REGIOES = [...REGIOES_DF, ...REGIOES_ENTORNO] as const;
export type Regiao = (typeof REGIOES)[number];

/** Opções "Todo o DF" e "Todo o Entorno" do filtro da busca */
export const GRUPOS_REGIOES = {
  DF: { nome: "DF", todas: "Todo o DF", regioes: REGIOES_DF },
  Entorno: { nome: "Entorno", todas: "Todo o Entorno", regioes: REGIOES_ENTORNO },
} as const;

/** Bairros conhecidos que ajudam a achar a região certa na lista */
export const DICA_REGIAO: Partial<Record<Regiao, string>> = {
  "Plano Piloto": "Asa Norte, Asa Sul, Noroeste",
  "Sudoeste/Octogonal": "Sudoeste, Octogonal",
  "SCIA/Estrutural": "Cidade Estrutural",
  SIA: "Setor de Indústria e Abastecimento",
};

const ordemAlfabetica = (a: string, b: string) => a.localeCompare(b, "pt-BR");
/** Regiões em ordem alfabética, separadas em DF e Entorno (para as listas de escolha) */
export const REGIOES_EM_GRUPOS = [
  { grupo: GRUPOS_REGIOES.DF, regioes: [...REGIOES_DF].sort(ordemAlfabetica) },
  { grupo: GRUPOS_REGIOES.Entorno, regioes: [...REGIOES_ENTORNO].sort(ordemAlfabetica) },
];

/** Nome mostrado na lista, com a dica de bairros quando houver */
export const rotuloRegiao = (r: string) => (DICA_REGIAO[r as Regiao] ? `${r} (${DICA_REGIAO[r as Regiao]})` : r);

/**
 * Interpreta o filtro de região da busca: "DF", "Entorno" ou o nome de uma região.
 * Devolve as regiões aceitas, ou null se o valor não for válido (= sem filtro).
 */
export function regioesDoFiltro(valor: string): { rotulo: string; regioes: readonly string[] } | null {
  const grupo = GRUPOS_REGIOES[valor as keyof typeof GRUPOS_REGIOES];
  if (grupo) return { rotulo: grupo.todas, regioes: grupo.regioes };
  const regiao = REGIOES.find((r) => r === valor);
  return regiao ? { rotulo: regiao, regioes: [regiao] } : null;
}

/** Categorias de materiais */
export const CATEGORIAS = [
  "Cimento e argamassa",
  "Areia e pedra",
  "Tijolos e blocos",
  "Aço para estrutura",
  "Ferragens, ferramentas e EPI",
  "Hidráulica",
  "Elétrica",
  "Pisos e revestimentos",
  "Tintas",
  "Madeiras",
  "Telhas e coberturas",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Unidades padronizadas usadas para comparar preços entre lojas */
export const UNIDADES_BASE = {
  kg: "kg",
  m3: "m³",
  m2: "m²",
  un: "unidade",
  m: "metro",
  l: "litro",
} as const;
export type UnidadeBase = keyof typeof UNIDADES_BASE;

/** Tipos de conta */
export const PAPEIS = {
  CPF: "Pessoa física (CPF)",
  CNPJ: "Empresa / Construtora (CNPJ)",
  LOJISTA: "Lojista",
  ADMIN: "Administrador",
} as const;
export type Papel = keyof typeof PAPEIS;

/** Situação da loja na plataforma */
export const STATUS_LOJA = {
  PENDENTE: "Aguardando aprovação",
  APROVADA: "Ativa",
  RECUSADA: "Recusada",
  SUSPENSA: "Suspensa",
} as const;
export type StatusLoja = keyof typeof STATUS_LOJA;

/** Etapas do pedido, na ordem em que acontecem */
export const STATUS_PEDIDO = {
  NOVO: "Novo",
  RECEBIDO: "Recebido",
  SEPARADO: "Separado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
} as const;
export type StatusPedido = keyof typeof STATUS_PEDIDO;

/** Motivos de cancelamento oferecidos na tela ("Outro" pede texto livre) */
export const MOTIVOS_CANCELAMENTO = {
  LOJA: ["Sem estoque", "Não entregamos nessa região", "Não conseguimos contato com o cliente", "Outro"],
  CLIENTE: ["Desisti da compra", "Encontrei mais barato", "Pedido feito por engano", "Outro"],
  ADMIN: ["Solicitação do cliente", "Solicitação da loja", "Suspeita de fraude", "Outro"],
} as const;

/**
 * Planos de anúncio no topo da busca (escolhidos pelo administrador).
 * Premium tem prioridade sobre Destaque nas vagas do topo.
 */
export const PLANOS_ANUNCIO = {
  NENHUM: "Nenhum",
  DESTAQUE: "Destaque",
  PREMIUM: "Premium",
} as const;
export type PlanoAnuncio = keyof typeof PLANOS_ANUNCIO;
export type PlanoPago = Exclude<PlanoAnuncio, "NENHUM">;

/**
 * Textos dos anúncios (Destaque e Premium).
 * Pelo Código de Defesa do Consumidor (art. 36), publicidade precisa ser
 * facilmente identificável: a palavra "Patrocinado" fica SEMPRE visível.
 */
export const DESTAQUE = {
  selo: "Oferta destaque",
  seloPremium: "Oferta premium",
  aviso: "Patrocinado",
  explicacao:
    "Esta loja paga para aparecer em destaque. O selo Melhor preço indica a oferta mais barata de verdade.",
} as const;
