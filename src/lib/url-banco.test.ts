import { describe, expect, it } from "vitest";
import { urlsDoBanco } from "../../scripts/url-banco.mjs";

describe("endereço do banco nas variáveis de ambiente", () => {
  it("usa os nomes padrão da integração do Neon", () => {
    expect(urlsDoBanco({ DATABASE_URL: "pg://pool", DATABASE_URL_UNPOOLED: "pg://direta" })).toEqual({ pool: "pg://pool", direta: "pg://direta" });
  });
  it("aceita prefixo e nomes antigos", () => {
    expect(urlsDoBanco({ STORAGE_DATABASE_URL: "pg://p", STORAGE_DATABASE_URL_UNPOOLED: "pg://d" })).toEqual({ pool: "pg://p", direta: "pg://d" });
    expect(urlsDoBanco({ POSTGRES_PRISMA_URL: "pg://p", POSTGRES_URL_NON_POOLING: "pg://d" })).toEqual({ pool: "pg://p", direta: "pg://d" });
  });
  it("sem variável: usa o SQLite local (nenhum endereço)", () => {
    expect(urlsDoBanco({})).toEqual({ pool: null, direta: null });
  });
});
