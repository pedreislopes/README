import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { db, entrar, principal } from "./ajuda";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

test.describe("Esqueci minha senha", () => {
  test("pedido mostra a mesma mensagem com e sem conta; só cria link para quem existe", async ({ page }) => {
    const cliente = await db.user.findUniqueOrThrow({ where: { email: "cpf@teste.com" } });
    await page.goto("/entrar");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL("/esqueci-senha");

    const pedir = async (email: string) => {
      await page.goto("/esqueci-senha");
      await page.getByLabel("E-mail da sua conta").fill(email);
      await page.getByRole("button", { name: "Enviar link" }).click();
      return (await principal(page).getByRole("status").innerText()).trim();
    };
    const comConta = await pedir("cpf@teste.com");
    const semConta = await pedir("ninguem-aqui@teste.com");
    expect(comConta).toContain("Se houver uma conta com este e-mail, enviaremos um link");
    expect(semConta).toBe(comConta);

    // O link é gravado logo depois da resposta
    await expect.poll(() => db.passwordReset.count({ where: { userId: cliente.id } })).toBe(1);
    expect(await db.passwordReset.count()).toBe(1);
  });

  test("link cria a nova senha uma única vez, desloga os aparelhos e vence", async ({ page, browser }) => {
    // Conta só deste teste (para não mudar a senha das contas de teste)
    const usuario = await db.user.create({
      data: {
        name: "Teste Senha",
        email: "troca-senha@teste.com",
        passwordHash: await bcrypt.hash("antiga123", 4),
        role: "CPF",
        document: "52998224725",
      },
    });
    // Um aparelho já logado com a senha antiga
    const outroAparelho = await (await browser.newContext()).newPage();
    await entrar(outroAparelho, usuario.email, "antiga123");

    const token = "codigo-de-teste-123";
    await db.passwordReset.create({
      data: { userId: usuario.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + 30 * 60_000) },
    });

    await page.goto(`/redefinir-senha?token=${token}`);
    await page.getByLabel("Nova senha", { exact: true }).fill("curta");
    await page.getByLabel("Repita a nova senha").fill("curta");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByText(/A senha deve ter de 8 a 64 caracteres/)).toBeVisible();

    await page.getByLabel("Nova senha", { exact: true }).fill("novasenha2026");
    await page.getByLabel("Repita a nova senha").fill("novasenha2026");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await page.waitForURL("/entrar?senha=redefinida");
    await expect(page.getByText("Senha alterada! Entre com a nova senha.")).toBeVisible();

    // A senha antiga não entra mais; a nova entra
    await page.getByLabel("E-mail").fill(usuario.email);
    await page.getByLabel("Senha").fill("antiga123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await entrar(page, usuario.email, "novasenha2026");
    await expect(page).toHaveURL("/");

    // O aparelho que estava logado com a senha antiga foi desconectado
    await outroAparelho.goto("/conta");
    await expect(outroAparelho).toHaveURL(/\/entrar/);

    // Link usado não funciona de novo
    await page.goto(`/redefinir-senha?token=${token}`);
    await expect(page.getByText(/Este link já foi usado/)).toBeVisible();

    // Link vencido
    await db.passwordReset.create({
      data: { userId: usuario.id, tokenHash: hash("vencido"), expiresAt: new Date(Date.now() - 60_000) },
    });
    await page.goto("/redefinir-senha?token=vencido");
    await expect(page.getByText(/Este link venceu/)).toBeVisible();
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveCount(0);

    // Link inventado
    await page.goto("/redefinir-senha?token=inventado");
    await expect(page.getByText(/não é válido/)).toBeVisible();
  });

  test("limita pedidos seguidos para o mesmo e-mail", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto("/esqueci-senha");
      await page.getByLabel("E-mail da sua conta").fill("cnpj@teste.com");
      await page.getByRole("button", { name: "Enviar link" }).click();
      await expect(principal(page).getByRole("status")).toBeVisible();
    }
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail da sua conta").fill("cnpj@teste.com");
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByText(/Muitos pedidos seguidos/)).toBeVisible();
  });
});
