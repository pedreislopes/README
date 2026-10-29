import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import writeXlsxFile from "write-excel-file/node";
import { db, entrar, principal, semRolagemLateral } from "./ajuda";

/** Uma imagem PNG de teste (fundo branco com um quadrado laranja) */
const imagemPng = () =>
  sharp({ create: { width: 600, height: 600, channels: 3, background: "#ffffff" } })
    .composite([{ input: { create: { width: 300, height: 300, channels: 3, background: "#ea580c" } }, left: 150, top: 150 }])
    .png()
    .toBuffer();

const esperarFotoCarregada = (page: Page, nome: RegExp) =>
  expect
    .poll(() => principal(page).getByRole("button", { name: nome }).first().locator("img").evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0))
    .toBe(true);

test.describe("Comparação de produtos de marca (cliente)", () => {
  test("filtro por marca na busca", async ({ page }) => {
    await page.goto("/busca?q=martelo");
    await principal(page).locator("summary", { hasText: "Filtros" }).click();
    await principal(page).getByLabel("Marca").selectOption("Forja Cerrado");
    await principal(page).getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/marca=Forja/);
    const ofertas = principal(page).locator("article");
    await expect(ofertas.first()).toBeVisible();
    for (const texto of await ofertas.allInnerTexts()) expect(texto).toContain("Forja Cerrado");
  });

  test("página do produto: mais barato de cada marca e filtro por marca", async ({ page }) => {
    await page.goto("/produto/martelo-unha");
    const porMarca = principal(page).getByRole("region", { name: "Mais barato de cada marca" });
    await expect(porMarca.getByRole("listitem")).toHaveCount(4);
    await expect(porMarca.getByRole("listitem").first().getByText("Melhor preço")).toBeVisible();
    // Preços em ordem crescente
    const precos = (await porMarca.getByRole("listitem").allInnerTexts()).map((t) => Number(t.match(/R\$\s*([\d.,]+)/)![1].replace(".", "").replace(",", ".")));
    expect(precos).toEqual([...precos].sort((a, b) => a - b));

    await principal(page).getByRole("navigation", { name: "Filtrar por marca" }).getByRole("link", { name: "Aço Candango" }).click();
    await expect(page).toHaveURL(/marca=A%C3%A7o\+Candango|marca=A%C3%A7o%20Candango/);
    const ofertas = principal(page).getByRole("region", { name: /Todas as ofertas/ }).locator("article");
    for (const texto of await ofertas.allInnerTexts()) expect(texto).toContain("Aço Candango");
    await semRolagemLateral(page);
  });

  test("compara 2 a 3 produtos lado a lado; o que falta aparece como 'Não informado'", async ({ page }) => {
    await page.goto("/produto/martelo-unha");
    const comparar = principal(page).getByRole("button", { name: /para comparar|lado a lado/ });
    await expect(comparar).toBeDisabled();
    const caixas = principal(page).getByRole("checkbox", { name: "Comparar" });
    await expect(caixas).toHaveCount(4);
    for (let i = 0; i < 3; i++) await caixas.nth(i).check();
    await expect(caixas.nth(3)).toBeDisabled(); // no máximo 3
    // A Planalto Tools (sem características preenchidas) entra na comparação
    await caixas.nth(2).uncheck();
    await caixas.nth(3).check();
    await principal(page).getByRole("button", { name: "Comparar 3 produtos lado a lado" }).click();
    await expect(page).toHaveURL(/\/comparar\?item=.+&item=.+&item=/);

    const tabela = principal(page).getByRole("table");
    await expect(tabela.getByRole("columnheader")).toHaveCount(3);
    for (const linha of ["Menor preço", "Peso da cabeça", "Material do cabo", "Comprimento", "Garantia"]) {
      await expect(tabela.getByRole("columnheader", { name: linha }).or(tabela.locator("th", { hasText: linha })).first()).toBeVisible();
    }
    await expect(tabela.getByText("Não informado").first()).toBeVisible();
    await expect(tabela.getByText("500 g")).toBeVisible(); // Aço Candango
    await expect(tabela.getByText("480 g")).toBeVisible(); // Planalto Tools
    await semRolagemLateral(page); // cabe no celular de 360 px
    // Nada de avaliação de qualidade, só dados objetivos
    expect(await principal(page).innerText()).not.toMatch(/melhor marca|qualidade superior|recomendad/i);
  });

  test("tintas: custo por m² pintado (preço ÷ rendimento)", async ({ page }) => {
    const itens = await db.catalogItem.findMany({ where: { productId: "tinta-acrilica-18" }, include: { offers: { where: { store: { status: "APROVADA" } } } } });
    const premium = itens.find((i) => i.model === "Acrílica Premium fosca")!;
    const economica = itens.find((i) => i.model === "Acrílica Econômica fosca")!;
    await page.goto(`/comparar?item=${economica.id}&item=${premium.id}`);
    const menor = Math.min(...premium.offers.map((o) => o.priceCents));
    const custo = (Math.round(menor / 380) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\s/g, " ");
    await expect(principal(page).locator("th", { hasText: "Custo por m² pintado" })).toBeVisible();
    await expect(principal(page).getByText(`${custo}/m²`)).toBeVisible();
    await expect(principal(page).getByText("380 m²")).toBeVisible();
  });

  test("comparação recusa produtos de tipos diferentes", async ({ page }) => {
    const [martelo, tinta] = await Promise.all([
      db.catalogItem.findFirstOrThrow({ where: { productId: "martelo-unha" } }),
      db.catalogItem.findFirstOrThrow({ where: { productId: "tinta-acrilica-18" } }),
    ]);
    await page.goto(`/comparar?item=${martelo.id}&item=${tinta.id}`);
    await expect(principal(page).getByRole("alert")).toContainText("Compare produtos do mesmo tipo");
  });

  test("foto do produto abre ampliada; sem foto, aparece a ilustração da categoria", async ({ page }) => {
    await page.goto("/produto/tinta-acrilica-18");
    await esperarFotoCarregada(page, /Ampliar foto: Pinta Brasília/);
    await principal(page).getByRole("button", { name: /Ampliar foto: Pinta Brasília/ }).first().click();
    const janela = page.getByRole("dialog", { name: /Pinta Brasília/ });
    await expect(janela).toBeVisible();
    await janela.getByRole("button", { name: "Fechar foto" }).click();
    await expect(janela).toBeHidden();
    // Item sem foto: ilustração da categoria
    await expect(principal(page).getByRole("img", { name: /Acrílica Premium acetinada \(sem foto: ilustração da categoria Tintas\)/ }).first()).toBeVisible();
  });

  test("fotos: públicas são entregues otimizadas (WebP); fotos aguardando aprovação não aparecem", async ({ page }) => {
    const publica = await db.photo.findFirstOrThrow({ where: { public: true } });
    const r = await page.request.get(`/fotos/${publica.id}?t=mini`);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/webp");
    const pendente = await db.photoSubmission.findFirstOrThrow({ where: { status: "PENDENTE" } });
    expect((await page.request.get(`/fotos/${pendente.photoId}`)).status()).toBe(404);
  });
});

