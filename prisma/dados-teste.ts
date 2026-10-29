// =============================================================================
// SOLID — Dados de teste (fictícios)
// =============================================================================
// Este arquivo só tem LISTAS: materiais, lojas e usuários.
// A lógica que grava tudo no banco está em prisma/seed.ts.
//
// Preços de referência: valores médios aproximados praticados no DF em 2026.
// Cada loja aplica uma variação sobre esse valor (de 0% a 20% acima),
// calculada automaticamente no seed.ts.
// =============================================================================

// Ao mudar estas listas, aumente a versão em scripts/versao-dados-teste.mjs:
// o ambiente de teste da Vercel regrava os dados sozinho na próxima publicação.
export { CHAVE_VERSAO_DADOS_TESTE, VERSAO_DADOS_TESTE } from "../scripts/versao-dados-teste.mjs";

/** Senha de TODOS os usuários de teste */
export const SENHA_TESTE = "solid123";

// -----------------------------------------------------------------------------
// Faixas de atacado (quantidade mínima -> desconto sobre o preço normal)
// -----------------------------------------------------------------------------
type Faixa = { min: number; desconto: number };

const FAIXAS = {
  // Ex.: cimento a R$ 40 -> 50+ sacos R$ 36 -> 200+ sacos R$ 33
  sacos: [
    { min: 50, desconto: 0.1 },
    { min: 200, desconto: 0.175 },
  ],
  argamassa: [
    { min: 30, desconto: 0.08 },
    { min: 100, desconto: 0.15 },
  ],
  metroCubico: [
    { min: 5, desconto: 0.06 },
    { min: 15, desconto: 0.12 },
  ],
  milheiro: [
    { min: 5, desconto: 0.07 },
    { min: 15, desconto: 0.13 },
  ],
  blocos: [
    { min: 500, desconto: 0.08 },
    { min: 2000, desconto: 0.15 },
  ],
  barras: [
    { min: 50, desconto: 0.07 },
    { min: 200, desconto: 0.12 },
  ],
} satisfies Record<string, Faixa[]>;

// -----------------------------------------------------------------------------
// Catálogo de materiais
// -----------------------------------------------------------------------------
export type MaterialTeste = {
  /** Código fixo (usado também pela calculadora de obra) */
  id: string;
  nome: string;
  categoria: string;
  unidadeBase: "kg" | "m3" | "m2" | "un" | "m" | "l";
  palavrasChave?: string;
  /** Embalagem vendida e quanto da unidade base ela contém */
  embalagem: string;
  quantidadeBase: number;
  /** Preço de referência de 1 embalagem, em reais */
  precoReferencia: number;
  faixas?: Faixa[];
  /** Faixas de atacado liberadas também para CPF (padrão: só CNPJ) */
  faixasParaCpf?: boolean;
  /** Marcas sorteadas entre as lojas (se não houver, usa as da categoria) */
  marcas?: string[];
  /**
   * Produto de MARCA: as ofertas usam os itens do catálogo central (PRODUTOS_DE_MARCA)
   * e estas são as características comparadas (src/config/caracteristicas.ts).
   */
  caracteristicas?: "martelo" | "trena" | "ferramenta" | "tinta" | "piso" | "metais" | "eletrico";
};

