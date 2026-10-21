// Garante que a estrutura do banco para a internet (PostgreSQL) está igual à do computador (SQLite).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gerarSchemaPostgres } from "../../scripts/gerar-schema-postgres.mjs";

describe("estrutura do banco para PostgreSQL", () => {
  it("está em dia com prisma/schema.prisma (se falhar, rode: npm run banco:gerar-postgres)", () => {
    const esperado = gerarSchemaPostgres(readFileSync("prisma/schema.prisma", "utf8"));
    expect(readFileSync("prisma/postgres/schema.prisma", "utf8")).toBe(esperado);
  });

  it("não tem endereço nem senha do banco escritos no arquivo", () => {
    const pg = readFileSync("prisma/postgres/schema.prisma", "utf8");
    expect(pg).toContain('url       = env("DATABASE_URL")');
    expect(pg).not.toMatch(/postgres(ql)?:\/\//);
  });
});
