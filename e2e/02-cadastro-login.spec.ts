import { expect, test } from "@playwright/test";
import { semRolagemLateral } from "./ajuda";

test.describe("Cadastro e login", () => {
  test("cadastro CPF: valida, não aceita CPF repetido e mostra o documento mascarado", async ({ page }) => {
    await page.goto("/cadastro");
    await semRolagemLateral(page);
    await page.getByLabel("Nome completo").fill("Maria Teste");
    await page.getByLabel("CPF").fill("52998224726"); // dígito errado
    await page.getByLabel("E-mail").fill("maria@teste.com");
    await page.getByLabel("Telefone com DDD").fill("61999990000");
    await page.getByLabel("Senha", { exact: true }).fill("obra2026");
    await page.getByLabel("Repita a senha").fill("obra2026");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("CPF inválido. Confira os números.")).toBeVisible();
    await expect(page.getByText("É preciso aceitar os Termos de Uso")).toBeVisible();
    await expect(page.getByLabel("Nome completo")).toHaveValue("Maria Teste"); // não apagou

    // CPF de outra conta (cpf@teste.com)
    await page.getByLabel("CPF").fill("12345678062");
    await page.getByLabel("Senha", { exact: true }).fill("obra2026");
    await page.getByLabel("Repita a senha").fill("obra2026");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Já existe uma conta com este CPF.")).toBeVisible();

    await page.getByLabel("CPF").fill("52998224725");
    await page.getByLabel("Senha", { exact: true }).fill("obra2026");
    await page.getByLabel("Repita a senha").fill("obra2026");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL("/");
    await page.goto("/conta");
    await expect(page.getByText("***.982.247-**")).toBeVisible();
  });

  test("login não revela se o e-mail existe e bloqueia após 5 erros", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("naoexiste@teste.com");
    await page.getByLabel("Senha").fill("errada123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

    for (let i = 0; i < 5; i++) {
      await page.goto("/entrar");
      await page.getByLabel("E-mail").fill("maria@teste.com");
      await page.getByLabel("Senha").fill(`errada${i}`);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    }
    // Agora nem a senha certa entra
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("maria@teste.com");
    await page.getByLabel("Senha").fill("obra2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/Muitas tentativas seguidas/)).toBeVisible();
  });

  test("lojista se cadastra e cai no painel com a loja pendente", async ({ page }) => {
    await page.goto("/cadastro?tipo=LOJISTA");
    await page.getByLabel("Razão social ou nome da empresa").fill("Depósito Novo Ltda");
    await page.getByLabel("CNPJ").fill("11222333000181");
    await page.getByLabel("E-mail").fill("novaloja@teste.com");
    await page.getByLabel("Telefone com DDD").fill("6133334444");
    await page.getByLabel("Nome da loja").fill("Depósito Novo");
    await page.getByLabel("Região do DF").selectOption("Asa Sul");
    await page.getByLabel("Endereço da loja").fill("SCLS 102 Bloco A");
    await page.getByLabel("Senha", { exact: true }).fill("obra2026");
    await page.getByLabel("Repita a senha").fill("obra2026");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL("/loja");
    await expect(page.getByText("Sua loja ainda não aparece na busca. Aguardando aprovação.")).toBeVisible();
  });
});