export const MATERIAIS: MaterialTeste[] = [
  // --- Cimento e argamassa ---
  { id: "cimento-cp2", nome: "Cimento CP II-E 32", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "cp2 cp ii portland cimento comum", embalagem: "Saco 50 kg", quantidadeBase: 50, precoReferencia: 38.9, faixas: FAIXAS.sacos },
  { id: "cimento-cp3", nome: "Cimento CP III 40 RS", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "cp3 cp iii portland resistente sulfato", embalagem: "Saco 50 kg", quantidadeBase: 50, precoReferencia: 37.5, faixas: FAIXAS.sacos },
  { id: "cimento-cp5", nome: "Cimento CP V ARI", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "cp5 cp v alta resistencia inicial", embalagem: "Saco 40 kg", quantidadeBase: 40, precoReferencia: 39.9, faixas: FAIXAS.sacos },
  { id: "argamassa-ac1", nome: "Argamassa colante AC-I", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "ac1 ac-i cola piso interno", embalagem: "Saco 20 kg", quantidadeBase: 20, precoReferencia: 13.9, faixas: FAIXAS.argamassa, faixasParaCpf: true },
  { id: "argamassa-ac3", nome: "Argamassa colante AC-III", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "ac3 ac-iii porcelanato externo", embalagem: "Saco 20 kg", quantidadeBase: 20, precoReferencia: 36.9, faixas: FAIXAS.argamassa },
  { id: "argamassa-assentamento", nome: "Argamassa para assentamento de alvenaria", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "argamassa pronta tijolo bloco", embalagem: "Saco 20 kg", quantidadeBase: 20, precoReferencia: 12.9, faixas: FAIXAS.argamassa },
  { id: "cal-ch3", nome: "Cal hidratada CH-III", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "cal reboco", embalagem: "Saco 20 kg", quantidadeBase: 20, precoReferencia: 16.9, faixas: FAIXAS.argamassa },
  { id: "rejunte", nome: "Rejunte flexível cinza", categoria: "Cimento e argamassa", unidadeBase: "kg", palavrasChave: "rejunte piso azulejo", embalagem: "Pacote 1 kg", quantidadeBase: 1, precoReferencia: 8.9 },

  // --- Areia e pedra ---
  { id: "areia-media", nome: "Areia média lavada", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "areia media lavada", embalagem: "m³", quantidadeBase: 1, precoReferencia: 140, faixas: FAIXAS.metroCubico },
  { id: "areia-fina", nome: "Areia fina", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "areia fina reboco", embalagem: "m³", quantidadeBase: 1, precoReferencia: 135, faixas: FAIXAS.metroCubico },
  { id: "areia-grossa", nome: "Areia grossa", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "areia grossa concreto", embalagem: "m³", quantidadeBase: 1, precoReferencia: 145, faixas: FAIXAS.metroCubico },
  { id: "brita-1", nome: "Brita 1", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "brita pedra 1 concreto", embalagem: "m³", quantidadeBase: 1, precoReferencia: 155, faixas: FAIXAS.metroCubico },
  { id: "brita-0", nome: "Brita 0 (pedrisco)", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "brita pedrisco pedra 0", embalagem: "m³", quantidadeBase: 1, precoReferencia: 160, faixas: FAIXAS.metroCubico },
  { id: "po-de-brita", nome: "Pó de brita", categoria: "Areia e pedra", unidadeBase: "m3", palavrasChave: "po de pedra brita", embalagem: "m³", quantidadeBase: 1, precoReferencia: 95 },

  // --- Tijolos e blocos ---
  { id: "tijolo-8-furos", nome: "Tijolo cerâmico 8 furos 9x19x19 cm", categoria: "Tijolos e blocos", unidadeBase: "un", palavrasChave: "tijolo baiano 8 furos ceramico", embalagem: "Milheiro", quantidadeBase: 1000, precoReferencia: 850, faixas: FAIXAS.milheiro },
  { id: "tijolo-6-furos", nome: "Tijolo cerâmico 6 furos 9x14x19 cm", categoria: "Tijolos e blocos", unidadeBase: "un", palavrasChave: "tijolo baiano 6 furos ceramico", embalagem: "Milheiro", quantidadeBase: 1000, precoReferencia: 700, faixas: FAIXAS.milheiro },
  { id: "tijolo-macico", nome: "Tijolo maciço comum", categoria: "Tijolos e blocos", unidadeBase: "un", palavrasChave: "tijolo macico caipira", embalagem: "Milheiro", quantidadeBase: 1000, precoReferencia: 920, faixas: FAIXAS.milheiro },
  { id: "bloco-concreto-14", nome: "Bloco de concreto 14x19x39 cm", categoria: "Tijolos e blocos", unidadeBase: "un", palavrasChave: "bloco concreto estrutural 14", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 4.2, faixas: FAIXAS.blocos, faixasParaCpf: true },
  { id: "bloco-concreto-9", nome: "Bloco de concreto 9x19x39 cm", categoria: "Tijolos e blocos", unidadeBase: "un", palavrasChave: "bloco concreto vedacao 9", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 3.3, faixas: FAIXAS.blocos },

  // --- Aço para estrutura ---
  { id: "vergalhao-10mm", nome: 'Vergalhão CA-50 3/8" (10 mm)', categoria: "Aço para estrutura", unidadeBase: "m", palavrasChave: "vergalhao ferro 3/8 10mm ca50", embalagem: "Barra 12 m", quantidadeBase: 12, precoReferencia: 52, faixas: FAIXAS.barras },
  { id: "vergalhao-8mm", nome: 'Vergalhão CA-50 5/16" (8 mm)', categoria: "Aço para estrutura", unidadeBase: "m", palavrasChave: "vergalhao ferro 5/16 8mm ca50", embalagem: "Barra 12 m", quantidadeBase: 12, precoReferencia: 36, faixas: FAIXAS.barras },
  { id: "vergalhao-4-2mm", nome: "Vergalhão CA-60 4,2 mm", categoria: "Aço para estrutura", unidadeBase: "m", palavrasChave: "vergalhao ferro 4.2 estribo ca60", embalagem: "Barra 12 m", quantidadeBase: 12, precoReferencia: 13.5, faixas: FAIXAS.barras },
  { id: "malha-pop", nome: "Tela soldada POP 15x15 cm 4,2 mm (2x3 m)", categoria: "Aço para estrutura", unidadeBase: "un", palavrasChave: "malha pop tela soldada contrapiso", embalagem: "Painel 2x3 m", quantidadeBase: 1, precoReferencia: 68 },

  // --- Ferragens, ferramentas e EPI ---
  // Itens padronizados: comparados por kg, metro ou unidade, como os demais materiais.
  { id: "prego-18x27", nome: "Prego com cabeça 18x27", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "kg", palavrasChave: "prego pregos ferragem", embalagem: "Pacote 1 kg", quantidadeBase: 1, precoReferencia: 20.9, marcas: ["Gerdau", "Belgo"] },
  { id: "prego-17x21", nome: "Prego com cabeça 17x21", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "kg", palavrasChave: "prego pregos ferragem forma", embalagem: "Pacote 1 kg", quantidadeBase: 1, precoReferencia: 22.9, marcas: ["Gerdau", "Belgo"] },
  { id: "arame-recozido", nome: "Arame recozido nº 18", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "kg", palavrasChave: "arame amarrar ferro", embalagem: "Rolo 1 kg", quantidadeBase: 1, precoReferencia: 21.9, marcas: ["Belgo", "Gerdau", "Morlan"] },
  { id: "arame-galvanizado-14", nome: "Arame galvanizado nº 14 (2,1 mm)", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "kg", palavrasChave: "arame cerca varal galvanizado", embalagem: "Rolo 1 kg", quantidadeBase: 1, precoReferencia: 34.9, marcas: ["Belgo", "Gerdau", "Morlan"] },
  { id: "parafuso-madeira", nome: "Parafuso para madeira 4,5 x 50 mm", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "parafuso parafusos madeira cabeca chata philips", embalagem: "Caixa 100 un", quantidadeBase: 100, precoReferencia: 32.9, marcas: ["Ciser", "Vonder", "Belenus"] },
  { id: "porca-sextavada", nome: 'Porca sextavada 3/8" zincada', categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "porca porcas sextavada zincada", embalagem: "Caixa 100 un", quantidadeBase: 100, precoReferencia: 27.9, marcas: ["Ciser", "Belenus"] },
  { id: "fita-isolante", nome: "Fita isolante 19 mm", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "m", palavrasChave: "fita isolante eletrica", embalagem: "Rolo 20 m", quantidadeBase: 20, precoReferencia: 9.9, marcas: ["3M", "Tigre", "Foxlux"] },
  { id: "disco-corte-ferro", nome: 'Disco de corte para ferro 4.1/2" (115 mm)', categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "disco corte ferro metal esmerilhadeira lixadeira", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 6.9, marcas: ["Norton", "Bosch", "Vonder"] },
  { id: "disco-diamantado", nome: "Disco diamantado segmentado 110 mm", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "disco serra marmore corte piso concreto diamantado", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 29.9, marcas: ["Norton", "Bosch", "Vonder"] },
  { id: "luva-nitrilica", nome: "Luva de proteção nitrílica", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "luva luvas protecao epi nitrilica pedreiro", embalagem: "Par", quantidadeBase: 1, precoReferencia: 9.9, marcas: ["Danny", "Volk", "Kalipso"] },
  { id: "luva-raspa", nome: "Luva de raspa de couro", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "luva luvas protecao epi couro raspa", embalagem: "Par", quantidadeBase: 1, precoReferencia: 14.9, marcas: ["Danny", "Volk", "Kalipso"] },
  { id: "oculos-protecao", nome: "Óculos de proteção incolor", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "oculos protecao epi seguranca", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 12.9, marcas: ["3M", "Kalipso", "Danny"] },
  { id: "capacete-seguranca", nome: "Capacete de segurança com jugular", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "capacete protecao epi seguranca obra", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 29.9, marcas: ["3M", "Plastcor", "MSA"] },
  // Ferramentas de marca: um material "genérico" e a marca bem visível em cada oferta.
  { id: "martelo-unha", nome: "Martelo de unha 27 mm", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "martelo ferramenta", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 49.9, caracteristicas: "martelo" },
  { id: "trena-5m", nome: "Trena 5 m", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "trena fita metrica medir ferramenta", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 29.9, caracteristicas: "trena" },
  { id: "nivel-aluminio", nome: 'Nível de alumínio 12" (30 cm)', categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "nivel bolha prumo ferramenta", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 39.9, caracteristicas: "ferramenta" },
  { id: "colher-pedreiro", nome: 'Colher de pedreiro 8"', categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "colher pedreiro ferramenta", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 24.9, caracteristicas: "ferramenta" },
  { id: "desempenadeira-aco", nome: "Desempenadeira de aço lisa", categoria: "Ferragens, ferramentas e EPI", unidadeBase: "un", palavrasChave: "desempenadeira desempenar reboco ferramenta", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 34.9, caracteristicas: "ferramenta" },

  // --- Hidráulica ---
  { id: "tubo-pvc-25", nome: "Tubo PVC soldável 25 mm", categoria: "Hidráulica", unidadeBase: "m", palavrasChave: "cano agua fria 25mm 3/4", embalagem: "Barra 6 m", quantidadeBase: 6, precoReferencia: 24.9 },
  { id: "tubo-esgoto-100", nome: "Tubo PVC esgoto 100 mm", categoria: "Hidráulica", unidadeBase: "m", palavrasChave: "cano esgoto 100mm 4", embalagem: "Barra 6 m", quantidadeBase: 6, precoReferencia: 62 },
  { id: "caixa-dagua-1000", nome: "Caixa d'água polietileno 1.000 L", categoria: "Hidráulica", unidadeBase: "l", palavrasChave: "caixa dagua reservatorio 1000 litros", embalagem: "Unidade (1.000 L)", quantidadeBase: 1000, precoReferencia: 519 },
  { id: "registro-gaveta", nome: 'Registro de gaveta 3/4" bruto', categoria: "Hidráulica", unidadeBase: "un", palavrasChave: "registro gaveta 3/4", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 44.9, caracteristicas: "metais" },

  // --- Elétrica ---
  { id: "cabo-2-5", nome: "Cabo flexível 2,5 mm² 750 V", categoria: "Elétrica", unidadeBase: "m", palavrasChave: "fio cabo 2.5 tomada", embalagem: "Rolo 100 m", quantidadeBase: 100, precoReferencia: 229 },
  { id: "cabo-4", nome: "Cabo flexível 4 mm² 750 V", categoria: "Elétrica", unidadeBase: "m", palavrasChave: "fio cabo 4mm chuveiro", embalagem: "Rolo 100 m", quantidadeBase: 100, precoReferencia: 365 },
  { id: "eletroduto-3-4", nome: 'Eletroduto corrugado 3/4"', categoria: "Elétrica", unidadeBase: "m", palavrasChave: "conduite mangueira eletroduto", embalagem: "Rolo 50 m", quantidadeBase: 50, precoReferencia: 64.9 },
  { id: "disjuntor-20a", nome: "Disjuntor monopolar 20 A", categoria: "Elétrica", unidadeBase: "un", palavrasChave: "disjuntor din 20a", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 15.9, caracteristicas: "eletrico" },

  // --- Pisos e revestimentos ---
  { id: "piso-ceramico-60", nome: "Piso cerâmico 60x60 cm", categoria: "Pisos e revestimentos", unidadeBase: "m2", palavrasChave: "piso ceramica 60x60", embalagem: "Caixa 2,5 m²", quantidadeBase: 2.5, precoReferencia: 99.75, caracteristicas: "piso" },
  { id: "porcelanato-60", nome: "Porcelanato 60x60 cm", categoria: "Pisos e revestimentos", unidadeBase: "m2", palavrasChave: "porcelanato 60x60 piso polido acetinado", embalagem: "Caixa 1,44 m²", quantidadeBase: 1.44, precoReferencia: 86.3, caracteristicas: "piso" },
  { id: "revestimento-parede", nome: "Revestimento de parede 32x57 cm", categoria: "Pisos e revestimentos", unidadeBase: "m2", palavrasChave: "azulejo revestimento parede", embalagem: "Caixa 2 m²", quantidadeBase: 2, precoReferencia: 69.8 },

  // --- Tintas ---
  { id: "tinta-acrilica-18", nome: "Tinta acrílica branca 18 L", categoria: "Tintas", unidadeBase: "l", palavrasChave: "tinta parede acrilica branca fosca acetinada", embalagem: "Lata 18 L", quantidadeBase: 18, precoReferencia: 289, caracteristicas: "tinta" },
  { id: "massa-corrida", nome: "Massa corrida PVA", categoria: "Tintas", unidadeBase: "kg", palavrasChave: "massa corrida parede", embalagem: "Balde 25 kg", quantidadeBase: 25, precoReferencia: 84.9 },
  { id: "selador-acrilico", nome: "Selador acrílico", categoria: "Tintas", unidadeBase: "l", palavrasChave: "selador fundo parede", embalagem: "Lata 18 L", quantidadeBase: 18, precoReferencia: 149 },

  // --- Madeiras ---
  { id: "tabua-pinus", nome: "Tábua de pinus 30 cm x 3 m", categoria: "Madeiras", unidadeBase: "m", palavrasChave: "tabua madeira forma", embalagem: "Peça 3 m", quantidadeBase: 3, precoReferencia: 37.9 },
  { id: "sarrafo-pinus", nome: "Sarrafo de pinus 10 cm x 3 m", categoria: "Madeiras", unidadeBase: "m", palavrasChave: "sarrafo madeira", embalagem: "Peça 3 m", quantidadeBase: 3, precoReferencia: 13.9 },
  { id: "compensado-10", nome: "Compensado resinado 10 mm (1,10 x 2,20 m)", categoria: "Madeiras", unidadeBase: "un", palavrasChave: "compensado chapa madeirite forma", embalagem: "Chapa", quantidadeBase: 1, precoReferencia: 84.9 },

  // --- Telhas e coberturas ---
  { id: "telha-fibrocimento", nome: "Telha de fibrocimento 2,44 x 1,10 m 6 mm", categoria: "Telhas e coberturas", unidadeBase: "un", palavrasChave: "telha amianto eternit fibrocimento", embalagem: "Unidade", quantidadeBase: 1, precoReferencia: 61.9 },
  { id: "telha-colonial", nome: "Telha cerâmica colonial", categoria: "Telhas e coberturas", unidadeBase: "un", palavrasChave: "telha barro colonial ceramica", embalagem: "Milheiro", quantidadeBase: 1000, precoReferencia: 2600 },
];

