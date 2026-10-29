import { expect, test } from "@playwright/test";
import readXlsxFile from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { db, entrar, principal, semRolagemLateral } from "./ajuda";

test.describe("Importação de produtos por planilha", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, "lojista@teste.com");
  });

  test("modelo Excel vem com os produtos da loja; envio mostra a prévia e só grava ao confirmar", async ({ page }) => {
    await page.goto("/loja/produtos");
    await page.getByRole("link", { name: /Importar planilha/ }).click();
    await expect(page).toHaveURL("/loja/importar");
    await semRolagemLateral(page);

    // 1. Baixa o modelo (Excel) já preenchido
    const resposta = await page.request.get("/loja/importar/modelo?formato=xlsx");
    expect(resposta.status()).toBe(200);
    const abas = await readXlsxFile(Buffer.from(await resposta.body()));
    expect(abas.map((a) => a.sheet)).toEqual(["Produtos", "Instrucoes", "Materiais"]);
    const [cabecalho, ...linhas] = abas[0].data;
    const col = (nome: string) => cabecalho.indexOf(nome);
    const totalDaLoja = await db.offer.count({ where: { storeId: "taguatinga" } });
    expect(linhas).toHaveLength(totalDaLoja);

    // 2. Altera um preço, inclui um material novo e erra uma linha
    const cimento = linhas.find((l) => l[col("codigo")] === "cimento-cp2" && l[col("embalagem")] === "Saco 50 kg")!;
    const precoAntes = cimento[col("preco")] as number;
    cimento[col("preco")] = precoAntes + 1;
    const vendidos = new Set(linhas.map((l) => l[col("codigo")]));
    const novo = (await db.product.findMany({ where: { brandMatters: false } })).find((p) => !vendidos.has(p.id))!;
    const linhaNova = cabecalho.map(() => null as string | number | null);
    linhaNova[col("codigo")] = novo.id;
    linhaNova[col("embalagem")] = "Unidade";
    linhaNova[col("qtd_na_embalagem")] = 1;
    linhaNova[col("preco")] = 12.5;
    const linhaErrada = cabecalho.map(() => null as string | number | null);
    linhaErrada[col("codigo")] = "material-que-nao-existe";
    linhaErrada[col("embalagem")] = "Unidade";
    linhaErrada[col("qtd_na_embalagem")] = 1;
    linhaErrada[col("preco")] = 10;
    const dados = [cabecalho, ...linhas, linhaNova, linhaErrada] as (string | number | null)[][];
    const arquivo = await writeXlsxFile(dados.map((l) => l.map((c) => (c === null ? null : c)))).toBuffer();

    await principal(page).getByLabel(/Planilha preenchida/).setInputFiles({
      name: "precos-novembro.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: arquivo,
    });
    await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    await page.waitForURL(/\/loja\/importar\/\w+$/);

    // 3. Prévia: resumo em números e erros linha por linha; nada gravado ainda
    const resumo = principal(page).getByRole("region", { name: "Resumo" });
    await expect(resumo).toContainText("1 preço alterado");
    await expect(resumo).toContainText("1 produto novo");
    await expect(resumo).toContainText("1 erro");
    const linhaDoErro = linhas.length + 3; // cabeçalho + produtos + linha nova
    await expect(principal(page).getByText(`Linha ${linhaDoErro}`)).toBeVisible();
    await expect(principal(page).getByText(/"material-que-nao-existe" não existe no catálogo/)).toBeVisible();
    await expect(principal(page).getByText(/Preço: R\$ \d+,\d{2} → R\$ \d+,\d{2}/)).toBeVisible();
    const naoGravado = await db.offer.findFirstOrThrow({ where: { storeId: "taguatinga", productId: "cimento-cp2", packageLabel: "Saco 50 kg" } });
    expect(naoGravado.priceCents).toBe(Math.round(precoAntes * 100));
    await semRolagemLateral(page);

    // 4. Confirma: grava as linhas certas e registra no histórico
    await principal(page).getByRole("button", { name: "Confirmar e salvar 2 alterações" }).click();
    await expect(principal(page).getByText(/Importação aplicada em/)).toBeVisible();
    const gravado = await db.offer.findFirstOrThrow({ where: { id: naoGravado.id } });
    expect(gravado.priceCents).toBe(Math.round(precoAntes * 100) + 100);
    expect(await db.offer.count({ where: { storeId: "taguatinga", productId: novo.id } })).toBe(1);

    await page.goto("/loja/importar");
    const historico = principal(page).locator("li", { hasText: "precos-novembro.xlsx" });
    await expect(historico.getByText("Aplicada")).toBeVisible();
    await expect(historico.getByText(/Carlos Mendes · 1 preço alterado, 1 produto novo/)).toBeVisible();
  });

  test("CSV do Excel brasileiro (ponto e vírgula); descartar não grava nada", async ({ page }) => {
    const csv = "codigo;embalagem;qtd_na_embalagem;preco;disponivel\r\ncimento-cp2;Saco 50 kg;50;99,90;sim\r\nareia-media;m³;1;;sim\r\n";
    await page.goto("/loja/importar");
    await principal(page).getByLabel(/Planilha preenchida/).setInputFiles({ name: "teste.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    await page.waitForURL(/\/loja\/importar\/\w+$/);
    await expect(principal(page).getByText("Informe o preço.")).toBeVisible(); // linha 3 sem preço
    await principal(page).getByRole("button", { name: "Descartar e enviar outra planilha" }).click();
    await page.waitForURL("/loja/importar");
    await expect(principal(page).locator("li", { hasText: "teste.csv" }).getByText("Descartada")).toBeVisible();
    const cimento = await db.offer.findFirstOrThrow({ where: { storeId: "taguatinga", productId: "cimento-cp2", packageLabel: "Saco 50 kg" } });
    expect(cimento.priceCents).not.toBe(9990);
  });

  test("arquivo em formato errado e planilha sem colunas obrigatórias mostram erro claro", async ({ page }) => {
    await page.goto("/loja/importar");
    const enviar = async (name: string, conteudo: string) => {
      await principal(page).getByLabel(/Planilha preenchida/).setInputFiles({ name, mimeType: "application/octet-stream", buffer: Buffer.from(conteudo) });
      await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    };
    await enviar("antiga.xls", "x");
    await expect(principal(page).getByText(/Este formato não é aceito/)).toBeVisible();
    await enviar("errada.csv", "produto;valor\r\ncimento;10\r\n");
    await expect(principal(page).getByText(/Faltam colunas na 1ª linha da planilha: codigo, embalagem, qtd_na_embalagem, preco/)).toBeVisible();
    await enviar("falsa.xlsx", "isto não é um Excel");
    await expect(principal(page).getByText(/Não conseguimos abrir este arquivo/)).toBeVisible();
  });

  test("uma loja não vê a importação de outra loja", async ({ page, browser }) => {
    await page.goto("/loja/importar");
    await principal(page).getByLabel(/Planilha preenchida/).setInputFiles({
      name: "privada.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("codigo;embalagem;qtd_na_embalagem;preco\r\ncimento-cp2;Saco 50 kg;50;40\r\n"),
    });
    await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    await page.waitForURL(/\/loja\/importar\/\w+$/);
    const endereco = new URL(page.url()).pathname;

    const outra = await (await browser.newContext()).newPage();
    await entrar(outra, "ceilandia@teste.com");
    const r = await outra.goto(endereco);
    expect(r?.status()).toBe(404);
    // E o modelo baixado por ela só tem os produtos dela
    const modelo = await outra.request.get("/loja/importar/modelo?formato=csv");
    const texto = await modelo.text();
    expect(texto.trim().split("\r\n").length - 1).toBe(await db.offer.count({ where: { storeId: "ceilandia" } }));
  });
});
