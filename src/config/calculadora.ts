// =============================================================================
// SOLID — COEFICIENTES DA CALCULADORA DE OBRA
// =============================================================================
//
// >>> ARQUIVO PARA REVISÃO DO ENGENHEIRO CIVIL <<<
//
// Aqui estão TODOS os números usados pela calculadora. Para ajustar um
// coeficiente, basta mudar o número; nenhuma outra parte do sistema precisa
// ser alterada. Depois de revisar, preencha o bloco REVISAO logo abaixo.
//
// Como ler cada material:
//   coeficiente  = quanto do material vai em 1 m² (ou 1 m³) do serviço,
//                  na unidade em que o produto é comparado no site:
//                  tijolo/bloco/painel = unidades; cimento/cal/argamassa = kg;
//                  areia/brita = m³; piso = m².
//   fonte        = de onde veio o número. ATENÇÃO: os valores atuais são
//                  REFERÊNCIAS DE PRÁTICA DE MERCADO ainda NÃO conferidos com
//                  a tabela SINAPI vigente. O campo "conferir" indica onde
//                  checar.
//
// Fórmula aplicada a todos os materiais:
//   quantidade = medida do serviço × coeficiente × (1 + perda)
// e depois arredondada PARA CIMA no formato vendido pela loja
// (sacos inteiros, múltiplos de 0,5 m³, unidades ou milheiros).
// =============================================================================

/** Registro da revisão técnica (preencher após revisar) */
export const REVISAO = {
  revisadoPor: null as string | null, // ex.: "Eng. Fulano de Tal — CREA-DF 12345/D"
  data: null as string | null, // ex.: "2026-11-05"
  observacoes: "Coeficientes iniciais de referência, aguardando revisão técnica.",
};

/** Margem de perda padrão aplicada a todos os materiais (10%) */
export const PERDA_PADRAO = 0.1;

export const AVISO_ESTIMATIVA =
  "Estimativa para referência. Confirme as quantidades com um profissional responsável pela obra.";

// -----------------------------------------------------------------------------
// Tipos (estrutura dos dados abaixo)
// -----------------------------------------------------------------------------

/** Campo que o cliente preenche */
export type CampoServico = {
  id: string;
  rotulo: string;
  unidade: "m" | "m²" | "cm";
  padrao?: number;
  min: number;
  max: number;
  ajuda?: string;
};

/**
 * Como a medida do serviço é calculada a partir dos campos:
 * - "comprimento_x_altura": área (m²) = comprimento × altura
 * - "area":                 área (m²) informada diretamente
 * - "area_x_espessura":     volume (m³) = área × espessura (em cm ÷ 100)
 */
export type TipoMedida = "comprimento_x_altura" | "area" | "area_x_espessura";

export type MaterialServico = {
  /** Código do produto no catálogo (ver prisma/dados-teste.ts) */
  produtoId: string;
  /** Nome curto usado na explicação do cálculo */
  nome: string;
  coeficiente: number;
  /** Como o número aparece para o cliente: ex. "tijolos", "kg", "m³" */
  unidadeTexto: string;
  fonte: string;
  conferir?: string;
  /** Usar só quando a opção escolhida tiver este valor (ex.: tipo de piso) */
  somenteSe?: { opcao: string; valor: string };
};

export type Servico = {
  id: string;
  nome: string;
  descricao: string;
  medida: TipoMedida;
  campos: CampoServico[];
  opcao?: { id: string; rotulo: string; valores: { valor: string; rotulo: string }[] };
  /** Se ausente, usa PERDA_PADRAO */
  perda?: number;
  materiais: MaterialServico[];
  /** Observação técnica mostrada ao cliente junto com o resultado */
  observacao?: string;
};

// -----------------------------------------------------------------------------
// Traços de argamassa e concreto usados abaixo
// -----------------------------------------------------------------------------
// Argamassa mista 1:2:8 (cimento : cal : areia, em volume), consumo por m³:
//   cimento 160 kg · cal hidratada 150 kg · areia 1,10 m³
//   Fonte: prática de mercado para assentamento e reboco.
//   Conferir: TCPO / composições auxiliares de argamassa do SINAPI (traço 1:2:8).
const ARGAMASSA_1_2_8 = { cimentoKg: 160, calKg: 150, areiaM3: 1.1 };

// Consumo de argamassa no assentamento de tijolo cerâmico 9×19×19 cm
// (parede de 9 cm, juntas de 1 cm): 0,012 m³ por m² de parede.
//   Fonte: prática de mercado. Conferir: SINAPI, alvenaria de vedação com bloco
//   cerâmico furado 9×19×19 cm (consumo de argamassa da composição).
const ARGAMASSA_POR_M2_DE_MURO = 0.012;

