// =============================================================================
// Gera prisma/postgres/schema.prisma a partir de prisma/schema.prisma.
//
// No computador o Solid usa SQLite (um arquivo). Na internet (Vercel) usa
// PostgreSQL. As tabelas são as MESMAS: só muda o "datasource" (onde fica o banco).
// Rode depois de qualquer mudança em prisma/schema.prisma:
//     npm run banco:gerar-postgres
// (um teste automático avisa se você esquecer)
// =============================================================================
import { readFileSync, writeFileSync } from "node:fs";

export function gerarSchemaPostgres(schemaSqlite) {
  const datasourcePostgres = `datasource db {
  provider  = "postgresql"
  // Endereços do banco: ficam SÓ nas variáveis de ambiente da Vercel, nunca no código.
  url       = env("DATABASE_URL") // conexão com "pool" (usada pelo site)
  directUrl = env("DATABASE_URL_UNPOOLED") // conexão direta (usada para criar as tabelas)
}`;
  const semDatasource = schemaSqlite.replace(/datasource db \{[\s\S]*?\n\}/, datasourcePostgres);
  if (semDatasource === schemaSqlite) throw new Error("Não encontrei o bloco 'datasource db' em prisma/schema.prisma");
  return (
    "// ARQUIVO GERADO AUTOMATICAMENTE por scripts/gerar-schema-postgres.mjs — NÃO EDITE.\n" +
    "// Edite prisma/schema.prisma e rode: npm run banco:gerar-postgres\n\n" +
    semDatasource
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const gerado = gerarSchemaPostgres(readFileSync("prisma/schema.prisma", "utf8"));
  writeFileSync("prisma/postgres/schema.prisma", gerado);
  console.log("✔ prisma/postgres/schema.prisma atualizado");
}
