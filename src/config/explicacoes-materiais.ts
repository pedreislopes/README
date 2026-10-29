// =============================================================================
// Explicações dos materiais (ícone "?" ao lado do nome) e guias "Qual escolher?"
// =============================================================================
// Para quem nunca fez obra: cada material tem 3 frases curtas.
//   - oQueE:       o que é o material;
//   - paraQue:     para que serve;
//   - quandoUsar:  quando escolher este (e não outro parecido).
//
// PARA O ENGENHEIRO CONFERIR:
//   - "fonte" diz de onde veio a informação (norma técnica ou prática comum).
//   - "revisao" começa como "AGUARDANDO_ENGENHEIRO". Depois de conferir, troque por
//       revisao: { status: "REVISADO", por: "Nome do engenheiro (CREA 0000/DF)", em: "2026-11-15" },
//   - Corrija o texto direto aqui. Mantenha frases curtas (até ~140 letras).
//
// A chave de cada item é o código do material (o mesmo de prisma/dados-teste.ts).
// Material sem explicação aqui simplesmente não mostra o "?".
// =============================================================================

import type { Categoria } from "./constantes";

export type Revisao =
  | { status: "AGUARDANDO_ENGENHEIRO" }
  | { status: "REVISADO"; por: string; em: string };

export type Explicacao = {
  oQueE: string;
  paraQue: string;
  quandoUsar: string;
  fonte: string;
  revisao: Revisao;
};

const AGUARDANDO: Revisao = { status: "AGUARDANDO_ENGENHEIRO" };

/** Aviso mostrado junto de toda explicação */
export const AVISO_EXPLICACAO = "Explicação simplificada. Na dúvida, confirme com um profissional da obra.";

