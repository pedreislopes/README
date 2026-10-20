// =============================================================================
// Sinônimos usados na busca
// =============================================================================
// Cada linha é um grupo de palavras que significam a mesma coisa na obra.
// Quem busca qualquer palavra do grupo encontra produtos com as outras.
//
// Escreva tudo em minúsculas e SEM acentos.
// Use só palavras soltas (sem espaços).
// =============================================================================

export const GRUPOS_DE_SINONIMOS: string[][] = [
  ["brita", "pedra", "pedrisco"],
  ["argamassa", "massa"],
  ["bloco", "tijolo"],
  ["tubo", "cano"],
  ["cabo", "fio"],
  ["vergalhao", "ferro"],
  ["compensado", "madeirite", "chapa"],
  ["revestimento", "azulejo"],
  ["eletroduto", "conduite", "corrugado"],
  ["caixa", "reservatorio"],
  ["tinta", "pintura"],
  ["telha", "telhado", "cobertura"],
  ["ceramico", "ceramica", "barro"],
  ["tela", "malha"],
];

/**
 * Palavras ignoradas na busca, porque não ajudam a encontrar o produto.
 * Ex.: "areia para reboco" busca só "areia" e "reboco".
 */
export const PALAVRAS_IGNORADAS = ["de", "da", "do", "das", "dos", "para", "pra", "com", "e", "em", "a", "o", "um", "uma"];

/** Mostrados quando a busca não encontra nada parecido */
export const MATERIAIS_POPULARES = [
  "cimento-cp2",
  "areia-media",
  "tijolo-8-furos",
  "brita-1",
  "argamassa-ac1",
  "vergalhao-10mm",
];