/**
 * Embalagens alternativas, para testar a comparação por unidade padronizada.
 * Ex.: algumas lojas vendem cimento em saco de 25 kg; o site compara pelo R$/kg.
 * "acrescimo" = quanto a embalagem menor custa a mais, proporcionalmente.
 */
export const EMBALAGENS_ALTERNATIVAS = [
  { materialId: "cimento-cp2", embalagem: "Saco 25 kg", quantidadeBase: 25, acrescimo: 0.08, lojas: ["asa-norte", "guara"] },
  // Tijolo: por milheiro (padrão) ou por unidade, para quem precisa de pouco
  { materialId: "tijolo-8-furos", embalagem: "Unidade", quantidadeBase: 1, acrescimo: 0.15, lojas: ["asa-norte", "sobradinho", "taguatinga", "guara"] },
  { materialId: "tijolo-6-furos", embalagem: "Unidade", quantidadeBase: 1, acrescimo: 0.15, lojas: ["asa-norte", "ceilandia", "taguatinga"] },
  // Ferragens: caixa maior sai mais barato por unidade; fita em rolo menor sai mais caro por metro
  { materialId: "parafuso-madeira", embalagem: "Caixa 500 un", quantidadeBase: 500, acrescimo: -0.12, lojas: ["taguatinga", "ceilandia", "samambaia"] },
  { materialId: "fita-isolante", embalagem: "Rolo 10 m", quantidadeBase: 10, acrescimo: 0.1, lojas: ["asa-norte", "lago-sul", "gama"] },
  { materialId: "disco-corte-ferro", embalagem: "Caixa 10 un", quantidadeBase: 10, acrescimo: -0.15, lojas: ["taguatinga", "guara", "valparaiso"] },
  { materialId: "prego-18x27", embalagem: "Caixa 5 kg", quantidadeBase: 5, acrescimo: -0.08, lojas: ["ceilandia", "sobradinho"] },
  { materialId: "luva-nitrilica", embalagem: "Pacote 12 pares", quantidadeBase: 12, acrescimo: -0.15, lojas: ["aguas-claras", "samambaia"] },
  { materialId: "cabo-2-5", embalagem: "Metro", quantidadeBase: 1, acrescimo: 0.25, lojas: ["taguatinga", "aguas-claras", "gama"] },
];