export const EXPLICACOES: Record<string, Explicacao> = {
  // --- Cimento e argamassa ---------------------------------------------------
  "cimento-cp2": {
    oQueE: "Cimento de uso geral, o mais vendido no Brasil.",
    paraQue: "Concreto, reboco, contrapiso e assentamento de tijolos.",
    quandoUsar: "Na maioria das obras comuns de casa, quando não há pedido especial do engenheiro.",
    fonte: "ABNT NBR 16697 (cimento Portland) e prática de mercado",
    revisao: AGUARDANDO,
  },
  "cimento-cp3": {
    oQueE: "Cimento com escória de alto-forno, mais resistente a água e solo agressivo.",
    paraQue: "Fundações, baldrames, muros de arrimo e obras em contato com umidade.",
    quandoUsar: "Em partes da obra enterradas ou úmidas. Endurece um pouco mais devagar.",
    fonte: "ABNT NBR 16697 (cimento Portland); \"RS\" = resistente a sulfatos",
    revisao: AGUARDANDO,
  },
  "cimento-cp5": {
    oQueE: "Cimento de alta resistência inicial: ganha força rápido.",
    paraQue: "Peças pré-moldadas, lajes e serviços que precisam desformar cedo.",
    quandoUsar: "Quando a pressa importa. Para uso comum, o CP II costuma bastar.",
    fonte: "ABNT NBR 16697 (cimento Portland); ARI = alta resistência inicial",
    revisao: AGUARDANDO,
  },
  "argamassa-ac1": {
    oQueE: "Argamassa pronta (é só misturar água) para colar piso e azulejo.",
    paraQue: "Assentar cerâmica em áreas internas e secas.",
    quandoUsar: "Piso cerâmico dentro de casa. Não serve para área externa nem porcelanato.",
    fonte: "ABNT NBR 14081 (argamassa colante industrializada)",
    revisao: AGUARDANDO,
  },
  "argamassa-ac3": {
    oQueE: "Argamassa colante de alta aderência, a mais forte das três (AC-I, II e III).",
    paraQue: "Assentar porcelanato e peças grandes, dentro ou fora de casa.",
    quandoUsar: "Porcelanato, fachadas, piscinas e áreas que pegam sol e chuva.",
    fonte: "ABNT NBR 14081 (argamassa colante industrializada)",
    revisao: AGUARDANDO,
  },
  "argamassa-assentamento": {
    oQueE: "Massa pronta para levantar paredes; dispensa misturar cimento, cal e areia.",
    paraQue: "Assentar (colar) tijolos e blocos.",
    quandoUsar: "Em obras pequenas ou quando falta espaço para preparar a massa na obra.",
    fonte: "ABNT NBR 13281 (argamassa para assentamento e revestimento)",
    revisao: AGUARDANDO,
  },
  "cal-ch3": {
    oQueE: "Pó branco misturado ao cimento e à areia na massa.",
    paraQue: "Deixa a massa de reboco e de assentamento mais macia e fácil de trabalhar.",
    quandoUsar: "Quando o pedreiro prepara a massa na obra (traço com cal).",
    fonte: "ABNT NBR 7175 (cal hidratada para argamassas)",
    revisao: AGUARDANDO,
  },
  rejunte: {
    oQueE: "Massa que preenche os vãos (juntas) entre pisos e azulejos.",
    paraQue: "Vedar as juntas, evitar sujeira e infiltração e dar acabamento.",
    quandoUsar: "Depois que a argamassa colante secou. O flexível aguenta pequenas dilatações.",
    fonte: "ABNT NBR 14992 (argamassa para rejuntamento)",
    revisao: AGUARDANDO,
  },

  // --- Areia e pedra ---------------------------------------------------------
  "areia-media": {
    oQueE: "Areia de grãos médios, lavada (sem barro).",
    paraQue: "Concreto, contrapiso e massa para assentar tijolos.",
    quandoUsar: "É a areia \"coringa\" da obra; na dúvida, é a mais usada.",
    fonte: "ABNT NBR 7211 (agregados para concreto) e prática de mercado",
    revisao: AGUARDANDO,
  },
  "areia-fina": {
    oQueE: "Areia de grãos menores.",
    paraQue: "Reboco e acabamento de paredes (deixa a superfície mais lisa).",
    quandoUsar: "Na última camada da parede, antes da massa corrida e da pintura.",
    fonte: "Prática de mercado; classificação de grãos conforme ABNT NBR 7211",
    revisao: AGUARDANDO,
  },
  "areia-grossa": {
    oQueE: "Areia de grãos maiores.",
    paraQue: "Concreto de fundações, pilares e lajes, e chapisco.",
    quandoUsar: "Quando a peça precisa de mais resistência (estrutura).",
    fonte: "Prática de mercado; classificação de grãos conforme ABNT NBR 7211",
    revisao: AGUARDANDO,
  },
  "brita-1": {
    oQueE: "Pedra britada de tamanho médio (cerca de 1 a 2 cm).",
    paraQue: "Concreto de lajes, vigas, pilares e fundações.",
    quandoUsar: "É a brita mais usada no concreto de casas.",
    fonte: "ABNT NBR 7211 (agregados para concreto)",
    revisao: AGUARDANDO,
  },
  "brita-0": {
    oQueE: "Pedra britada pequena, também chamada de pedrisco.",
    paraQue: "Concreto de peças finas (vergas, pré-moldados) e contrapiso.",
    quandoUsar: "Quando a peça é estreita ou tem muito ferro, e a brita 1 não passa.",
    fonte: "ABNT NBR 7211 (agregados para concreto)",
    revisao: AGUARDANDO,
  },
  "po-de-brita": {
    oQueE: "Pó fino que sobra da britagem da pedra.",
    paraQue: "Base para assentar piso intertravado e enchimentos.",
    quandoUsar: "Calçadas e pátios com bloquete. Não substitui a areia no reboco.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },

  // --- Tijolos e blocos ------------------------------------------------------
  "tijolo-8-furos": {
    oQueE: "Tijolo de barro cozido com 8 furos, o \"baiano\".",
    paraQue: "Levantar paredes de vedação (que não sustentam a laje).",
    quandoUsar: "Paredes comuns de casa. Rende mais por m² que o de 6 furos.",
    fonte: "ABNT NBR 15270 (blocos cerâmicos)",
    revisao: AGUARDANDO,
  },
  "tijolo-6-furos": {
    oQueE: "Tijolo de barro cozido com 6 furos, menor que o de 8.",
    paraQue: "Paredes de vedação e muros.",
    quandoUsar: "Paredes internas ou muros mais finos.",
    fonte: "ABNT NBR 15270 (blocos cerâmicos)",
    revisao: AGUARDANDO,
  },
  "tijolo-macico": {
    oQueE: "Tijolo de barro sem furos, pequeno e pesado.",
    paraQue: "Churrasqueiras, fornos, paredes aparentes e detalhes.",
    quandoUsar: "Quando a parede fica à vista ou pega calor. Rende pouco por m².",
    fonte: "ABNT NBR 15270 (componentes cerâmicos) e prática de mercado",
    revisao: AGUARDANDO,
  },
  "bloco-concreto-14": {
    oQueE: "Bloco de concreto de 14 cm de largura.",
    paraQue: "Paredes mais grossas, muros e alvenaria estrutural (se projetada).",
    quandoUsar: "Muros e paredes externas. Para sustentar laje, só com projeto de engenheiro.",
    fonte: "ABNT NBR 6136 (blocos de concreto)",
    revisao: AGUARDANDO,
  },
  "bloco-concreto-9": {
    oQueE: "Bloco de concreto de 9 cm de largura.",
    paraQue: "Paredes de vedação internas.",
    quandoUsar: "Divisórias internas. Não sustenta peso de laje.",
    fonte: "ABNT NBR 6136 (blocos de concreto)",
    revisao: AGUARDANDO,
  },

  // --- Aço para estrutura ----------------------------------------------------
  "vergalhao-10mm": {
    oQueE: "Barra de aço de 10 mm (3/8\"), o \"ferro\" do concreto.",
    paraQue: "Armar vigas, pilares, sapatas e lajes.",
    quandoUsar: "Na estrutura, na quantidade e bitola do projeto do engenheiro.",
    fonte: "ABNT NBR 7480 (aço para concreto armado)",
    revisao: AGUARDANDO,
  },
  "vergalhao-8mm": {
    oQueE: "Barra de aço de 8 mm (5/16\").",
    paraQue: "Armar vigas e pilares menores, vergas e cintas.",
    quandoUsar: "Em peças com menos carga, conforme o projeto.",
    fonte: "ABNT NBR 7480 (aço para concreto armado)",
    revisao: AGUARDANDO,
  },
  "vergalhao-4-2mm": {
    oQueE: "Arame de aço fino de 4,2 mm (CA-60).",
    paraQue: "Fazer os estribos (os \"anéis\" que amarram as barras de vigas e pilares).",
    quandoUsar: "Junto com o vergalhão maior, para montar as armações.",
    fonte: "ABNT NBR 7480 (aço para concreto armado)",
    revisao: AGUARDANDO,
  },
  "malha-pop": {
    oQueE: "Tela de aço soldada, já pronta em painel.",
    paraQue: "Reforçar contrapisos, calçadas e pisos de concreto contra rachaduras.",
    quandoUsar: "Pisos de garagem e calçadas. Não substitui a armação de lajes.",
    fonte: "ABNT NBR 7481 (tela de aço soldada)",
    revisao: AGUARDANDO,
  },

  // --- Ferragens, ferramentas e EPI -----------------------------------------
  "prego-18x27": {
    oQueE: "Prego médio com cabeça (cerca de 6 cm de comprimento).",
    paraQue: "Pregar tábuas de fôrmas, caibros e madeiras mais grossas.",
    quandoUsar: "Montagem de fôrmas e estruturas de madeira de obra.",
    fonte: "Prática de mercado (bitola x comprimento na escala de fieira)",
    revisao: AGUARDANDO,
  },
  "prego-17x21": {
    oQueE: "Prego menor e mais fino que o 18x27 (cerca de 5 cm).",
    paraQue: "Pregar sarrafos, ripas e madeiras finas sem rachar.",
    quandoUsar: "Travamentos de fôrmas e serviços leves de madeira.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "arame-recozido": {
    oQueE: "Arame fino e macio, fácil de dobrar à mão.",
    paraQue: "Amarrar as barras de ferro (vergalhões) umas nas outras.",
    quandoUsar: "Na montagem das armações de vigas, pilares e lajes.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "arame-galvanizado-14": {
    oQueE: "Arame com proteção de zinco contra ferrugem.",
    paraQue: "Cercas, varais, amarrações que ficam ao tempo.",
    quandoUsar: "Quando o arame fica exposto à chuva. Para amarrar ferro, use o recozido.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "parafuso-madeira": {
    oQueE: "Parafuso pontudo de rosca grossa, para madeira.",
    paraQue: "Fixar madeiras, dobradiças e móveis com mais firmeza que o prego.",
    quandoUsar: "Quando a peça precisa ser desmontada depois ou não pode soltar.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "porca-sextavada": {
    oQueE: "Peça de 6 lados com rosca por dentro, zincada contra ferrugem.",
    paraQue: "Prender barras roscadas e parafusos de 3/8\".",
    quandoUsar: "Fixação de chumbadores, suportes e estruturas metálicas.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "fita-isolante": {
    oQueE: "Fita plástica que não conduz eletricidade.",
    paraQue: "Isolar emendas de fios elétricos.",
    quandoUsar: "Em emendas e reparos. Use fita com selo do Inmetro.",
    fonte: "ABNT NBR NM 60454 (fitas isolantes) e prática de mercado",
    revisao: AGUARDANDO,
  },
  "disco-corte-ferro": {
    oQueE: "Disco fino para esmerilhadeira (lixadeira) de 4.1/2\".",
    paraQue: "Cortar vergalhões, barras e chapas de metal.",
    quandoUsar: "Corte de ferro. Para piso e concreto, use o disco diamantado.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "disco-diamantado": {
    oQueE: "Disco com borda de diamante industrial, para serra mármore.",
    paraQue: "Cortar piso, azulejo, telha, tijolo e concreto.",
    quandoUsar: "Corte de materiais de pedra e cerâmica. Não use em metal.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "luva-nitrilica": {
    oQueE: "Luva de tecido com palma emborrachada (nitrílica).",
    paraQue: "Proteger as mãos do cimento, da massa e de cortes leves.",
    quandoUsar: "No dia a dia do pedreiro e do ajudante, ao mexer com massa.",
    fonte: "NR-6 (Equipamento de Proteção Individual) — exige CA válido",
    revisao: AGUARDANDO,
  },
  "luva-raspa": {
    oQueE: "Luva grossa de couro.",
    paraQue: "Proteger contra calor, faíscas e materiais ásperos.",
    quandoUsar: "Ao cortar ferro, soldar ou carregar blocos e telhas.",
    fonte: "NR-6 (Equipamento de Proteção Individual) — exige CA válido",
    revisao: AGUARDANDO,
  },
  "oculos-protecao": {
    oQueE: "Óculos de plástico resistente que protegem os olhos.",
    paraQue: "Evitar que poeira, lascas e respingos atinjam os olhos.",
    quandoUsar: "Sempre ao cortar, lixar, furar ou quebrar.",
    fonte: "NR-6 (Equipamento de Proteção Individual) — exige CA válido",
    revisao: AGUARDANDO,
  },
  "capacete-seguranca": {
    oQueE: "Capacete rígido com tira no queixo (jugular).",
    paraQue: "Proteger a cabeça de quedas de materiais e batidas.",
    quandoUsar: "Em toda obra com laje, andaime ou trabalho no alto.",
    fonte: "NR-6 e NR-18 (segurança na construção) — exige CA válido",
    revisao: AGUARDANDO,
  },
  "martelo-unha": {
    oQueE: "Martelo com uma ponta em \"V\" para arrancar pregos.",
    paraQue: "Pregar e despregar madeiras.",
    quandoUsar: "Montar e desmontar fôrmas. O de 27 mm é o tamanho mais comum.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "trena-5m": {
    oQueE: "Fita métrica de aço que enrola sozinha.",
    paraQue: "Medir paredes, cômodos e peças.",
    quandoUsar: "Em qualquer serviço. 5 m atende a maioria das medições da casa.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "nivel-aluminio": {
    oQueE: "Régua com bolhas que mostram se está reto.",
    paraQue: "Conferir se paredes, pisos e prateleiras estão no nível e no prumo.",
    quandoUsar: "Ao levantar paredes, assentar piso e instalar portas.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "colher-pedreiro": {
    oQueE: "Ferramenta de lâmina triangular com cabo.",
    paraQue: "Pegar e espalhar massa ao assentar tijolos e rebocar.",
    quandoUsar: "Ferramenta básica de todo pedreiro.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "desempenadeira-aco": {
    oQueE: "Placa de aço lisa com cabo.",
    paraQue: "Espalhar e alisar massa, argamassa colante e cimento queimado.",
    quandoUsar: "Acabamento de reboco e aplicação de argamassa (a dentada).",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },

  // --- Hidráulica ------------------------------------------------------------
  "tubo-pvc-25": {
    oQueE: "Cano de PVC marrom de 25 mm, colado com adesivo.",
    paraQue: "Levar água fria da caixa d'água até torneiras e chuveiros.",
    quandoUsar: "Ramais de água fria. Não use em água quente.",
    fonte: "ABNT NBR 5648 (tubos de PVC para água fria)",
    revisao: AGUARDANDO,
  },
  "tubo-esgoto-100": {
    oQueE: "Cano de PVC branco de 100 mm.",
    paraQue: "Levar o esgoto do vaso sanitário até a rede ou fossa.",
    quandoUsar: "Saída do vaso e coletor principal da casa.",
    fonte: "ABNT NBR 5688 (tubos de PVC para esgoto)",
    revisao: AGUARDANDO,
  },
  "caixa-dagua-1000": {
    oQueE: "Reservatório de plástico de 1.000 litros.",
    paraQue: "Guardar água para a casa quando falta abastecimento.",
    quandoUsar: "Casas de até 4–5 pessoas, em geral. Famílias maiores precisam de mais.",
    fonte: "ABNT NBR 5626 (instalação de água fria) e prática de mercado",
    revisao: AGUARDANDO,
  },
  "registro-gaveta": {
    oQueE: "Registro que abre e fecha totalmente a passagem de água.",
    paraQue: "Fechar a água de um banheiro ou cozinha para consertos.",
    quandoUsar: "Na entrada de cada ambiente com água. O \"bruto\" leva acabamento depois.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },

  // --- Elétrica --------------------------------------------------------------
  "cabo-2-5": {
    oQueE: "Fio elétrico flexível de 2,5 mm².",
    paraQue: "Ligar tomadas de uso geral.",
    quandoUsar: "Tomadas comuns. Chuveiro e ar-condicionado pedem fio mais grosso.",
    fonte: "ABNT NBR 5410 (instalações elétricas de baixa tensão)",
    revisao: AGUARDANDO,
  },
  "cabo-4": {
    oQueE: "Fio elétrico flexível de 4 mm², mais grosso.",
    paraQue: "Ligar chuveiros e aparelhos de maior potência.",
    quandoUsar: "Circuitos de chuveiro, conforme a potência e a distância do quadro.",
    fonte: "ABNT NBR 5410 (instalações elétricas de baixa tensão)",
    revisao: AGUARDANDO,
  },
  "eletroduto-3-4": {
    oQueE: "Mangueira corrugada (conduíte) por onde passam os fios.",
    paraQue: "Proteger os fios dentro das paredes e lajes.",
    quandoUsar: "Antes de rebocar, em toda a instalação elétrica embutida.",
    fonte: "ABNT NBR 5410 e NBR 15465 (eletrodutos plásticos)",
    revisao: AGUARDANDO,
  },
  "disjuntor-20a": {
    oQueE: "Chave automática do quadro de luz que desliga em sobrecarga.",
    paraQue: "Proteger um circuito (ex.: tomadas) contra curto e superaquecimento.",
    quandoUsar: "Um por circuito; o valor (20 A) depende do fio usado. Peça ao eletricista.",
    fonte: "ABNT NBR 5410 e NBR NM 60898 (disjuntores)",
    revisao: AGUARDANDO,
  },

  // --- Pisos e revestimentos -------------------------------------------------
  "piso-ceramico-60": {
    oQueE: "Piso de cerâmica de 60x60 cm. O PEI (de 1 a 5) indica a resistência ao desgaste.",
    paraQue: "Revestir o chão de salas, quartos e cozinhas.",
    quandoUsar: "Áreas internas com movimento médio a alto. Mais barato que porcelanato.",
    fonte: "ABNT NBR ISO 13006 (placas cerâmicas); PEI = resistência à abrasão",
    revisao: AGUARDANDO,
  },
  "porcelanato-60": {
    oQueE: "Placa mais densa e resistente que a cerâmica; pode ser polida (brilho) ou acetinada.",
    paraQue: "Pisos de salas e áreas nobres.",
    quandoUsar: "Quando quer acabamento mais bonito. Polido escorrega molhado: evite área externa.",
    fonte: "ABNT NBR 15463 (porcelanato)",
    revisao: AGUARDANDO,
  },
  "revestimento-parede": {
    oQueE: "Azulejo para paredes.",
    paraQue: "Proteger da água as paredes de banheiros, cozinhas e áreas de serviço.",
    quandoUsar: "Só em parede. Não serve como piso (não aguenta o pisoteio).",
    fonte: "ABNT NBR ISO 13006 (placas cerâmicas)",
    revisao: AGUARDANDO,
  },

  // --- Tintas ----------------------------------------------------------------
  "tinta-acrilica-18": {
    oQueE: "Tinta à base de água, lavável.",
    paraQue: "Pintar paredes internas e externas.",
    quandoUsar: "Acabamento final das paredes. Fosca disfarça imperfeições.",
    fonte: "ABNT NBR 15079 (tintas para construção civil)",
    revisao: AGUARDANDO,
  },
  "massa-corrida": {
    oQueE: "Massa branca e fina passada antes da tinta.",
    paraQue: "Deixar a parede lisa, tapando pequenos buracos e ondulações.",
    quandoUsar: "Paredes internas e secas. Em área externa ou úmida, use massa acrílica.",
    fonte: "Prática de mercado (ABNT NBR 15348: massa niveladora)",
    revisao: AGUARDANDO,
  },
  "selador-acrilico": {
    oQueE: "Primeira demão (fundo) sobre o reboco novo.",
    paraQue: "Uniformizar a parede e fazer a tinta render mais.",
    quandoUsar: "Antes da massa corrida ou da tinta, em reboco novo.",
    fonte: "Prática de mercado (ABNT NBR 15079)",
    revisao: AGUARDANDO,
  },

  // --- Madeiras --------------------------------------------------------------
  "tabua-pinus": {
    oQueE: "Tábua de pinus (madeira de reflorestamento) de 30 cm.",
    paraQue: "Fazer as fôrmas de vigas e baldrames antes do concreto.",
    quandoUsar: "Fôrmas e serviços temporários. Não é madeira de acabamento.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "sarrafo-pinus": {
    oQueE: "Ripa estreita de pinus.",
    paraQue: "Travar fôrmas, fazer gabarito e pequenas estruturas provisórias.",
    quandoUsar: "Junto com tábuas e compensado na montagem das fôrmas.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "compensado-10": {
    oQueE: "Chapa de madeira colada em camadas, com resina (madeirite).",
    paraQue: "Fôrmas de lajes, pilares e tapumes.",
    quandoUsar: "Quando precisa de uma superfície grande e lisa para o concreto.",
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },

  // --- Telhas e coberturas ---------------------------------------------------
  "telha-fibrocimento": {
    oQueE: "Telha ondulada de cimento com fibras (sem amianto).",
    paraQue: "Cobrir casas, garagens e áreas de serviço.",
    quandoUsar: "Telhados simples e baratos, com pouca inclinação.",
    fonte: "ABNT NBR 15210 (telhas de fibrocimento)",
    revisao: AGUARDANDO,
  },
  "telha-colonial": {
    oQueE: "Telha de barro curva, a tradicional.",
    paraQue: "Telhados de casas.",
    quandoUsar: "Quando quer telhado mais fresco e bonito. Pede madeiramento e inclinação maiores.",
    fonte: "ABNT NBR 15310 (telhas cerâmicas)",
    revisao: AGUARDANDO,
  },
};

// =============================================================================
// Guias "Qual escolher?" de cada categoria (aparecem na página da categoria)
// =============================================================================
// Cada linha compara materiais parecidos: qual escolher em cada situação.
// "materiais" são os códigos (aparecem como nome + link para a página do material).

export type GuiaCategoria = {
  comparacoes: { pergunta: string; materiais: string[]; resposta: string }[];
  fonte: string;
  revisao: Revisao;
};

export const GUIAS_CATEGORIA: Partial<Record<Categoria, GuiaCategoria>> = {
  "Cimento e argamassa": {
    comparacoes: [
      {
        pergunta: "Qual cimento?",
        materiais: ["cimento-cp2", "cimento-cp3", "cimento-cp5"],
        resposta: "CP II para quase tudo; CP III em fundação e lugares úmidos; CP V quando precisa de pressa.",
      },
      {
        pergunta: "Qual argamassa colante?",
        materiais: ["argamassa-ac1", "argamassa-ac3"],
        resposta: "AC-I para cerâmica dentro de casa; AC-III para porcelanato e área externa.",
      },
    ],
    fonte: "ABNT NBR 16697 e NBR 14081",
    revisao: AGUARDANDO,
  },
  "Areia e pedra": {
    comparacoes: [
      {
        pergunta: "Qual areia?",
        materiais: ["areia-fina", "areia-media", "areia-grossa"],
        resposta: "Fina para reboco e acabamento; média para quase tudo; grossa para concreto de estrutura.",
      },
      {
        pergunta: "Qual brita?",
        materiais: ["brita-0", "brita-1"],
        resposta: "Brita 1 no concreto comum; brita 0 (pedrisco) em peças finas ou com muito ferro.",
      },
    ],
    fonte: "ABNT NBR 7211 e prática de mercado",
    revisao: AGUARDANDO,
  },
  "Tijolos e blocos": {
    comparacoes: [
      {
        pergunta: "Tijolo de barro ou bloco de concreto?",
        materiais: ["tijolo-8-furos", "bloco-concreto-14"],
        resposta: "Tijolo cerâmico é mais leve e barato por m²; bloco de concreto é mais resistente e regular.",
      },
      {
        pergunta: "8 ou 6 furos?",
        materiais: ["tijolo-8-furos", "tijolo-6-furos"],
        resposta: "8 furos rende mais por m² e é o mais usado; 6 furos para paredes e muros mais finos.",
      },
    ],
    fonte: "ABNT NBR 15270 e NBR 6136",
    revisao: AGUARDANDO,
  },
  "Aço para estrutura": {
    comparacoes: [
      {
        pergunta: "Qual bitola de ferro?",
        materiais: ["vergalhao-10mm", "vergalhao-8mm", "vergalhao-4-2mm"],
        resposta: "Siga sempre o projeto. Em geral: 10 e 8 mm nas barras principais; 4,2 mm nos estribos.",
      },
    ],
    fonte: "ABNT NBR 7480 e NBR 6118",
    revisao: AGUARDANDO,
  },
  "Ferragens, ferramentas e EPI": {
    comparacoes: [
      {
        pergunta: "Qual arame?",
        materiais: ["arame-recozido", "arame-galvanizado-14"],
        resposta: "Recozido para amarrar ferro (é macio); galvanizado para o que fica na chuva (não enferruja).",
      },
      {
        pergunta: "Qual disco de corte?",
        materiais: ["disco-corte-ferro", "disco-diamantado"],
        resposta: "Disco de ferro só corta metal; diamantado corta piso, telha e concreto.",
      },
      {
        pergunta: "Qual luva?",
        materiais: ["luva-nitrilica", "luva-raspa"],
        resposta: "Nitrílica para mexer com massa; raspa de couro para calor, faísca e peso.",
      },
      {
        pergunta: "Ferramentas: vale pagar mais pela marca?",
        materiais: ["martelo-unha", "trena-5m", "nivel-aluminio"],
        resposta: "Cada loja vende uma marca: compare preço e marca lado a lado. Para uso diário, prefira marcas conhecidas.",
      },
    ],
    fonte: "NR-6 e prática de mercado",
    revisao: AGUARDANDO,
  },
  Hidráulica: {
    comparacoes: [
      {
        pergunta: "Cano marrom ou branco?",
        materiais: ["tubo-pvc-25", "tubo-esgoto-100"],
        resposta: "Marrom (soldável) leva água limpa; branco leva esgoto. Não troque um pelo outro.",
      },
    ],
    fonte: "ABNT NBR 5648 e NBR 5688",
    revisao: AGUARDANDO,
  },
  Elétrica: {
    comparacoes: [
      {
        pergunta: "Qual espessura de fio?",
        materiais: ["cabo-2-5", "cabo-4"],
        resposta: "2,5 mm² para tomadas comuns; 4 mm² (ou mais) para chuveiro. Confirme com o eletricista.",
      },
    ],
    fonte: "ABNT NBR 5410",
    revisao: AGUARDANDO,
  },
  "Pisos e revestimentos": {
    comparacoes: [
      {
        pergunta: "Cerâmica ou porcelanato?",
        materiais: ["piso-ceramico-60", "porcelanato-60"],
        resposta: "Cerâmica é mais barata; porcelanato é mais resistente e bonito, mas pede argamassa AC-III.",
      },
      {
        pergunta: "Piso ou revestimento de parede?",
        materiais: ["piso-ceramico-60", "revestimento-parede"],
        resposta: "Revestimento de parede não aguenta pisoteio: use só na parede.",
      },
    ],
    fonte: "ABNT NBR ISO 13006 e NBR 15463",
    revisao: AGUARDANDO,
  },
  Tintas: {
    comparacoes: [
      {
        pergunta: "Em que ordem?",
        materiais: ["selador-acrilico", "massa-corrida", "tinta-acrilica-18"],
        resposta: "Reboco novo: 1º selador, 2º massa corrida (se quiser parede lisa), 3º tinta.",
      },
    ],
    fonte: "ABNT NBR 15079 e prática de mercado",
    revisao: AGUARDANDO,
  },
  Madeiras: {
    comparacoes: [
      {
        pergunta: "Tábua ou compensado?",
        materiais: ["tabua-pinus", "compensado-10"],
        resposta: "Tábua para fôrmas de vigas e baldrames; compensado para lajes e superfícies grandes.",
      },
    ],
    fonte: "Prática de mercado",
    revisao: AGUARDANDO,
  },
  "Telhas e coberturas": {
    comparacoes: [
      {
        pergunta: "Fibrocimento ou cerâmica?",
        materiais: ["telha-fibrocimento", "telha-colonial"],
        resposta: "Fibrocimento é mais barato e leve; cerâmica é mais fresca e bonita, mas pesa mais.",
      },
    ],
    fonte: "ABNT NBR 15210 e NBR 15310",
    revisao: AGUARDANDO,
  },
};
