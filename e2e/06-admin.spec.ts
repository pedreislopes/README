import { expect, test } from "@playwright/test";
import { db, entrar, principal, semRolagemLateral } from "./ajuda";

test.describe("Painel do administrador", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, "admin@teste.com");
    await expect(page).toHaveURL("/admin");
  });

  const loja = (page: import("@playwright/test").Page, nome: string) => principal(page).locator("article", { hasText: nome });

  test("indicadores no início do painel", async ({ page }) => {
    for (const rotulo of ["Total vendido", "Total de comissões", "Pedidos", "Lojas ativas", "Lojas pendentes"]) {
      await expect(principal(page).locator(".grid a", { hasText: rotulo }).first()).toBeVisible();
    }
    await semRolagemLateral(page);
  });

  test("aprova, muda comissão, suspende (com motivo) e reativa lojas; tudo vai para o registro", async ({ page }) => {
    // Aprovar pendente -> aparece na busca
    await page.goto("/admin/lojas?status=PENDENTE");
    await semRolagemLateral(page);
    await loja(page, "Nova Era").getByRole("button", { name: "Aprovar" }).click();
    await expect(loja(page, "Nova Era")).toHaveCount(0);
    const busca = await page.context().newPage();
    const vendido = await db.offer.findFirstOrThrow({ where: { storeId: "vicente-pires" } });
    await busca.goto(`/produto/${vendido.productId}`);
    await expect(principal(busca).getByText("Depósito Nova Era Vicente Pires").first()).toBeVisible();

    // Comissão (vale só para pedidos novos)
    await page.goto("/admin/lojas?status=APROVADA");
    await loja(page, "Guará").getByLabel(/Comissão de/).fill("5");
    await loja(page, "Guará").getByRole("button", { name: "Salvar comissão" }).click();
    await expect(loja(page, "Guará").getByText("Comissão alterada. Vale para pedidos novos.")).toBeVisible();

    // Suspender sem motivo: recusado; com motivo: some da busca
    await loja(page, "Ceilândia").getByRole("button", { name: "Suspender" }).click();
    await loja(page, "Ceilândia").getByRole("button", { name: "Confirmar suspensão" }).click();
    await expect(loja(page, "Ceilândia").getByText(/Escreva o motivo/)).toBeVisible();
    await loja(page, "Ceilândia").getByLabel(/Motivo da suspensão/).fill("Documentação fiscal vencida");
    await loja(page, "Ceilândia").getByRole("button", { name: "Confirmar suspensão" }).click();
    await expect(loja(page, "Ceilândia")).toHaveCount(0); // saiu da lista de ativas
    await page.goto("/admin/lojas?status=SUSPENSA");
    await expect(loja(page, "Ceilândia").getByText("Motivo: Documentação fiscal vencida")).toBeVisible();
    await busca.goto("/produto/cimento-cp3");
    await expect(principal(busca).getByText("Depósito Ceilândia Forte")).toHaveCount(0);
    await loja(page, "Ceilândia").getByRole("button", { name: "Reativar" }).click();
    await expect(loja(page, "Ceilândia")).toHaveCount(0);

    // Plano de anúncio: Nenhum -> Premium
    await page.goto("/admin/lojas?status=APROVADA");
    await loja(page, "Samambaia").getByLabel(/Plano de anúncio de/).selectOption("PREMIUM");
    await loja(page, "Samambaia").getByRole("button", { name: "Salvar plano" }).click();
    await expect(loja(page, "Samambaia").getByText("Plano alterado para Premium.")).toBeVisible();

    await page.goto("/admin/registro");
    await expect(principal(page).locator("ol").getByText(/Samambaia Depósito Popular: de Nenhum para Premium/)).toBeVisible();
    for (const texto of ["Aprovou loja", "Alterou comissão", "Suspendeu loja", "Reativou loja", "Alterou plano de anúncio"]) {
      await expect(principal(page).locator("ol").getByText(texto).first()).toBeVisible();
    }
    await expect(principal(page).getByText(/de 3% para 5% \(vale para pedidos novos\)/)).toBeVisible();
  });

  test("relatório filtrável com planilha CSV e cancelamento pelo administrador", async ({ page }) => {
    await page.goto("/admin/pedidos?loja=taguatinga");
    await semRolagemLateral(page);
    await expect(principal(page).getByText("Total vendido")).toBeVisible();

    const resposta = await page.request.get("/admin/pedidos/csv?loja=taguatinga");
    expect(resposta.status()).toBe(200);
    expect(resposta.headers()["content-disposition"]).toMatch(/attachment; filename="solid-pedidos-/);
    const csv = await resposta.text();
    expect(csv.startsWith("﻿Data;Pedido;Loja;Cliente")).toBe(true);
    expect(csv).toContain("Casa do Construtor Taguatinga");
    expect(csv).not.toContain("Depósito Ceilândia Forte");

    // Cancelar um pedido já entregue (só o administrador pode)
    await page.goto("/admin/pedidos?status=ENTREGUE");
    const entregue = principal(page).locator("ul > li").first();
    await entregue.getByRole("button", { name: "Cancelar pedido" }).click();
    await entregue.getByLabel("Suspeita de fraude").check();
    await entregue.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByRole("button", { name: "Confirmar cancelamento" })).toHaveCount(0);
    await page.goto("/admin/pedidos?status=CANCELADO");
    await expect(principal(page).getByText(/Cancelado \(admin\): Suspeita de fraude/)).toBeVisible();

    await page.goto("/admin/registro");
    await expect(principal(page).locator("ol").getByText("Baixou relatório em planilha").first()).toBeVisible();
    await expect(principal(page).locator("ol").getByText("Cancelou pedido").first()).toBeVisible();
  });

  test("aprova sugestão de material e inclui material novo", async ({ page }) => {
    await page.goto("/admin/materiais");
    await semRolagemLateral(page);
    const sugestao = principal(page).locator("div.border-amber-300").first();
    await sugestao.getByLabel("Nome do material").fill("Bloco de concreto 19x19x39 cm");
    await sugestao.getByRole("button", { name: "Aprovar e incluir" }).click();
    await expect(principal(page).locator("div.border-amber-300", { hasText: "Bloco de concreto estrutural" })).toHaveCount(0);
    await principal(page).getByText("Últimas analisadas").click();
    await expect(principal(page).getByText(/Incluído como “Bloco de concreto 19x19x39 cm”/)).toBeVisible();

    const novo = principal(page).locator("form").last();
    await novo.getByLabel("Nome do material").fill("Brita 2");
    await novo.getByLabel("Categoria").selectOption("Areia e pedra");
    await novo.getByLabel("Unidade de comparação").selectOption("m3");
    await novo.getByRole("button", { name: "Incluir no catálogo" }).click();
    await expect(page.getByText("“Brita 2” incluído no catálogo.")).toBeVisible();
  });
});