// -----------------------------------------------------------------------------
// Lojas
// -----------------------------------------------------------------------------
export type LojaTeste = {
  id: string;
  nome: string;
  regiao: string;
  endereco: string;
  telefone: string;
  comissao: number;
  /** Plano de anúncio no topo da busca */
  plano?: "DESTAQUE" | "PREMIUM";
  status: "APROVADA" | "PENDENTE";
  /** Dono da loja (usuário lojista) */
  dono: { nome: string; email: string };
};

export const LOJAS: LojaTeste[] = [
  { id: "taguatinga", nome: "Casa do Construtor Taguatinga", regiao: "Taguatinga", endereco: "QNA 12, Lote 5 — Taguatinga Norte", telefone: "(61) 3351-2040", comissao: 3, status: "APROVADA", dono: { nome: "Carlos Mendes", email: "lojista@teste.com" } },
  { id: "ceilandia", nome: "Depósito Ceilândia Forte", regiao: "Ceilândia", endereco: "QNM 18, Conjunto A, Lote 2 — Ceilândia Sul", telefone: "(61) 3371-8822", comissao: 0, status: "APROVADA", dono: { nome: "Raimundo Alves", email: "ceilandia@teste.com" } },
  { id: "aguas-claras", nome: "Materiais Águas Claras", regiao: "Águas Claras", endereco: "Av. Araucárias, 1450 — Águas Claras", telefone: "(61) 3435-1190", comissao: 5, status: "APROVADA", dono: { nome: "Juliana Prado", email: "aguasclaras@teste.com" } },
  { id: "asa-norte", nome: "Asa Norte Materiais de Construção", regiao: "Plano Piloto", endereco: "SCLN 711, Bloco C, Loja 10 — Asa Norte", telefone: "(61) 3272-4410", comissao: 3, status: "APROVADA", dono: { nome: "Fernando Lima", email: "asanorte@teste.com" } },
  { id: "samambaia", nome: "Samambaia Depósito Popular", regiao: "Samambaia", endereco: "QR 425, Conjunto 3, Lote 1 — Samambaia Norte", telefone: "(61) 3358-6677", comissao: 0, status: "APROVADA", dono: { nome: "Antônia Souza", email: "samambaia@teste.com" } },
  { id: "gama", nome: "Gama Construções e Materiais", regiao: "Gama", endereco: "Setor Leste Industrial, Quadra 4 — Gama", telefone: "(61) 3384-2255", comissao: 5, status: "APROVADA", dono: { nome: "Paulo Ribeiro", email: "gama@teste.com" } },
  { id: "sobradinho", nome: "Sobradinho Casa & Obra", regiao: "Sobradinho", endereco: "Quadra 8, Área Especial 3 — Sobradinho", telefone: "(61) 3591-3030", comissao: 4, plano: "DESTAQUE", status: "APROVADA", dono: { nome: "Marcos Teixeira", email: "sobradinho@teste.com" } },
  { id: "guara", nome: "Guará Material de Construção", regiao: "Guará", endereco: "QE 40, Conjunto H, Lote 8 — Guará II", telefone: "(61) 3381-9090", comissao: 3, plano: "PREMIUM", status: "APROVADA", dono: { nome: "Luciana Castro", email: "guara@teste.com" } },
  { id: "lago-sul", nome: "Lago Sul Acabamentos e Construção", regiao: "Lago Sul", endereco: "SHIS QI 11, Bloco F, Loja 3 — Lago Sul", telefone: "(61) 3248-5060", comissao: 4, status: "APROVADA", dono: { nome: "Helena Vasconcelos", email: "lagosul@teste.com" } },
  { id: "valparaiso", nome: "Valparaíso Materiais de Construção", regiao: "Valparaíso de Goiás", endereco: "Av. Marginal, Quadra 12, Lote 8 — Valparaíso I", telefone: "(61) 3627-4400", comissao: 3, status: "APROVADA", dono: { nome: "Sebastião Rocha", email: "valparaiso@teste.com" } },
  // Loja que acabou de se cadastrar: aguardando aprovação no /admin
  { id: "vicente-pires", nome: "Depósito Nova Era Vicente Pires", regiao: "Vicente Pires", endereco: "Rua 4C, Chácara 22 — Vicente Pires", telefone: "(61) 3397-1515", comissao: 5, status: "PENDENTE", dono: { nome: "Rogério Nunes", email: "pendente@teste.com" } },
];