// -----------------------------------------------------------------------------
// SERVIÇOS
// -----------------------------------------------------------------------------
export const SERVICOS: Servico[] = [
  {
    id: "muro",
    nome: "Muro de alvenaria",
    descricao: "Parede de tijolo cerâmico 8 furos (9×19×19 cm), assentado com argamassa de cimento, cal e areia.",
    medida: "comprimento_x_altura",
    campos: [
      { id: "comprimento", rotulo: "Comprimento", unidade: "m", min: 0.1, max: 1000 },
      { id: "altura", rotulo: "Altura", unidade: "m", padrao: 2, min: 0.1, max: 10 },
    ],
    materiais: [
      {
        produtoId: "tijolo-8-furos",
        nome: "Tijolo 8 furos",
        coeficiente: 25,
        unidadeTexto: "tijolos",
        fonte:
          "Cálculo geométrico: face de 19×19 cm + junta de 1 cm = 20×20 cm = 0,04 m² por tijolo → 25 tijolos/m².",
        conferir: "SINAPI — alvenaria de vedação com bloco cerâmico furado 9×19×19 cm.",
      },
      {
        produtoId: "cimento-cp2",
        nome: "Cimento",
        coeficiente: ARGAMASSA_POR_M2_DE_MURO * ARGAMASSA_1_2_8.cimentoKg, // 1,92 kg/m²
        unidadeTexto: "kg",
        fonte: "0,012 m³ de argamassa/m² × 160 kg de cimento por m³ (traço 1:2:8). Prática de mercado.",
        conferir: "TCPO/SINAPI — argamassa 1:2:8 para assentamento.",
      },
      {
        produtoId: "cal-ch3",
        nome: "Cal hidratada",
        coeficiente: ARGAMASSA_POR_M2_DE_MURO * ARGAMASSA_1_2_8.calKg, // 1,8 kg/m²
        unidadeTexto: "kg",
        fonte: "0,012 m³ de argamassa/m² × 150 kg de cal por m³ (traço 1:2:8). Prática de mercado.",
        conferir: "TCPO/SINAPI — argamassa 1:2:8 para assentamento.",
      },
      {
        produtoId: "areia-media",
        nome: "Areia média",
        coeficiente: ARGAMASSA_POR_M2_DE_MURO * ARGAMASSA_1_2_8.areiaM3, // 0,0132 m³/m²
        unidadeTexto: "m³",
        fonte: "0,012 m³ de argamassa/m² × 1,10 m³ de areia por m³ (traço 1:2:8). Prática de mercado.",
        conferir: "TCPO/SINAPI — argamassa 1:2:8 para assentamento.",
      },
    ],
    observacao: "Não inclui fundação, vigas, pilares nem chapisco/reboco.",
  },

  {
    id: "contrapiso",
    nome: "Contrapiso",
    descricao: "Camada de regularização do piso com argamassa de cimento e areia (traço 1:4).",
    medida: "area_x_espessura",
    campos: [
      { id: "area", rotulo: "Área do piso", unidade: "m²", min: 0.5, max: 10000 },
      { id: "espessura", rotulo: "Espessura", unidade: "cm", padrao: 5, min: 2, max: 15, ajuda: "Comum: 3 a 6 cm" },
    ],
    materiais: [
      {
        produtoId: "cimento-cp2",
        nome: "Cimento",
        coeficiente: 300,
        unidadeTexto: "kg",
        fonte: "Traço 1:4 (cimento : areia, em volume): ~300 kg de cimento por m³. Prática de mercado.",
        conferir: "SINAPI — contrapiso em argamassa traço 1:4 (cimento e areia).",
      },
      {
        produtoId: "areia-media",
        nome: "Areia média",
        coeficiente: 1.15,
        unidadeTexto: "m³",
        fonte: "Traço 1:4: ~1,15 m³ de areia por m³ (já considera o inchamento da areia). Prática de mercado.",
        conferir: "SINAPI — contrapiso em argamassa traço 1:4 (cimento e areia).",
      },
    ],
  },

  {
    id: "laje",
    nome: "Laje simples (maciça)",
    descricao: "Laje de concreto feito na obra (traço 1:2:3) com tela soldada como armadura de distribuição.",
    medida: "area_x_espessura",
    campos: [
      { id: "area", rotulo: "Área da laje", unidade: "m²", min: 0.5, max: 2000 },
      { id: "espessura", rotulo: "Espessura", unidade: "cm", padrao: 10, min: 7, max: 20, ajuda: "Comum: 8 a 12 cm" },
    ],
    materiais: [
      {
        produtoId: "cimento-cp2",
        nome: "Cimento",
        coeficiente: 350,
        unidadeTexto: "kg",
        fonte: "Concreto traço 1:2:3 (cimento : areia : brita, em volume), ~fck 20 MPa: ~350 kg/m³ (7 sacos). Tabela prática de traços.",
        conferir: "SINAPI — concreto fck 20 MPa preparado em betoneira; e o projeto estrutural.",
      },
      {
        produtoId: "areia-grossa",
        nome: "Areia grossa",
        coeficiente: 0.56,
        unidadeTexto: "m³",
        fonte: "Traço 1:2:3: ~0,56 m³ de areia por m³ de concreto. Tabela prática de traços.",
        conferir: "SINAPI — concreto fck 20 MPa preparado em betoneira.",
      },
      {
        produtoId: "brita-1",
        nome: "Brita 1",
        coeficiente: 0.84,
        unidadeTexto: "m³",
        fonte: "Traço 1:2:3: ~0,84 m³ de brita por m³ de concreto. Tabela prática de traços.",
        conferir: "SINAPI — concreto fck 20 MPa preparado em betoneira.",
      },
    ],
    observacao:
      "Calculamos só o concreto. A armadura (ferragem), as formas e o escoramento dependem do projeto estrutural e não estão incluídos.",
  },

  {
    id: "reboco",
    nome: "Reboco",
    descricao: "Revestimento de parede em argamassa de cimento, cal e areia fina (traço 1:2:8).",
    medida: "area_x_espessura",
    campos: [
      { id: "area", rotulo: "Área de parede", unidade: "m²", min: 0.5, max: 10000, ajuda: "Some todas as faces a rebocar" },
      { id: "espessura", rotulo: "Espessura", unidade: "cm", padrao: 2, min: 0.5, max: 5, ajuda: "Comum: 1,5 a 2,5 cm" },
    ],
    materiais: [
      {
        produtoId: "cimento-cp2",
        nome: "Cimento",
        coeficiente: ARGAMASSA_1_2_8.cimentoKg,
        unidadeTexto: "kg",
        fonte: "Argamassa 1:2:8: 160 kg de cimento por m³. Prática de mercado.",
        conferir: "SINAPI — emboço/massa única em argamassa traço 1:2:8.",
      },
      {
        produtoId: "cal-ch3",
        nome: "Cal hidratada",
        coeficiente: ARGAMASSA_1_2_8.calKg,
        unidadeTexto: "kg",
        fonte: "Argamassa 1:2:8: 150 kg de cal por m³. Prática de mercado.",
        conferir: "SINAPI — emboço/massa única em argamassa traço 1:2:8.",
      },
      {
        produtoId: "areia-fina",
        nome: "Areia fina",
        coeficiente: ARGAMASSA_1_2_8.areiaM3,
        unidadeTexto: "m³",
        fonte: "Argamassa 1:2:8: 1,10 m³ de areia por m³. Prática de mercado.",
        conferir: "SINAPI — emboço/massa única em argamassa traço 1:2:8.",
      },
    ],
    observacao: "Não inclui chapisco.",
  },

  {
    id: "piso",
    nome: "Assentamento de piso",
    descricao: "Piso 60×60 cm assentado com argamassa colante, mais rejunte.",
    medida: "area",
    campos: [{ id: "area", rotulo: "Área do piso", unidade: "m²", min: 0.5, max: 10000 }],
    opcao: {
      id: "tipo",
      rotulo: "Tipo de piso",
      valores: [
        { valor: "ceramico", rotulo: "Cerâmico" },
        { valor: "porcelanato", rotulo: "Porcelanato" },
      ],
    },
    materiais: [
      {
        produtoId: "piso-ceramico-60",
        nome: "Piso cerâmico 60×60",
        coeficiente: 1,
        unidadeTexto: "m²",
        fonte: "1 m² de piso por m² de área (a perda cobre recortes).",
        somenteSe: { opcao: "tipo", valor: "ceramico" },
      },
      {
        produtoId: "porcelanato-60",
        nome: "Porcelanato 60×60",
        coeficiente: 1,
        unidadeTexto: "m²",
        fonte: "1 m² de piso por m² de área (a perda cobre recortes).",
        somenteSe: { opcao: "tipo", valor: "porcelanato" },
      },
      {
        produtoId: "argamassa-ac1",
        nome: "Argamassa AC-I",
        coeficiente: 5,
        unidadeTexto: "kg",
        fonte: "Fabricantes de argamassa colante: 4 a 5 kg/m² com desempenadeira de 8 mm (colagem simples).",
        conferir: "Ficha técnica do fabricante. Peças de 60 cm podem exigir dupla colagem e AC-II.",
        somenteSe: { opcao: "tipo", valor: "ceramico" },
      },
      {
        produtoId: "argamassa-ac3",
        nome: "Argamassa AC-III",
        coeficiente: 8,
        unidadeTexto: "kg",
        fonte: "Fabricantes de argamassa colante: ~8 kg/m² em dupla colagem (recomendada para porcelanato 60×60).",
        conferir: "Ficha técnica do fabricante.",
        somenteSe: { opcao: "tipo", valor: "porcelanato" },
      },
      {
        produtoId: "rejunte",
        nome: "Rejunte",
        coeficiente: 0.3,
        unidadeTexto: "kg",
        fonte: "Fabricantes de rejunte: ~0,3 kg/m² para peças de 60×60 cm com junta de 3 mm.",
        conferir: "Calculadora/ficha técnica do fabricante de rejunte.",
      },
    ],
  },
];
