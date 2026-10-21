import { expect, test } from "@playwright/test";
import { db, principal, semRolagemLateral } from "./ajuda";

test.describe("Calculadora de obra", () => {
  test("muro 10 × 2 m: 550 tijolos, dois planos e carrinho numa loja só", async ({ page }) => {
    await page.goto("/calculadora");
    await page.getByRole("link", { name: /Muro de alvenaria/ }).click();
    await page.getByLabel("Comprimento (m)").fill("10");
    await page.getByLabel("Altura (m)").fill("2");
    await page.getByRole("button", { name: "Calcular materiais" }).click();

    await expect(page.getByText("Muro de alvenaria: 10 m × 2 m = 20 m²")).toBeVisible();
    await expect(page.getByText("20 m² × 25 tijolos/m² = 500 + 10% de perda = 550 tijolos")).toBeVisible();
    await expect(page.getByText("Estimativa para referência. Confirme as quantidades com um profissional responsável pela obra.").first()).toBeVisible();
    await semRolagemLateral(page);

    // Dois planos lado a lado
    const planos = page.getByRole("radiogroup", { name: "Como comprar" });
    await expect(planos.getByRole("radio", { name: /Menor preço por item/ })).toBeVisible();
    await planos.getByRole("radio", { name: /Tudo na/ }).click();
    await page.getByRole("button", { name: "Montar carrinho numa loja só" }).click();
    await page.waitForURL("/carrinho");
    await expect(page.getByText(/itens em 1 loja/)).toBeVisible();
  });

  test("contrapiso arredonda para cima no formato vendido", async ({ page }) => {
    await page.goto("/calculadora?servico=contrapiso&calcular=1&area=40&espessura=5");
    const areia = principal(page).locator("li", { hasText: "Areia média lavada" });
    await expect(areia.getByText(/Calculado: 2,53 m³/)).toBeVisible();
    await expect(areia.getByText("3", { exact: true })).toBeVisible(); // 3 m³ (múltiplo de 0,5)
    const cimento = principal(page).locator("li", { hasText: "Cimento CP II-E 32" });
    await expect(cimento.getByText(/Calculado: 13,2 sacos/)).toBeVisible();
    await expect(cimento.getByText("14", { exact: true })).toBeVisible();
  });

  test("avisa quando nenhuma loja vende um material calculado", async ({ page }) => {
    await db.offer.updateMany({ where: { productId: "rejunte" }, data: { active: false } });
    try {
      await page.goto("/calculadora?servico=piso&calcular=1&area=20&tipo=ceramico");
      await expect(page.getByText(/Nenhuma loja tem Rejunte flexível cinza à venda no momento/)).toBeVisible();
    } finally {
      await db.offer.updateMany({ where: { productId: "rejunte" }, data: { active: true } });
    }
  });
});