// -----------------------------------------------------------------------------
// Clientes e administrador
// -----------------------------------------------------------------------------
export const CLIENTES = [
  { nome: "Ana Beatriz Oliveira", email: "cpf@teste.com", papel: "CPF" as const, telefone: "(61) 99812-3344" },
  { nome: "Construtora Planalto Ltda.", email: "cnpj@teste.com", papel: "CNPJ" as const, telefone: "(61) 3326-7788" },
  { nome: "Administrador Solid", email: "admin@teste.com", papel: "ADMIN" as const, telefone: null },
];

// -----------------------------------------------------------------------------
// Pedidos de exemplo (para testar o painel do lojista e o do administrador)
// -----------------------------------------------------------------------------
export type PedidoExemplo = {
  cliente: string;
  diasAtras: number;
  lojas: { loja: string; status: "NOVO" | "RECEBIDO" | "SEPARADO" | "ENTREGUE"; itens: [materialId: string, quantidade: number][] }[];
};

export const PEDIDOS_EXEMPLO: PedidoExemplo[] = [
  { cliente: "cnpj@teste.com", diasAtras: 0, lojas: [{ loja: "taguatinga", status: "NOVO", itens: [["cimento-cp2", 60], ["areia-media", 4]] }] },
  { cliente: "cpf@teste.com", diasAtras: 1, lojas: [{ loja: "taguatinga", status: "NOVO", itens: [["tijolo-8-furos", 2], ["argamassa-ac1", 10]] }] },
  {
    cliente: "cnpj@teste.com",
    diasAtras: 5,
    lojas: [
      { loja: "taguatinga", status: "SEPARADO", itens: [["vergalhao-10mm", 60]] },
      { loja: "ceilandia", status: "ENTREGUE", itens: [["brita-1", 6], ["cimento-cp3", 40]] },
    ],
  },
  {
    cliente: "cpf@teste.com",
    diasAtras: 12,
    lojas: [
      { loja: "aguas-claras", status: "ENTREGUE", itens: [["tinta-acrilica-18", 3]] },
      { loja: "gama", status: "RECEBIDO", itens: [["areia-fina", 2]] },
    ],
  },
];

