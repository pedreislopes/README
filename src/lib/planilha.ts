// =============================================================================
// Arquivos de planilha da importação de produtos: ler o que o lojista envia
// (Excel .xlsx ou CSV) e gerar o modelo para baixar.
// As regras (o que muda, erros por linha) ficam em src/domain/importacao.ts.
// =============================================================================

import { unzipSync } from "fflate";
import readXlsxFile from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { UNIDADES_BASE, type UnidadeBase } from "@/config/constantes";
import { COLUNAS, decodificarCsv, lerCsv, type Celula } from "@/domain/importacao";
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
};
type MaterialDoModelo = { id: string; name: string; category: string; baseUnit: string; brandMatters: boolean };

const unidade = (u: string) => UNIDADES_BASE[u as UnidadeBase] ?? u;

/** Uma linha por produto da loja; preços como número (o Excel mostra "38,90") */
function linhasDosProdutos(ofertas: OfertaDoModelo[], preco: (c: number) => number | string) {
  return ofertas.map((o) => {
    const faixas = [...o.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    return [
      o.productId,
      o.product.name,
      o.packageLabel,
      o.baseQuantity,
      unidade(o.product.baseUnit),
      preco(o.priceCents),
      o.brand ?? "",
      o.active ? "sim" : "não",
      o.quantityStep,
      o.tiersForCpf ? "sim" : "não",
      ...COLUNAS.slice(10).map((_, i) => {
        const f = faixas[Math.floor(i / 2)];
        if (!f) return "";
        return i % 2 === 0 ? f.minQuantity : preco(f.priceCents);
      }),
    ];
  });
}

export async function gerarModeloXlsx(ofertas: OfertaDoModelo[], materiais: MaterialDoModelo[]): Promise<Buffer> {
  const negrito = (value: string) => ({ value, fontWeight: "bold" as const, backgroundColor: "#FFEDD5" });
  const produtos = [
    COLUNAS.map((c) => negrito(c.titulo)),
    ...linhasDosProdutos(ofertas, (c) => c / 100).map((linha) =>
      linha.map((v, i) => (typeof v === "number" && [5, 11, 13, 15].includes(i) ? { value: v, format: "#,##0.00" } : v)),
    ),
  ];
  const instrucoes = [
    [negrito("Como preencher")],
    ["1. Na aba Produtos, altere preços, marca, disponibilidade e atacado, ou acrescente linhas."],
    ["2. Para incluir um material novo, copie o código da aba Materiais (coluna A)."],
    ["3. Salve como .xlsx e envie no painel da loja: Produtos → Importar planilha."],
    ["4. Antes de gravar, o Solid mostra o resumo do que vai mudar e os erros, linha por linha."],
    ["Produtos que não estiverem na planilha continuam como estão (nada é apagado)."],
    [""],
    [negrito("Coluna"), negrito("O que colocar")],
    ...COLUNAS.map((c) => [c.titulo + (c.obrigatoria ? " (obrigatória)" : ""), c.ajuda]),
  ];
  const catalogo = [
    [negrito("codigo"), negrito("material"), negrito("categoria"), negrito("unidade de comparação"), negrito("marca obrigatória?")],
    ...materiais.map((m) => [m.id, m.name, m.category, unidade(m.baseUnit), m.brandMatters ? "sim" : "não"]),
  ];
  const coluna = (width: number) => ({ width });
  return writeXlsxFile([
    { sheet: ABA_PRODUTOS, data: produtos, stickyRowsCount: 1, columns: [22, 34, 16, 16, 10, 10, 14, 10, 13, 16, 17, 12, 17, 12, 17, 12].map(coluna) },
    { sheet: "Instrucoes", data: instrucoes, columns: [coluna(28), coluna(100)] },
    { sheet: "Materiais", data: catalogo, stickyRowsCount: 1, columns: [24, 44, 28, 22, 18].map(coluna) },
  ]).toBuffer();
}

export function gerarModeloCsv(ofertas: OfertaDoModelo[]): string {
  // Números com vírgula (0,5 / 2,5), como o Excel brasileiro espera
  const linhas = linhasDosProdutos(ofertas, centavosParaCsv).map((l) =>
    l.map((v) => (typeof v === "number" ? String(v).replace(".", ",") : v)),
  );
  return gerarCsv([COLUNAS.map((c) => c.titulo), ...linhas]);
}
