// =============================================================================
// Arquivos de planilha da importação de produtos: ler o que o lojista envia
// (Excel .xlsx ou CSV) e gerar o modelo para baixar.
// As regras (o que muda, erros por linha) ficam em src/domain/importacao.ts.
// =============================================================================

import { unzipSync } from "fflate";
import readXlsxFile from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { COLUNAS, decodificarCsv, FAIXAS_NA_PLANILHA, lerCsv, type Celula } from "@/domain/importacao";
import { modeloDe } from "@/config/caracteristicas";
import { COLUNAS_CARACTERISTICAS, COLUNAS_CATALOGO, PREFIXO_CARACTERISTICA } from "@/domain/importacao-catalogo";
import { lerCaracteristicas } from "@/domain/marcas";
import { centavosParaCsv, gerarCsv } from "@/domain/pedidos";

/** Tamanho máximo do arquivo enviado (1 MB dá para milhares de produtos) */
export const TAMANHO_MAXIMO_PLANILHA = 1024 * 1024;
/**
 * Um .xlsx é um arquivo compactado (zip). Para ninguém travar o servidor com um
 * arquivo pequeno que "explode" ao descompactar, limitamos o tamanho descompactado.
 */
const DESCOMPACTADO_MAXIMO = 20 * 1024 * 1024;

export const ABA_PRODUTOS = "Produtos";

export async function lerArquivoPlanilha(arquivo: File): Promise<{ tabela: Celula[][] } | { erro: string }> {
  const nome = arquivo.name.toLowerCase();
  if (arquivo.size === 0) return { erro: "Escolha o arquivo da planilha." };
  if (arquivo.size > TAMANHO_MAXIMO_PLANILHA) return { erro: "O arquivo passa de 1 MB. Divida a planilha em partes menores." };
  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  if (nome.endsWith(".csv")) return { tabela: lerCsv(decodificarCsv(bytes)) };

  if (nome.endsWith(".xlsx")) {
    try {
      let total = 0;
      // Só lê o "índice" do zip (tamanho de cada parte), sem descompactar nada
      unzipSync(bytes, {
        filter: (f) => {
          total += f.originalSize;
          return false;
        },
      });
      if (total > DESCOMPACTADO_MAXIMO) return { erro: "A planilha é grande demais. Divida em partes menores." };

      const abas = await readXlsxFile(Buffer.from(bytes));
      const aba = abas.find((a) => a.sheet === ABA_PRODUTOS) ?? abas[0];
      if (!aba) return { erro: "A planilha não tem nenhuma aba." };
      return { tabela: aba.data.map((linha) => linha.map((c) => (c instanceof Date ? c.toISOString() : (c as Celula)))) };
    } catch {
      return { erro: "Não conseguimos abrir este arquivo. Confira se é uma planilha do Excel (.xlsx) ou CSV." };
    }
  }

  if (nome.endsWith(".xls") || nome.endsWith(".ods")) {
    return { erro: "Este formato não é aceito. No Excel, use Arquivo → Salvar como → Pasta de Trabalho do Excel (.xlsx)." };
  }
  return { erro: "Envie um arquivo .xlsx (Excel) ou .csv." };
}

// -----------------------------------------------------------------------------
// Modelo para baixar: já vem preenchido com os produtos da loja
// -----------------------------------------------------------------------------

type OfertaDoModelo = {
  productId: string;
  packageLabel: string;
  baseQuantity: number;
  priceCents: number;
  brand: string | null;
  active: boolean;
  quantityStep: number;
  tiersForCpf: boolean;
  tiers: { minQuantity: number; priceCents: number }[];
  product: { name: string; baseUnit: string };
  catalogItem?: { ean: string | null; brand: string; model: string } | null;
};
type MaterialDoModelo = { id: string; name: string; category: string; baseUnit: string; brandMatters: boolean };
type ItemDoModelo = {
  ean: string | null;
  brand: string;
  model: string;
  packageLabel: string;
  productId: string;
  product: { name: string };
};

const unidade = (u: string) => UNIDADES_BASE[u as UnidadeBase] ?? u;