// -----------------------------------------------------------------------------
// Catálogo central de produtos de MARCA (cadastrado pelo administrador)
// -----------------------------------------------------------------------------
// Marcas e modelos FICTÍCIOS, de propósito: as características abaixo são
// inventadas para teste e não podem ser atribuídas a produtos reais.
// Códigos de barras começam com 200 (faixa reservada para uso interno pelo
// padrão GS1), para nunca coincidirem com produtos de verdade.
// "foto": gera uma foto de teste (os demais usam a ilustração da categoria).
// -----------------------------------------------------------------------------
export type ProdutoDeMarcaTeste = {
  materialId: string;
  marca: string;
  modelo: string;
  /** Preço de referência, em reais */
  preco: number;
  caracteristicas: Record<string, string | number | boolean>;
  foto?: boolean;
  /** Cor principal da foto de teste */
  cor?: string;
};

export const PRODUTOS_DE_MARCA: ProdutoDeMarcaTeste[] = [
  // Martelo de unha 27 mm
  { materialId: "martelo-unha", marca: "Forja Cerrado", modelo: "MU-27 cabo de madeira", preco: 39.9, foto: true, cor: "#b45309", caracteristicas: { peso_cabeca: 450, material_cabo: "Madeira", comprimento: 330, garantia_meses: 6 } },
  { materialId: "martelo-unha", marca: "Aço Candango", modelo: "Pro 27 fibra", preco: 54.9, foto: true, cor: "#ea580c", caracteristicas: { peso_cabeca: 500, material_cabo: "Fibra de vidro", comprimento: 330, garantia_meses: 12 } },
  { materialId: "martelo-unha", marca: "Ferramentas Ipê", modelo: "Unha 27 aço", preco: 69.9, caracteristicas: { peso_cabeca: 560, material_cabo: "Aço com empunhadura emborrachada", comprimento: 325, garantia_meses: 24 } },
  { materialId: "martelo-unha", marca: "Planalto Tools", modelo: "MU27", preco: 44.9, caracteristicas: { peso_cabeca: 480 } },
  // Trena 5 m
  { materialId: "trena-5m", marca: "Medida Certa", modelo: "TR5 compacta", preco: 24.9, foto: true, cor: "#facc15", caracteristicas: { comprimento_fita: 5, largura_fita: 19, trava: true, material_caixa: "Plástico ABS", garantia_meses: 3 } },
  { materialId: "trena-5m", marca: "Aço Candango", modelo: "Trena 5 m emborrachada", preco: 36.9, caracteristicas: { comprimento_fita: 5, largura_fita: 25, trava: true, material_caixa: "Plástico com borracha", garantia_meses: 12 } },
  { materialId: "trena-5m", marca: "Planalto Tools", modelo: "PT-5", preco: 19.9, caracteristicas: { comprimento_fita: 5, largura_fita: 16, trava: false } },
  // Nível de alumínio 30 cm
  { materialId: "nivel-aluminio", marca: "Forja Cerrado", modelo: "Nível 12 pol.", preco: 34.9, foto: true, cor: "#64748b", caracteristicas: { material: "Alumínio", tamanho: "30 cm", garantia_meses: 6 } },
  { materialId: "nivel-aluminio", marca: "Medida Certa", modelo: "NV30 magnético", preco: 49.9, caracteristicas: { material: "Alumínio com base magnética", tamanho: "30 cm", garantia_meses: 12 } },
  { materialId: "nivel-aluminio", marca: "Ferramentas Ipê", modelo: "Nível 30", preco: 29.9, caracteristicas: { material: "Alumínio", tamanho: "30 cm" } },
  // Colher de pedreiro 8"
  { materialId: "colher-pedreiro", marca: "Forja Cerrado", modelo: "Colher 8 pol. madeira", preco: 22.9, foto: true, cor: "#a16207", caracteristicas: { material: "Aço carbono", tamanho: '8"', material_cabo: "Madeira", garantia_meses: 6 } },
  { materialId: "colher-pedreiro", marca: "Aço Candango", modelo: "Colher 8 pol. Pro", preco: 32.9, caracteristicas: { material: "Aço carbono temperado", tamanho: '8"', material_cabo: "Plástico emborrachado", garantia_meses: 12 } },
  { materialId: "colher-pedreiro", marca: "Ferramentas Ipê", modelo: "CP8", preco: 19.9, caracteristicas: { tamanho: '8"' } },
  // Desempenadeira de aço lisa
  { materialId: "desempenadeira-aco", marca: "Forja Cerrado", modelo: "Lisa 12 x 24 cm", preco: 29.9, foto: true, cor: "#475569", caracteristicas: { material: "Aço", tamanho: "12 x 24 cm", material_cabo: "Madeira", garantia_meses: 6 } },
  { materialId: "desempenadeira-aco", marca: "Aço Candango", modelo: "Lisa Pro 12 x 28 cm", preco: 42.9, caracteristicas: { material: "Aço inox", tamanho: "12 x 28 cm", material_cabo: "Plástico emborrachado", garantia_meses: 12 } },
  { materialId: "desempenadeira-aco", marca: "Planalto Tools", modelo: "DL-24", preco: 26.9, caracteristicas: { material: "Aço", tamanho: "12 x 24 cm" } },
  // Tinta acrílica branca 18 L
  { materialId: "tinta-acrilica-18", marca: "Cores do Cerrado", modelo: "Acrílica Econômica fosca", preco: 189, foto: true, cor: "#16a34a", caracteristicas: { rendimento_m2: 200, acabamento: "Fosco", lavavel: false, linha: "Econômica" } },
  { materialId: "tinta-acrilica-18", marca: "Tintas Ipê", modelo: "Acrílica Standard fosca", preco: 259, foto: true, cor: "#7c3aed", caracteristicas: { rendimento_m2: 275, acabamento: "Fosco", lavavel: true, linha: "Standard" } },
  { materialId: "tinta-acrilica-18", marca: "Pinta Brasília", modelo: "Acrílica Premium fosca", preco: 349, foto: true, cor: "#2563eb", caracteristicas: { rendimento_m2: 380, acabamento: "Fosco", lavavel: true, linha: "Premium" } },
  { materialId: "tinta-acrilica-18", marca: "Cores do Cerrado", modelo: "Acrílica Premium acetinada", preco: 369, caracteristicas: { rendimento_m2: 360, acabamento: "Acetinado", lavavel: true, linha: "Premium" } },
  // Piso cerâmico 60x60
  { materialId: "piso-ceramico-60", marca: "Cerâmica Alvorada", modelo: "Granito Cinza", preco: 89.75, foto: true, cor: "#94a3b8", caracteristicas: { pei: "PEI 4", dimensoes: "60 x 60 cm", retificado: false, uso: "Interno" } },
  { materialId: "piso-ceramico-60", marca: "Revest Paranoá", modelo: "Madeira Clara", preco: 109.5, foto: true, cor: "#d6a467", caracteristicas: { pei: "PEI 4", dimensoes: "60 x 60 cm", retificado: true, uso: "Interno" } },
  { materialId: "piso-ceramico-60", marca: "Cerâmica Goiás", modelo: "Bege Rústico", preco: 99, caracteristicas: { pei: "PEI 5", dimensoes: "60 x 60 cm", retificado: false, uso: "Interno e externo" } },
  // Porcelanato 60x60
  { materialId: "porcelanato-60", marca: "Porcelanatos Lago Norte", modelo: "Polido Branco", preco: 86.3, foto: true, cor: "#e2e8f0", caracteristicas: { pei: "Não se aplica", dimensoes: "60 x 60 cm", retificado: true, uso: "Interno" } },
  { materialId: "porcelanato-60", marca: "Revest Paranoá", modelo: "Acetinado Cimento", preco: 99.9, caracteristicas: { pei: "PEI 4", dimensoes: "60 x 60 cm", retificado: true, uso: "Interno e externo" } },
  { materialId: "porcelanato-60", marca: "Cerâmica Alvorada", modelo: "Polido Marfim", preco: 79.9, caracteristicas: { dimensoes: "60 x 60 cm", retificado: true, uso: "Interno" } },
  // Registro de gaveta 3/4" bruto
  { materialId: "registro-gaveta", marca: "Hidro Lago", modelo: "RG 3/4 bruto", preco: 39.9, foto: true, cor: "#ca8a04", caracteristicas: { material: "Latão", bitola: '3/4"', garantia_meses: 60 } },
  { materialId: "registro-gaveta", marca: "Metais Candango", modelo: "Registro gaveta 3/4", preco: 52.9, caracteristicas: { material: "Bronze", bitola: '3/4"', garantia_meses: 120 } },
  { materialId: "registro-gaveta", marca: "Planalto Metais", modelo: "RG34 econômico", preco: 29.9, caracteristicas: { material: "Latão", bitola: '3/4"' } },
  // Disjuntor monopolar 20 A
  { materialId: "disjuntor-20a", marca: "Eletro Vale", modelo: "DIN 20 A curva C", preco: 14.9, foto: true, cor: "#1e293b", caracteristicas: { inmetro: true, corrente: 20, garantia_meses: 12 } },
  { materialId: "disjuntor-20a", marca: "Proteção Total", modelo: "Mini disjuntor 20 A", preco: 19.9, caracteristicas: { inmetro: true, corrente: 20, garantia_meses: 60 } },
  { materialId: "disjuntor-20a", marca: "Luz do Cerrado", modelo: "DJ20", preco: 11.9, caracteristicas: { corrente: 20 } },
];

