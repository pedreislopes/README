// =============================================================================
// Busca de materiais
// =============================================================================
// Como funciona, em poucas palavras:
// 1. O texto buscado e o texto de cada produto são "normalizados":
//    sem acentos, em minúsculas, com números separados das letras.
// 2. Cada palavra buscada precisa combinar com alguma palavra do produto,
//    aceitando: palavra igual, começo da palavra ("arg" -> "argamassa"),
//    singular/plural ("furo" -> "furos"), sinônimo ("pedra" -> "brita")
//    e pequenos erros de digitação ("cimeto" -> "cimento").
// 3. Números precisam ser exatos ("8 furos" nunca encontra "6 furos").
// 4. Se nada combinar por completo, sugerimos produtos que combinam em parte.
// =============================================================================

import { GRUPOS_DE_SINONIMOS, PALAVRAS_IGNORADAS } from "@/config/sinonimos";

/** Dados mínimos de um produto para a busca */
export type ProdutoBuscavel = {
  id: string;
  name: string;
  category: string;
  keywords: string;
};

export type ResultadoBusca<T> = {
  /** Produtos que combinam com TODAS as palavras, do mais para o menos relevante */
  encontrados: T[];
  /** Quando nada foi encontrado: produtos que combinam com parte das palavras */
  sugeridos: T[];
};

/** "Cimento CP-II 50kg" -> "cimento cp ii 50 kg" */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/(\d)([a-z])/g, "$1 $2") // "50kg" -> "50 kg"
    .replace(/([a-z])(\d)/g, "$1 $2") // "cp2" -> "cp 2"
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Separa o texto buscado em palavras úteis */
export function palavrasDaBusca(consulta: string): string[] {
  return normalizar(consulta)
    .split(" ")
    .filter((p) => p && !PALAVRAS_IGNORADAS.includes(p));
}

/** Tira o plural simples: "furos" -> "furo", "tijolos" -> "tijolo" */
function singular(palavra: string): string {
  return palavra.length > 3 && palavra.endsWith("s") ? palavra.slice(0, -1) : palavra;
}

/** Quantas letras é preciso trocar para transformar uma palavra na outra */
export function distancia(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const acima = linha[j];
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = acima;
    }
  }
  return linha[b.length];
}

/** Erros de digitação tolerados conforme o tamanho da palavra */
function errosPermitidos(palavra: string): number {
  if (palavra.length >= 7) return 2;
  if (palavra.length >= 4) return 1;
  return 0;
}

/**
 * Nota de combinação entre UMA palavra buscada e UMA palavra do produto.
 * 3 = igual · 2 = plural/começo da palavra · 1 = erro de digitação · 0 = não combina
 */
function notaPalavra(buscada: string, doProduto: string): number {
  if (buscada === doProduto) return 3;
  if (/^\d+$/.test(buscada) || /^\d+$/.test(doProduto)) return 0; // números: só exato
  if (singular(buscada) === singular(doProduto)) return 2;
  if (buscada.length >= 3 && doProduto.startsWith(buscada)) return 2;
  const erros = errosPermitidos(buscada);
  if (erros > 0 && distancia(singular(buscada), singular(doProduto)) <= erros) return 1;
  return 0;
}

/** A partir desta nota a combinação não é "só erro de digitação" */
const NOTA_FORTE = 1.5;
/** Nota de quem só combina pelo nome da categoria (fraca de propósito) */
const NOTA_CATEGORIA = 0.5;

/** A palavra buscada mais seus sinônimos */
function comSinonimos(palavra: string): string[] {
  const grupo = GRUPOS_DE_SINONIMOS.find((g) => g.includes(singular(palavra)));
  return grupo ? [palavra, ...grupo.filter((s) => s !== singular(palavra))] : [palavra];
}

/** Melhor nota de uma palavra buscada contra todas as palavras do produto */
function notaContraProduto(buscada: string, palavrasProduto: string[]): number {
  let melhor = 0;
  for (const [i, variante] of comSinonimos(buscada).entries()) {
    const ehSinonimo = i > 0;
    for (const p of palavrasProduto) {
      const nota = notaPalavra(variante, p);
      // Sinônimo vale um pouco menos que a palavra original
      melhor = Math.max(melhor, ehSinonimo && nota > 0 ? nota - 0.5 : nota);
    }
  }
  return melhor;
}

/**
 * Busca produtos pelo texto digitado.
 * Com texto vazio, devolve todos os produtos (útil para filtrar só por categoria).
 */
export function buscarProdutos<T extends ProdutoBuscavel>(
  produtos: T[],
  consulta: string,
): ResultadoBusca<T> {
  const palavras = palavrasDaBusca(consulta);
  if (palavras.length === 0) return { encontrados: produtos, sugeridos: [] };

  const avaliados = produtos.map((produto) => {
    // O nome do produto pesa mais do que as palavras-chave,
    // e a categoria pesa bem pouco (ex.: "pedra" deve trazer brita, não
    // toda a categoria "Areia e pedra"; mas "hidraulica" traz a categoria toda).
    const palavrasNome = normalizar(produto.name).split(" ");
    const palavrasChave = normalizar(`${produto.name} ${produto.keywords}`).split(" ");
    const palavrasCategoria = normalizar(produto.category).split(" ");
    const notas = palavras.map((b) => {
      const noNome = notaContraProduto(b, palavrasNome);
      const nasChaves = notaContraProduto(b, palavrasChave);
      const naCategoria = notaContraProduto(b, palavrasCategoria);
      return Math.max(noNome > 0 ? noNome + 0.25 : 0, nasChaves, naCategoria > 0 ? NOTA_CATEGORIA : 0);
    });
    return { produto, notas };
  });

  // Se uma palavra combina "de verdade" com algum produto (igual, plural, sinônimo),
  // ignoramos as combinações só por erro de digitação para ESSA palavra.
  // Ex.: quem busca "tela" quer a tela soldada, não "telha".
  palavras.forEach((_, i) => {
    const temCombinacaoForte = avaliados.some((a) => a.notas[i] >= NOTA_FORTE);
    if (temCombinacaoForte) {
      for (const a of avaliados) if (a.notas[i] < NOTA_FORTE) a.notas[i] = 0;
    }
  });

  const contados = avaliados.map(({ produto, notas }) => ({
    produto,
    combinadas: notas.filter((n) => n > 0).length,
    nota: notas.reduce((a, b) => a + b, 0),
  }));

  const encontrados = contados
    .filter((a) => a.combinadas === palavras.length)
    .sort((a, b) => b.nota - a.nota)
    .map((a) => a.produto);

  if (encontrados.length > 0) return { encontrados, sugeridos: [] };

  const sugeridos = contados
    .filter((a) => a.combinadas > 0)
    .sort((a, b) => b.combinadas - a.combinadas || b.nota - a.nota)
    .slice(0, 6)
    .map((a) => a.produto);

  return { encontrados: [], sugeridos };
}
