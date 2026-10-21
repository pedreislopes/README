// Funções de apoio usadas pelos testes de ponta a ponta.
import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/** Acesso direto ao banco, para preparar situações (ex.: a loja muda um preço) */
export const db = new PrismaClient();

export const SENHA = "solid123";

export async function entrar(page: Page, email: string, senha = SENHA) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => u.pathname !== "/entrar");
}

/** Na tela de 360 px, nada pode "vazar" para os lados (sem rolagem horizontal) */
export async function semRolagemLateral(page: Page) {
  const larguras = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    tela: window.innerWidth,
  }));
  expect(larguras.pagina, `a página ${page.url()} tem rolagem lateral`).toBeLessThanOrEqual(larguras.tela);
}

/** Conteúdo principal da página, sem o menu */
export const principal = (page: Page) => page.locator("main");