/** Uma linha por produto da loja, na ordem das COLUNAS (preço: número ou texto, conforme o formato) */
function linhasDosProdutos(ofertas: OfertaDoModelo[], preco: (c: number) => number | string) {
  return ofertas.map((o) => {
    const faixas = [...o.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    const item = o.catalogItem;
    const valores: Record<string, string | number> = {
      codigo: o.productId,
      ean: item?.ean ?? "",
      material: item ? `${o.product.name} — ${item.brand} ${item.model}` : o.product.name,
      embalagem: o.packageLabel,
      quantidade: o.baseQuantity,
      unidade: unidade(o.product.baseUnit),
      preco: preco(o.priceCents),
      marca: o.brand ?? "",
      disponivel: o.active ? "sim" : "não",
      fracao: o.quantityStep,
      atacadoCpf: o.tiersForCpf ? "sim" : "não",
    };
    faixas.slice(0, FAIXAS_NA_PLANILHA).forEach((f, i) => {
      valores[`faixa${i + 1}Min`] = f.minQuantity;
      valores[`faixa${i + 1}Preco`] = preco(f.priceCents);
    });
    return COLUNAS.map((c) => valores[c.chave] ?? "");
  });
}

const COLUNAS_DE_PRECO = new Set(COLUNAS.map((c, i) => (c.chave === "preco" || c.chave.endsWith("Preco") ? i : -1)));

export async function gerarModeloXlsx(ofertas: OfertaDoModelo[], materiais: MaterialDoModelo[], itens: ItemDoModelo[] = []): Promise<Buffer> {
  const negrito = (value: string) => ({ value, fontWeight: "bold" as const, backgroundColor: "#FFEDD5" });
  const produtos = [
    COLUNAS.map((c) => negrito(c.titulo)),
    ...linhasDosProdutos(ofertas, (c) => c / 100).map((linha) =>
      linha.map((v, i) =>
        typeof v === "number" && COLUNAS_DE_PRECO.has(i)
          ? { value: v, format: "#,##0.00" }
          : COLUNAS[i].chave === "ean" && v
            ? { value: String(v), type: String } // código de barras como texto (o Excel não estraga os zeros)
            : v,
      ),
    ),
  ];
  const instrucoes = [
    [negrito("Como preencher")],
    ["1. Na aba Produtos, altere preços, disponibilidade e atacado, ou acrescente linhas."],
    ["2. Produto de MARCA (martelo, tinta, piso…): basta o código de barras e o preço — marca, modelo e embalagem vêm do catálogo (aba Produtos de marca)."],
    ["3. Material padronizado (cimento, areia…): copie o código da aba Materiais e informe embalagem e quantidade."],
    ["4. Salve como .xlsx e envie no painel da loja: Produtos → Importar planilha."],
    ["5. Antes de gravar, o Solid mostra o resumo do que vai mudar e os erros, linha por linha."],
    ["Produtos que não estiverem na planilha continuam como estão (nada é apagado)."],
    ["Produto de marca que não está no catálogo? Use \"Sugerir material\" no painel, com marca, modelo e código de barras."],
    [""],
    [negrito("Coluna"), negrito("O que colocar")],
    ...COLUNAS.map((c) => [c.titulo + (c.obrigatoria ? " (obrigatória)" : ""), c.ajuda]),
  ];
  const catalogo = [
    [negrito("codigo"), negrito("material"), negrito("categoria"), negrito("unidade de comparação"), negrito("produto de marca?")],
    ...materiais.map((m) => [m.id, m.name, m.category, unidade(m.baseUnit), m.brandMatters ? "sim (use o código de barras)" : "não"]),
  ];
  const deMarca = [
    [negrito("codigo_barras"), negrito("marca"), negrito("modelo"), negrito("embalagem"), negrito("codigo"), negrito("tipo de produto")],
    ...itens.map((i) => [i.ean ? { value: i.ean, type: String } : "", i.brand, i.model, i.packageLabel, i.productId, i.product.name]),
  ];
  const coluna = (width: number) => ({ width });
  return writeXlsxFile([
    {
      sheet: ABA_PRODUTOS,
      data: produtos,
      stickyRowsCount: 1,
      columns: COLUNAS.map((c) => coluna(c.chave === "material" ? 40 : c.chave === "ean" ? 17 : 14)),
    },
    { sheet: "Instrucoes", data: instrucoes, columns: [coluna(28), coluna(110)] },
    { sheet: "Materiais", data: catalogo, stickyRowsCount: 1, columns: [24, 44, 28, 22, 26].map(coluna) },
    { sheet: "Produtos de marca", data: deMarca, stickyRowsCount: 1, columns: [17, 24, 30, 16, 22, 34].map(coluna) },
  ]).toBuffer();
}

export function gerarModeloCsv(ofertas: OfertaDoModelo[]): string {
  // Números com vírgula (0,5 / 2,5), como o Excel brasileiro espera
  const linhas = linhasDosProdutos(ofertas, centavosParaCsv).map((l) =>
    l.map((v) => (typeof v === "number" ? String(v).replace(".", ",") : v)),
  );
  return gerarCsv([COLUNAS.map((c) => c.titulo), ...linhas]);
}

// -----------------------------------------------------------------------------
// Modelo do CATÁLOGO DE MARCA (administrador)
// -----------------------------------------------------------------------------

type TipoDoModelo = { id: string; name: string; specTemplate: string };
type ItemCompletoDoModelo = ItemDoModelo & { baseQuantity: number; specs: string };

export async function gerarModeloCatalogoXlsx(tipos: TipoDoModelo[], itens: ItemCompletoDoModelo[]): Promise<Buffer> {
  const negrito = (value: string) => ({ value, fontWeight: "bold" as const, backgroundColor: "#FFEDD5" });
  const titulos = [...COLUNAS_CATALOGO.map((c) => c.titulo), ...COLUNAS_CARACTERISTICAS];
  const comoTexto = (v: unknown) => (v === true ? "sim" : v === false ? "não" : v ?? "");
  const linhas = itens.map((i) => {
    const specs = lerCaracteristicas(i.specs);
    return [
      i.productId,
      i.brand,
      i.model,
      i.ean ? { value: i.ean, type: String } : "",
      i.packageLabel,
      i.baseQuantity,
      ...COLUNAS_CARACTERISTICAS.map((c) => comoTexto(specs[c.slice(PREFIXO_CARACTERISTICA.length)]) as string | number),
    ];
  });
  const tiposAba = [
    [negrito("tipo"), negrito("nome"), negrito("colunas de características deste tipo")],
    ...tipos.map((t) => [
      t.id,
      t.name,
      (modeloDe(t.specTemplate)?.campos ?? [])
        .map((c) => `${PREFIXO_CARACTERISTICA}${c.chave}${c.opcoes ? ` (${c.opcoes.join(" / ")})` : c.tipo === "simnao" ? " (sim / não)" : c.unidade ? ` (${c.unidade})` : ""}`)
        .join("; "),
    ]),
  ];
  const instrucoes = [
    [negrito("Como preencher")],
    ["Uma linha por produto. O código de barras identifica o produto: se já existir no catálogo, ele é ATUALIZADO."],
    ["Características em branco ficam como estão (não apagam o que já foi cadastrado)."],
    ["Preencha só as colunas de características do tipo do produto (veja a aba Tipos); as outras são ignoradas."],
    ["Só informações objetivas do fabricante (medidas, materiais, garantia). Nada de avaliações."],
    ["Fotos não vão na planilha: depois da importação, envie cada foto na página do produto."],
    [""],
    [negrito("Coluna"), negrito("O que colocar")],
    ...COLUNAS_CATALOGO.map((c) => [`${c.titulo} (obrigatória)`, c.ajuda]),
    ["carac_…", "Características (veja a aba Tipos)."],
  ];
  return writeXlsxFile([
    { sheet: "Produtos de marca", data: [titulos.map(negrito), ...linhas], stickyRowsCount: 1, columns: titulos.map((t) => ({ width: Math.max(14, t.length + 2) })) },
    { sheet: "Tipos", data: tiposAba, stickyRowsCount: 1, columns: [{ width: 22 }, { width: 34 }, { width: 120 }] },
    { sheet: "Instrucoes", data: instrucoes, columns: [{ width: 26 }, { width: 110 }] },
  ]).toBuffer();
}
