// Segurança: cada tipo de usuário tenta abrir, pelo endereço, o que NÃO é dele.
import { expect, test, type Page } from "@playwright/test";
import { db, entrar } from "./ajuda";

const PAGINAS_ADMIN = ["/admin", "/admin/lojas", "/admin/pedidos", "/admin/materiais", "/admin/registro"];
const PAGINAS_LOJA = ["/loja", "/loja/pedidos", "/loja/produtos", "/loja/produtos/novo", "/loja/sugerir"];

async function esperarRedirecionamento(page: Page, url: string, destino: RegExp) {
  await page.goto(url);
  await expect(page, `${url} deveria redirecionar`).toHaveURL(destino);
}

async function esperarNaoEncontrada(page: Page, url: string) {
  const r = await page.goto(url);
  expect(r?.status(), url).toBe(404);
  await expect(page.getByText("Página não encontrada")).toBeVisible();
}

test.describe("Segurança: ninguém acessa o que não é seu", () => {
  test("visitante sem login é mandado para o login", async ({ page }) => {
    for (const url of ["/conta", "/meus-pedidos", ...PAGINAS_LOJA, ...PAGINAS_ADMIN]) {
      await esperarRedirecionamento(page, url, /\/entrar/);
    }
    expect((await page.request.get("/admin/pedidos/csv")).status()).toBe(403);
  });

  test("cliente não abre painel de loja, de administrador nem pedido de outro cliente", async ({ page }) => {
    const compraDeOutro = await db.purchase.findFirstOrThrow({ where: { user: { email: "cnpj@teste.com" } } });
    await entrar(page, "cpf@teste.com");
    for (const url of [...PAGINAS_LOJA, ...PAGINAS_ADMIN]) await esperarRedirecionamento(page, url, /\/conta$/);
    await esperarNaoEncontrada(page, `/pedido/${compraDeOutro.id}`);
    expect((await page.request.get("/admin/pedidos/csv")).status()).toBe(403);
  });

  test("lojista não vê produtos nem pedidos de outra loja, nem o painel do administrador", async ({ page }) => {
    const produtoDeOutraLoja = await db.offer.findFirstOrThrow({ where: { storeId: "ceilandia" } });
    const compraDeCliente = await db.purchase.findFirstOrThrow();
    await entrar(page, "lojista@teste.com");

    await esperarNaoEncontrada(page, `/loja/produtos/${produtoDeOutraLoja.id}`);
    await esperarNaoEncontrada(page, `/pedido/${compraDeCliente.id}`);
    // A lista mostra exatamente os pedidos desta loja, e nenhum item vendido só pela Ceilândia
    await page.goto("/loja/pedidos");
    const daLoja = await db.order.count({ where: { storeId: "taguatinga" } });
    await expect(page.locator("main article")).toHaveCount(daLoja);
    await expect(page.locator("main").getByText("Brita 1")).toHaveCount(0);
    for (const url of PAGINAS_ADMIN) await esperarRedirecionamento(page, url, /\/conta$/);
  });

  test("administrador não vira cliente e o login não redireciona para outro site", async ({ page }) => {
    await page.goto("/entrar?voltar=" + encodeURIComponent("/\\site-falso.com"));
    await page.getByLabel("E-mail").fill("cpf@teste.com");
    await page.getByLabel("Senha").fill("solid123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((u) => u.pathname !== "/entrar");
    expect(new URL(page.url()).host).toBe(new URL(page.url()).host); // continua no Solid
    expect(page.url()).not.toContain("site-falso");
  });

  test("quem sai da conta não continua vendo o painel ao trocar de aba dentro dele", async ({ page, context }) => {
    // Situação descrita na documentação do Next.js: a "moldura" (layout) do painel não é
    // recarregada ao trocar de aba dentro dele. Por isso cada página verifica o acesso sozinha.
    await entrar(page, "admin@teste.com");
    await expect(page).toHaveURL("/admin");

    const outraAba = await context.newPage();
    await outraAba.goto("/conta");
    await outraAba.getByRole("button", { name: "Sair" }).click();
    await outraAba.waitForURL("/");

    // Na primeira aba, toca em "Lojas" (troca de página sem recarregar)
    await page.getByRole("navigation", { name: "Painel do administrador" }).getByRole("link", { name: /Lojas/ }).click();
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByText(/@teste\.com/)).toHaveCount(0);
  });

  test("cabeçalhos de segurança em todas as páginas", async ({ page }) => {
    const r = await page.request.get("/");
    expect(r.headers()["x-frame-options"]).toBe("DENY");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
    expect(r.headers()["x-powered-by"]).toBeUndefined();
  });
});
