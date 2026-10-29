import { expect, test } from "@playwright/test";
import { principal, semRolagemLateral } from "./ajuda";

test.describe("Página inicial", () => {
  test("cartões de categoria com imagem otimizada, calculadora e como funciona", async ({ page }) => {
    await page.goto("/");
    await semRolagemLateral(page);

    const cartoes = principal(page).getByRole("region", { name: "Categorias" }).getByRole("link");
    await expect(cartoes).toHaveCount(11);
    await expect(cartoes.filter({ hasText: "Ferragens, ferramentas e EPI" })).toHaveCount(1);

    // As imagens passam pelo otimizador do Next.js (tamanho certo para cada tela)
    const imagens = cartoes.locator("img");
    await expect(imagens.first()).toHaveAttribute("src", /\/_next\/image\?url=%2Fcategorias%2F.+\.jpg/);
    for (const img of await imagens.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
    }

    await expect(principal(page).getByRole("heading", { name: "Como funciona" })).toBeVisible();
    const passos = principal(page).getByRole("region", { name: "Como funciona" }).getByRole("listitem");
    await expect(passos).toHaveText([/1\. Busque/, /2\. Compare/, /3\. Compre/]);

    await principal(page).getByRole("link", { name: /Não sabe quanto comprar\?/ }).click();
    await expect(page).toHaveURL("/calculadora");

    await page.goto("/");
    await cartoes.filter({ hasText: "Areia e pedra" }).click();
    await expect(page).toHaveURL(/categoria=Areia\+e\+pedra|categoria=Areia%20e%20pedra/);
    await expect(principal(page).getByRole("heading", { name: "Qual escolher?" })).toBeVisible();
  });
});
