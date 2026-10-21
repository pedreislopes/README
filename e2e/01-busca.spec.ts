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
    await page.goto("/busca?q=tijolo+8+furo&regiao=Asa+Sul");
    await expect(page.getByText("Nenhuma loja com esses filtros.")).toBeVisible();
  });

  test("Oferta destaque: até 3 no topo, da mais barata para a mais cara, com rodízio igual", async ({ page }) => {
    // Coloca 5 lojas que vendem cimento CP II em destaque
    const lojas = await db.store.findMany({
      where: { status: "APROVADA", offers: { some: { productId: "cimento-cp2", active: true } } },
      select: { id: true },
      take: 5,
    });
    expect(lojas).toHaveLength(5);
    const antes = await db.store.findMany({ where: { featured: true }, select: { id: true } });
    await db.store.updateMany({ data: { featured: false } });
    await db.store.updateMany({ where: { id: { in: lojas.map((l) => l.id) } }, data: { featured: true } });

    try {
      const aparicoes = new Map<string, number>();
      for (let i = 0; i < 5; i++) {
        await page.goto("/busca?q=cimento+cp2");
        const anuncios = principal(page).locator("article", { hasText: "Oferta destaque" });
        await expect(anuncios).toHaveCount(3);
        const nomes = await anuncios.locator("h3").allInnerTexts();
        // preço por kg de cada anúncio, na ordem em que aparecem
        const precos = (await anuncios.locator("text=/\\/kg$/").allInnerTexts()).map((t) =>
          Number(t.replace(/[^\d,]/g, "").replace(",", ".")),
        );
        expect(precos).toEqual([...precos].sort((a, b) => a - b));
        for (const n of nomes) aparicoes.set(n, (aparicoes.get(n) ?? 0) + 1);
      }
      // 5 buscas × 3 vagas = 15 aparições ÷ 5 lojas = 3 para cada uma
      expect([...aparicoes.values()].sort()).toEqual([3, 3, 3, 3, 3]);
    } finally {
      await db.store.updateMany({ data: { featured: false } });
      await db.store.updateMany({ where: { id: { in: antes.map((l) => l.id) } }, data: { featured: true } });
    }
  });

  test("páginas principais cabem na tela de 360 px", async ({ page }) => {
    for (const url of ["/", "/busca", "/busca?q=cimento", "/produto/cimento-cp2", "/termos"]) {
      await page.goto(url);
      await semRolagemLateral(page);
    }
  });
});