test.describe("Produtos de marca (lojista)", () => {
  test.beforeEach(async ({ page }) => entrar(page, "lojista@teste.com"));

  test("cadastra pelo código de barras: só preço e disponibilidade", async ({ page }) => {
    const vendidos = (await db.offer.findMany({ where: { storeId: "taguatinga", catalogItemId: { not: null } } })).map((o) => o.catalogItemId!);
    const item = await db.catalogItem.findFirstOrThrow({ where: { id: { notIn: vendidos }, ean: { not: null } }, include: { product: true } });
    await page.goto("/loja/produtos/novo");
    await page.getByLabel(/Digite o código de barras/).fill(item.ean!);
    await expect(page.getByLabel("Produto (marca e modelo)")).toHaveValue(item.id);
    await expect(page.getByText(`Embalagem: ${item.packageLabel}`)).toBeVisible();
    await page.getByLabel("Preço (R$)").fill("77,70");
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await page.waitForURL(/salvo=1/);
    const oferta = await db.offer.findFirstOrThrow({ where: { storeId: "taguatinga", catalogItemId: item.id } });
    expect(oferta).toMatchObject({ priceCents: 7770, brand: item.brand, packageLabel: item.packageLabel, productId: item.productId });
  });

  test("planilha só com código de barras e preço identifica o produto", async ({ page }) => {
    const oferta = await db.offer.findFirstOrThrow({ where: { storeId: "taguatinga", catalogItemId: { not: null } }, include: { catalogItem: true } });
    const csv = `codigo_barras;preco\r\n${oferta.catalogItem!.ean};${((oferta.priceCents + 150) / 100).toFixed(2).replace(".", ",")}\r\n2000000009995;10\r\n`;
    await page.goto("/loja/importar");
    await principal(page).getByLabel(/Planilha preenchida/).setInputFiles({ name: "marcas.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    await page.waitForURL(/\/loja\/importar\/\w+$/);
    await expect(principal(page).getByText(`${oferta.catalogItem!.brand} ${oferta.catalogItem!.model}`)).toBeVisible();
    await expect(principal(page).getByText(/ainda não está no catálogo Solid/)).toBeVisible();
    await principal(page).getByRole("button", { name: "Confirmar e salvar 1 alteração" }).click();
    await expect(principal(page).getByText(/Importação aplicada em/)).toBeVisible();
    expect((await db.offer.findUniqueOrThrow({ where: { id: oferta.id } })).priceCents).toBe(oferta.priceCents + 150);
  });

  test("sugere produto de marca com marca, modelo e código de barras", async ({ page }) => {
    await page.goto("/loja/sugerir?tipo=marca&material=trena-5m");
    await expect(page.getByRole("radio", { name: "Produto de marca" })).toHaveAttribute("aria-checked", "true");
    await page.getByLabel("Marca").fill("Medida Certa");
    await page.getByLabel("Modelo").fill("TR8 longa");
    await page.getByLabel("Código de barras (EAN)").fill("2000000000014");
    await page.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(page.getByText(/Código de barras inválido/)).toBeVisible();
    const existente = await db.catalogItem.findFirstOrThrow({ where: { ean: { not: null } } });
    await page.getByLabel("Código de barras (EAN)").fill(existente.ean!);
    await page.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(page.getByText(/já está no catálogo/)).toBeVisible();
    await page.getByLabel("Código de barras (EAN)").fill("2000000008882");
    await page.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(page.getByText("Sugestão enviada!")).toBeVisible();
    await expect(principal(page).locator("li", { hasText: "Medida Certa TR8 longa" }).getByText("Em análise")).toBeVisible();
  });

  test("envia foto de produto sem foto; só aparece depois da aprovação", async ({ page, browser }) => {
    const item = await db.catalogItem.findFirstOrThrow({ where: { photoId: null, photoSubmissions: { none: {} }, productId: "trena-5m" } });
    await page.goto(`/loja/foto/${item.id}`);
    // Formato não aceito: erro antes de enviar
    await page.getByLabel(/Foto do produto/).setInputFiles({ name: "foto.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
    await expect(page.getByText(/Formato não aceito/)).toBeVisible();
    await page.getByLabel(/Foto do produto/).setInputFiles({ name: "trena.png", mimeType: "image/png", buffer: await imagemPng() });
    await expect(page.getByRole("img", { name: "Prévia da foto escolhida" })).toBeVisible();
    await page.getByLabel("Origem da imagem").selectOption("Foto própria da loja");
    await page.getByLabel("Autorização de uso").fill("Tirada pela equipe da loja");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enviar foto para aprovação" }).click();
    await page.waitForURL(/foto=1/);
    const envio = await db.photoSubmission.findFirstOrThrow({ where: { catalogItemId: item.id }, include: { photo: true } });
    expect(envio.photo.public).toBe(false);
    expect(envio.photo.width).toBeLessThanOrEqual(1200);

    // Antes da aprovação: o site não mostra
    await page.goto("/produto/trena-5m");
    await expect(principal(page).getByRole("button", { name: new RegExp(`Ampliar foto: ${item.brand} ${item.model}`) })).toHaveCount(0);

    // Administrador aprova
    const admin = await (await browser.newContext()).newPage();
    await entrar(admin, "admin@teste.com");
    await admin.goto("/admin/catalogo");
    const cartao = principal(admin).locator("article", { hasText: `${item.brand} ${item.model}` });
    await cartao.getByRole("button", { name: "Aprovar foto" }).click();
    await expect(cartao).toHaveCount(0);

    await page.goto("/produto/trena-5m");
    await esperarFotoCarregada(page, new RegExp(`Ampliar foto: ${item.brand} ${item.model}`));
  });
});

test.describe("Catálogo de marca (administrador)", () => {
  test.beforeEach(async ({ page }) => entrar(page, "admin@teste.com"));

  test("completa uma sugestão de produto de marca com características e foto", async ({ page }) => {
    await page.goto("/admin/materiais");
    const sugestao = principal(page).locator("div", { hasText: "Forja Cerrado MU-29 fibra" }).filter({ has: page.getByRole("link", { name: "Completar e aprovar" }) }).last();
    await sugestao.getByRole("link", { name: "Completar e aprovar" }).click();
    await expect(page.getByLabel("Marca", { exact: true })).toHaveValue("Forja Cerrado");
    await expect(page.getByLabel("Embalagem", { exact: true })).toHaveValue("Unidade");
    await page.getByLabel(/Peso da cabeça/).fill("620");
    await page.getByLabel("Material do cabo").selectOption("Fibra de vidro");
    await page.getByLabel(/^Foto \(opcional\)$/).setInputFiles({ name: "mu29.png", mimeType: "image/png", buffer: await imagemPng() });
    await page.getByRole("button", { name: "Salvar produto de marca" }).click();
    await expect(page.getByText("Com foto, informe a origem da imagem e a autorização de uso.")).toBeVisible();
    await page.getByLabel(/^Foto \(opcional\)$/).setInputFiles({ name: "mu29.png", mimeType: "image/png", buffer: await imagemPng() });
    await page.getByLabel("Origem da imagem").fill("Kit oficial do fabricante");
    await page.getByLabel("Autorização de uso").fill("Kit enviado pelo fabricante por e-mail");
    await page.getByRole("button", { name: "Salvar produto de marca" }).click();
    await page.waitForURL(/\/admin\/catalogo\?salvo=/);

    const item = await db.catalogItem.findFirstOrThrow({ where: { model: "MU-29 fibra" } });
    expect(JSON.parse(item.specs)).toEqual({ peso_cabeca: 620, material_cabo: "Fibra de vidro" });
    expect(item.photoSource).toBe("Kit oficial do fabricante");
    expect((await db.materialSuggestion.findFirstOrThrow({ where: { model: "MU-29 fibra" } })).status).toBe("APROVADA");
    await page.goto("/admin/registro");
    await expect(principal(page).getByText(/Martelo de unha 27 mm: Forja Cerrado MU-29 fibra/).first()).toBeVisible();
  });

  test("importa planilha do catálogo: prévia com erros por linha e confirmação", async ({ page }) => {
    const existente = await db.catalogItem.findFirstOrThrow({ where: { productId: "disjuntor-20a", ean: { not: null } } });
    const resposta = await page.request.get("/admin/catalogo/importar/modelo");
    expect(resposta.status()).toBe(200);
    const linhas = [
      ["tipo", "marca", "modelo", "codigo_barras", "embalagem", "qtd_na_embalagem", "carac_inmetro", "carac_garantia_meses"],
      ["disjuntor-20a", existente.brand, existente.model, existente.ean!, existente.packageLabel, 1, "sim", 24],
      ["disjuntor-20a", "Nova Marca Elétrica", "NM-20", "2000000007779", "Unidade", 1, "sim", 12],
      ["disjuntor-20a", "Sem Código", "X", "", "Unidade", 1, "", ""],
    ];
    const arquivo = await writeXlsxFile(linhas).toBuffer();
    await page.goto("/admin/catalogo/importar");
    await principal(page).getByLabel(/Planilha do catálogo/).setInputFiles({
      name: "fabricante.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: arquivo,
    });
    await principal(page).getByRole("button", { name: "Ver o que vai mudar" }).click();
    await page.waitForURL(/\/admin\/catalogo\/importar\/\w+$/);
    await expect(principal(page).getByRole("status")).toHaveText("1 produto novo, 1 produto atualizado, 1 erro");
    await expect(principal(page).getByText(/Linha 4/)).toBeVisible();
    await expect(principal(page).getByText(/Código de barras "" inválido/)).toBeVisible();
    await principal(page).getByRole("button", { name: "Confirmar e salvar 2 produtos" }).click();
    await expect(principal(page).getByText("Aplicada")).toBeVisible();
    expect(JSON.parse((await db.catalogItem.findUniqueOrThrow({ where: { id: existente.id } })).specs).garantia_meses).toBe(24);
    expect(await db.catalogItem.count({ where: { ean: "2000000007779" } })).toBe(1);
  });
});
