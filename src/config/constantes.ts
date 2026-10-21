// =============================================================================
// Listas fixas usadas em todo o sistema.
// Para adicionar uma região ou categoria, basta incluir aqui.
// =============================================================================

/** Regiões administrativas do DF atendidas no MVP */
export const REGIOES = [
  "Asa Norte",
  "Asa Sul",
  "Taguatinga",
  "Ceilândia",
  "Águas Claras",
  "Samambaia",
  "Gama",
  "Sobradinho",
  "Guará",
  "Vicente Pires",
] as const;
export type Regiao = (typeof REGIOES)[number];

/** Categorias de materiais */
export const CATEGORIAS = [
  "Cimento e argamassa",
  "Areia e pedra",
  "Tijolos e blocos",
  "Ferragens e aço",
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
 * Textos da loja em destaque (anúncio pago).
 * Pelo Código de Defesa do Consumidor (art. 36), publicidade precisa ser
 * facilmente identificável: a palavra "Patrocinado" fica SEMPRE visível.
 */
export const DESTAQUE = {
  selo: "Oferta destaque",
  aviso: "Patrocinado",
  explicacao:
    "Esta loja paga para aparecer em destaque. O selo Melhor preço indica a oferta mais barata de verdade.",
} as const;
