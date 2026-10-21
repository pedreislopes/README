import { expect, test } from "@playwright/test";
import { entrar, principal, semRolagemLateral } from "./ajuda";

test.describe("Painel do lojista", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, "lojista@teste.com");
    await expect(page).toHaveURL("/loja");
  });

  test("mostra o plano de anúncio da loja", async ({ page }) => {
    await expect(principal(page).getByText("Plano de anúncio")).toBeVisible();
    await expect(principal(page).getByText("Nenhum", { exact: true })).toBeVisible();
  });

  test("aviso de pedidos novos, comissão visível, avançar e cancelar", async ({ page }) => {
    await expect(page.getByText(/Você tem \d+ pedidos? novos?!/)).toBeVisible();
    await semRolagemLateral(page);
    await page.getByText(/Você tem \d+ pedidos? novos?!/).click();
    await page.waitForURL(/status=NOVO/);

    const pedido = principal(page).locator("article").first();
    await expect(pedido.getByText(/Comissão Solid \(3%\)/)).toBeVisible();
    await expect(pedido.getByText("Você recebe")).toBeVisible();
    const quantosNovos = await principal(page).locator("article").count();
    await pedido.getByRole("button", { name: "Marcar como Recebido" }).click();
    await expect(principal(page).locator("article")).toHaveCount(quantosNovos - 1); // saiu da lista de "Novo"
    await page.goto("/loja/pedidos?status=RECEBIDO");
    await expect(principal(page).locator("article").first().getByText("Recebido", { exact: true })).toBeVisible();

    // Cancelar (ainda não separado) com motivo: comissão vai a zero
    const recebido = principal(page).locator("article").first();
    await recebido.getByRole("button", { name: "Cancelar pedido" }).click();
    await recebido.getByLabel("Sem estoque").check();
    await recebido.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByRole("button", { name: "Confirmar cancelamento" })).toHaveCount(0);
    await page.goto("/loja/pedidos?status=CANCELADO");
    const cancelado = principal(page).locator("article", { hasText: "Sem estoque" }).first();
    await expect(cancelado.getByText(/Cancelado pela loja.*Motivo: Sem estoque/)).toBeVisible();
    await expect(cancelado.getByText("R$ 0,00 (cancelado)")).toBeVisible();

    // Pedido separado não pode mais ser cancelado pela loja
    await page.goto("/loja/pedidos?status=SEPARADO");
    await expect(principal(page).getByRole("button", { name: "Cancelar pedido" })).toHaveCount(0);
  });

  test("edição rápida de preço, sem estoque e reajuste em massa", async ({ page }) => {
    await page.goto("/loja/produtos");
    await semRolagemLateral(page);
    await page.getByLabel("Procurar na minha lista").fill("cimento cp v");
    const cpv = principal(page).locator("li", { hasText: "Cimento CP V ARI" });
    await cpv.getByLabel(/Preço de/).fill("99,90");
    await cpv.getByRole("button", { name: "Salvar preço" }).click();
    await expect(cpv.getByText("Salvo ✓")).toBeVisible();
    await page.reload();
    await expect(principal(page).locator("li", { hasText: "Cimento CP V ARI" }).getByLabel(/Preço de/)).toHaveValue("99,90");

    // Sem estoque: some da busca
    await page.getByLabel("Procurar na minha lista").fill("cimento cp ii");
    const cp2 = principal(page).locator("li", { hasText: "Cimento CP II-E 32" }).filter({ hasText: "Saco 50 kg" });
    await cp2.getByRole("button", { name: /Disponível/ }).click();
    await expect(principal(page).locator("li", { hasText: "Cimento CP II-E 32" }).filter({ hasText: "Saco 50 kg" }).getByRole("button", { name: /Sem estoque/ })).toBeVisible();
    const busca = await page.context().newPage();
    await busca.goto("/produto/cimento-cp2");
    await expect(principal(busca).locator("article", { hasText: "Casa do Construtor Taguatinga" }).filter({ hasText: "Saco 50 kg" })).toHaveCount(0);

    // Reajuste em massa de +10% nos produtos filtrados
    await page.goto("/loja/produtos");
    await page.getByLabel("Procurar na minha lista").fill("cimento cp v");
    page.once("dialog", (d) => d.accept());
    await page.getByText(/Selecionar todos/).click();
    await page.getByLabel("Porcentagem").fill("10");
    await page.getByRole("button", { name: "Aumentar" }).click();
    await expect(page.getByText("Preços reajustados.")).toBeVisible();
    await expect(principal(page).locator("li", { hasText: "Cimento CP V ARI" }).getByLabel(/Preço de/)).toHaveValue("109,89");
  });

  test("cadastra produto (com erro corrigido) e sugere material", async ({ page }) => {
    await page.goto("/loja/produtos/novo");
    await semRolagemLateral(page);
    await page.getByLabel("Material").selectOption("telha-colonial");
    await page.getByLabel("Como é vendido").fill("Unidade");
    await page.getByLabel(/Quanto vem/).fill("1");
    await page.getByLabel("Preço (R$)").fill("2,90");
    await page.getByLabel("Faixa 1: quantidade mínima").fill("500");
    await page.getByLabel("Faixa 1: preço").fill("3,00"); // mais caro que o preço normal
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByText(/O preço de cada faixa deve ser menor/)).toBeVisible();
    await expect(page.getByLabel("Material")).toHaveValue("telha-colonial"); // não apagou
    await page.getByLabel("Faixa 1: preço").fill("2,60");
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await page.waitForURL(/salvo=1/);
    await expect(principal(page).locator("li", { hasText: "Telha cerâmica colonial" }).filter({ hasText: "Unidade" })).toBeVisible();

    await page.goto("/loja/sugerir");
    await page.getByLabel("Nome do material").fill("Manta asfáltica 3 mm");
    await page.getByLabel("Categoria").selectOption("Telhas e coberturas");
    await page.getByLabel("Como comparar o preço entre lojas").selectOption("m2");
    await page.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(page.getByText("Sugestão enviada!")).toBeVisible();
    await expect(principal(page).locator("li", { hasText: "Manta asfáltica 3 mm" }).getByText("Em análise")).toBeVisible();
  });
});
