import { expect, test } from "@playwright/test";
import { entrar, principal, semRolagemLateral } from "./ajuda";

test.describe("Explicação dos materiais e guias", () => {
  test('ícone "?" explica o material na busca, na página do produto e na calculadora', async ({ page }) => {
    await page.goto("/busca?q=areia+fina");
    const ajuda = principal(page).getByRole("button", { name: "O que é Areia fina?" });
    await expect(ajuda).toHaveAttribute("aria-expanded", "false");
    await ajuda.click();
    await expect(ajuda).toHaveAttribute("aria-expanded", "true");
    await expect(principal(page).getByText("Reboco e acabamento de paredes")).toBeVisible();
    await expect(principal(page).getByText(/Explicação simplificada/)).toBeVisible();
    await semRolagemLateral(page);

    await page.goto("/produto/cimento-cp2");
    await principal(page).getByRole("button", { name: /O que é Cimento CP II/ }).click();
    await expect(principal(page).getByText("Cimento de uso geral, o mais vendido no Brasil.")).toBeVisible();
    await principal(page).getByRole("button", { name: "Fechar explicação" }).click();
    await expect(principal(page).getByText("Cimento de uso geral, o mais vendido no Brasil.")).toHaveCount(0);

    await page.goto("/calculadora?servico=contrapiso&calcular=1&area=40&espessura=5");
    const areia = principal(page).locator("li", { hasText: "Areia média lavada" });
    await areia.getByRole("button", { name: /O que é Areia média/ }).click();
    await expect(areia.getByText(/É a areia "coringa" da obra/)).toBeVisible();
    // Tocar no "?" não desmarca o material da lista
    await expect(areia.getByRole("checkbox")).toBeChecked();
  });

  test('página da categoria tem o guia "Qual escolher?"', async ({ page }) => {
    await page.goto("/busca?categoria=Areia+e+pedra");
    await expect(principal(page).getByRole("heading", { name: "Qual escolher?" })).toBeVisible();
    await expect(principal(page).getByText("Qual areia?")).toBeVisible();
    await expect(principal(page).getByText(/Fina para reboco e acabamento/)).toBeVisible();
    await principal(page).getByRole("link", { name: "Brita 0 (pedrisco)" }).click();
    await expect(page).toHaveURL("/produto/brita-0");
    await semRolagemLateral(page);
  });
});

test.describe("Ferragens, ferramentas e EPI", () => {
  test("ferramenta de marca: marca e modelo em destaque em cada oferta", async ({ page }) => {
    await page.goto("/produto/martelo-unha");
    const ofertas = principal(page).getByRole("region", { name: /Todas as ofertas/ }).locator("article");
    expect(await ofertas.count()).toBeGreaterThanOrEqual(4);
    for (const texto of await ofertas.allInnerTexts()) {
      expect(texto).toMatch(/Forja Cerrado|Aço Candango|Ferramentas Ipê|Planalto Tools/);
    }
    await semRolagemLateral(page);
  });

  test("busca entende plural e sinônimos", async ({ page }) => {
    await page.goto("/busca?q=pregos");
    await expect(principal(page).getByRole("heading", { name: "Prego com cabeça 18x27" })).toBeVisible();
    await page.goto("/busca?q=luvas+de+prote%C3%A7%C3%A3o");
    await expect(principal(page).getByRole("heading", { name: "Luva de proteção nitrílica" })).toBeVisible();
    await expect(principal(page).getByRole("heading", { name: "Luva de raspa de couro" })).toBeVisible();
    await page.goto("/busca?categoria=Ferragens%2C+ferramentas+e+EPI");
    await expect(principal(page).getByText(/1[5-9] materiais encontrados/)).toBeVisible();
  });

  test("lojista precisa escolher o produto de marca (marca e modelo)", async ({ page }) => {
    await entrar(page, "lojista@teste.com");
    await page.goto("/loja/produtos/novo");
    await page.getByLabel("Material", { exact: true }).selectOption("trena-5m");
    await expect(page.getByLabel("Produto (marca e modelo)")).toBeVisible();
    await expect(page.getByLabel("Marca", { exact: true })).toHaveCount(0); // a marca vem do catálogo
    await page.getByLabel("Preço (R$)").fill("31,90");
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByText("Escolha o produto (marca e modelo) na lista ou informe o código de barras.")).toBeVisible();
  });
});
