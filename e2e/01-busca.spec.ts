import { expect, test } from "@playwright/test";
import { db, principal, semRolagemLateral } from "./ajuda";

test.describe("Busca e comparação", () => {
  test("tolera acentos, erros de digitação e sinônimos", async ({ page }) => {
    const casos: [string, string][] = [
      ["cimento cp2", "Cimento CP II-E 32"],
      ["tijolo 8 furo", "Tijolo cerâmico 8 furos 9x19x19 cm"],
      ["areia media", "Areia média lavada"],
      ["argamasa ac3", "Argamassa colante AC-III"],
      ["pedra", "Brita 1"],
      ["tijolo de concreto", "Bloco de concreto 14x19x39 cm"],
    ];
    for (const [busca, esperado] of casos) {
      await page.goto(`/busca?q=${encodeURIComponent(busca)}`);
      await expect(principal(page).getByRole("heading", { name: esperado }), busca).toBeVisible();
    }
  });

  test("sem resultado, sugere materiais parecidos", async ({ page }) => {
    await page.goto("/busca?q=areia+rosa");
    await expect(page.getByText("Não encontramos “areia rosa”.")).toBeVisible();
    await expect(page.getByText("Materiais parecidos")).toBeVisible();
    await expect(page.getByRole("link", { name: /Areia média lavada/ })).toBeVisible();
  });

  test("ordem padrão: o primeiro resultado é o Melhor preço; Oferta destaque com 'Patrocinado' visível", async ({ page }) => {
    await page.goto("/busca?q=cimento+cp2");
    await semRolagemLateral(page);
    const primeiroDaLista = principal(page).locator("section article").first();
    await expect(primeiroDaLista.getByText("Melhor preço")).toBeVisible();

    const anuncio = principal(page).locator("article", { hasText: "Oferta destaque" }).first();
    await expect(anuncio.getByRole("button", { name: /Patrocinado/ })).toBeVisible();
    await anuncio.getByRole("button", { name: /Patrocinado/ }).click();
    await expect(anuncio.getByText("Esta loja paga para aparecer em destaque.")).toBeVisible();
  });

  test("filtro de região sem lojas mostra aviso", async ({ page }) => {
    await page.goto("/busca?q=tijolo+8+furo&regiao=Fercal");
    await expect(page.getByText("Nenhuma loja com esses filtros.")).toBeVisible();
    await expect(page.getByText("Ainda não temos lojas com esse material em Fercal.")).toBeVisible();
  });

  test("filtro de região separado em DF e Entorno, com as regiões oficiais", async ({ page }) => {
    // Um material vendido pela loja do Entorno (Valparaíso de Goiás)
    const oferta = await db.offer.findFirstOrThrow({ where: { storeId: "valparaiso" }, include: { product: true } });
    const busca = `/busca?q=${encodeURIComponent(oferta.product.name)}`;
    await page.goto(busca);
    await principal(page).locator("summary", { hasText: "Filtros" }).click();
    const regiao = principal(page).getByLabel("Região");
    await expect(regiao.locator("optgroup[label='DF'] option", { hasText: "Lago Sul" })).toHaveCount(1);
    await expect(regiao.locator("optgroup[label='DF'] option", { hasText: "Lago Norte" })).toHaveCount(1);
    await expect(regiao.locator("optgroup[label='Entorno'] option", { hasText: "Valparaíso de Goiás" })).toHaveCount(1);

    // "Todo o Entorno": só aparecem lojas de cidades do Entorno
    await regiao.selectOption("Entorno");
    await principal(page).getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/regiao=Entorno/);
    const lojas = principal(page).locator("article");
    await expect(lojas.first()).toContainText("Valparaíso Materiais de Construção");
    for (const texto of await lojas.allInnerTexts()) expect(texto).toContain("Valparaíso de Goiás");

    // "Todo o DF": a loja do Entorno some
    await page.goto(`${busca}&regiao=DF`);
    await expect(principal(page).locator("article").first()).toBeVisible();
    await expect(principal(page).getByText("Valparaíso Materiais de Construção")).toHaveCount(0);
  });

  test("anúncios: Premium primeiro, Destaque nas vagas que sobram, com rodízio justo", async ({ page }) => {
    // 5 lojas que vendem cimento CP II: 2 Premium e 3 Destaque
    const lojas = await db.store.findMany({
      where: { status: "APROVADA", offers: { some: { productId: "cimento-cp2", active: true } } },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
      take: 5,
    });
    expect(lojas).toHaveLength(5);
    const antes = await db.store.findMany({ select: { id: true, adPlan: true } });
    await db.store.updateMany({ data: { adPlan: "NENHUM" } });
    await db.store.updateMany({ where: { id: { in: lojas.slice(0, 2).map((l) => l.id) } }, data: { adPlan: "PREMIUM" } });
    await db.store.updateMany({ where: { id: { in: lojas.slice(2).map((l) => l.id) } }, data: { adPlan: "DESTAQUE" } });

    const precoPorKg = (textos: string[]) => textos.map((t) => Number(t.replace(/[^\d,]/g, "").replace(",", ".")));
    try {
      const aparicoesDestaque = new Map<string, number>();
      for (let i = 0; i < 3; i++) {
        await page.goto("/busca?q=cimento+cp2");
        const anuncios = principal(page).locator("article", { has: page.getByRole("button", { name: /Patrocinado/ }) });
        await expect(anuncios).toHaveCount(3);
        const premium = anuncios.filter({ hasText: "Oferta premium" });
        const destaque = anuncios.filter({ hasText: "Oferta destaque" });
        await expect(premium).toHaveCount(2);
        await expect(destaque).toHaveCount(1);
        // As 2 Premium vêm antes, da mais barata para a mais cara
        await expect(anuncios.nth(0)).toContainText("Oferta premium");
        await expect(anuncios.nth(1)).toContainText("Oferta premium");
        const precos = precoPorKg(await premium.locator("text=/\\/kg$/").allInnerTexts());
        expect(precos).toEqual([...precos].sort((a, b) => a - b));
        const nome = await destaque.locator("h3").innerText();
        aparicoesDestaque.set(nome, (aparicoesDestaque.get(nome) ?? 0) + 1);
      }
      // 3 buscas, 1 vaga, 3 lojas Destaque: cada uma aparece 1 vez
      expect([...aparicoesDestaque.values()]).toEqual([1, 1, 1]);
    } finally {
      for (const l of antes) await db.store.update({ where: { id: l.id }, data: { adPlan: l.adPlan } });
    }
  });

  test("emblema Premium é diferente do selo Melhor preço", async ({ page }) => {
    await page.goto("/busca?q=cimento+cp2");
    const premium = principal(page).getByText("Oferta premium").first();
    const melhor = principal(page).getByText("Melhor preço").first();
    await expect(premium).toBeVisible();
    await expect(melhor).toBeVisible();
    const estilo = (el: typeof premium) =>
      el.evaluate((e) => {
        const c = getComputedStyle(e);
        return { fundo: c.backgroundColor, borda: c.borderRadius };
      });
    const [p, m] = [await estilo(premium), await estilo(melhor)];
    expect(p.fundo).not.toBe(m.fundo); // cor diferente
    expect(p.borda).not.toBe(m.borda); // formato diferente (retangular x arredondado)
  });

  test("páginas principais cabem na tela de 360 px", async ({ page }) => {
    for (const url of ["/", "/busca", "/busca?q=cimento", "/produto/cimento-cp2", "/termos"]) {
      await page.goto(url);
      await semRolagemLateral(page);
    }
  });
});
