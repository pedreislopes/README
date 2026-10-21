import { expect, test } from "@playwright/test";
import { db, entrar, principal, semRolagemLateral } from "./ajuda";

/** Oferta de cimento CP II (saco 50 kg) da Casa do Construtor Taguatinga */
const ofertaTaguatinga = () =>
  db.offer.findFirstOrThrow({ where: { storeId: "taguatinga", productId: "cimento-cp2", packageLabel: "Saco 50 kg" }, include: { tiers: true } });

test.describe("Carrinho e pedido", () => {
  test("do carrinho de visitante até o pedido confirmado", async ({ page }) => {
    // 1. Visitante adiciona produtos (respeitando o formato de venda)
    await page.goto("/produto/cimento-cp2");
    const cimento = principal(page).locator("article", { hasText: "Casa do Construtor Taguatinga" }).filter({ hasText: "Saco 50 kg" });
    await cimento.getByLabel(/Quantidade/).fill("2,5");
    await cimento.getByRole("button", { name: "Adicionar" }).click();
    await expect(cimento.getByText("Este produto é vendido só em quantidades inteiras.")).toBeVisible();
    await cimento.getByLabel(/Quantidade/).fill("42");
    await cimento.getByRole("button", { name: "Adicionar" }).click();
    await expect(cimento.getByText("Adicionado.")).toBeVisible();

    await page.goto("/produto/areia-media");
    const areia = principal(page).locator("article", { hasText: "Gama Construções" });
    for (let i = 0; i < 4; i++) await areia.getByRole("button", { name: "Aumentar" }).click();
    await expect(areia.getByLabel(/Quantidade/)).toHaveValue("2,5");
    await areia.getByRole("button", { name: "Adicionar" }).click();
    await expect(areia.getByText("Adicionado.")).toBeVisible();

    // 2. Entra como CNPJ: o carrinho continua lá
    await page.goto("/carrinho");
    await semRolagemLateral(page);
    await page.getByRole("link", { name: "Entrar para finalizar" }).click();
    await page.getByLabel("E-mail").fill("cnpj@teste.com");
    await page.getByLabel("Senha").fill("solid123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("/carrinho");
    await expect(page.getByText("2 itens em 2 lojas")).toBeVisible();

    // 3. Incentivo de atacado
    await expect(page.getByText(/Adicione mais\s+8 sacos/)).toBeVisible();
    await page.getByRole("button", { name: "Levar 50 sacos" }).click();
    await expect(page.getByText(/Preço de atacado \(50\+\): você economiza/)).toBeVisible();

    // 4. A loja muda o preço de atacado: o cliente é avisado antes de confirmar
    const oferta = await ofertaTaguatinga();
    const faixa50 = oferta.tiers.find((t) => t.minQuantity === 50)!;
    await db.priceTier.update({ where: { id: faixa50.id }, data: { priceCents: faixa50.priceCents + 140 } });
    await page.reload();
    await expect(page.getByText(/1 preço mudou desde que/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar pedido" })).toBeDisabled();
    await page.getByRole("button", { name: "Entendi, aceitar novos preços" }).click();
    await expect(page.getByRole("button", { name: "Confirmar pedido" })).toBeEnabled();

    // 5. Confirma o pedido
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await page.waitForURL(/\/pedido\//);
    await expect(page.getByRole("heading", { name: "Pedido registrado!" })).toBeVisible();
    await semRolagemLateral(page);
    const pedidoAntes = await principal(page).innerText();

    // 6. A loja muda o preço de novo: o pedido feito NÃO muda ("foto" dos preços)
    await db.offer.update({ where: { id: oferta.id }, data: { priceCents: 9999 } });
    await db.priceTier.update({ where: { id: faixa50.id }, data: { priceCents: 9000 } });
    await page.reload();
    expect(await principal(page).innerText()).toBe(pedidoAntes);

    // 7. O carrinho esvaziou
    await page.goto("/carrinho");
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();

    // 8. O cliente cancela um dos pedidos (ainda "Novo"), com motivo
    await page.goto("/meus-pedidos");
    await principal(page).locator("li a").first().click();
    await page.getByRole("button", { name: "Cancelar pedido" }).first().click();
    await page.getByLabel("Desisti da compra").check();
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByText(/Cancelado pelo cliente\. Motivo: Desisti da compra/)).toBeVisible();
  });

  test("cliente CPF não vê atacado exclusivo de CNPJ", async ({ page }) => {
    await entrar(page, "cpf@teste.com");
    await page.goto("/busca?q=cimento+cp3");
    await expect(principal(page).getByText("Preço de atacado disponível para CNPJ").first()).toBeVisible();
    await expect(principal(page).getByText(/^Atacado:/)).toHaveCount(0);
  });
});
