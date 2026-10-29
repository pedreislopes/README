// =============================================================================
// Roteiro de publicação na Vercel (usado automaticamente: veja vercel.json).
//
//  1. confere se o banco PostgreSQL (Neon) está conectado;
//  2. prepara o Prisma para PostgreSQL e cria/atualiza as tabelas;
//  3. SOMENTE no ambiente de TESTE (SOLID_AMBIENTE=teste): grava os dados de
//     teste se o banco estiver vazio, se os dados de teste mudaram (nova versão
//     em scripts/versao-dados-teste.mjs) ou se RESETAR_DADOS_TESTE=sim;
//  4. gera o site (next build).
//
// Nenhum endereço ou senha fica neste arquivo: tudo vem das variáveis de
// ambiente configuradas na Vercel.
// =============================================================================
import { execSync } from "node:child_process";
import { urlsDoBanco } from "./url-banco.mjs";
import { CHAVE_VERSAO_DADOS_TESTE, VERSAO_DADOS_TESTE } from "./versao-dados-teste.mjs";

const SCHEMA = "prisma/postgres/schema.prisma";
// Usamos as próprias variáveis do processo: assim os ajustes abaixo valem para
// este roteiro E para os comandos que ele chama
const env = process.env;

function rodar(comando) {
  console.log(`\n▶ ${comando}`);
  execSync(comando, { stdio: "inherit", env });
}

function parar(mensagem) {
  console.error(`\n✖ ${mensagem}\n`);
  process.exit(1);
}

// 1. Banco conectado?
const { pool, direta } = urlsDoBanco(env);
if (!pool) {
  parar(
    "Falta conectar o banco de dados. Na Vercel, abra o projeto → aba Storage → crie/conecte o banco Neon " +
      "e depois faça Redeploy. (Isto é esperado na primeira publicação.)",
  );
}
env.DATABASE_URL = pool;
env.DATABASE_URL_UNPOOLED = direta;

// 2. Prisma para PostgreSQL + tabelas
rodar(`npx prisma generate --schema ${SCHEMA}`);
rodar(`npx prisma migrate deploy --schema ${SCHEMA}`);

// 3. Dados de teste (nunca fora do ambiente de teste)
if (env.SOLID_AMBIENTE === "teste") {
  const resetar = (env.RESETAR_DADOS_TESTE ?? "").toLowerCase() === "sim";
  const { vazio, versao } = await situacaoDoBanco();
  const desatualizado = !vazio && versao !== VERSAO_DADOS_TESTE;
  if (vazio || resetar || desatualizado) {
    console.log(
      vazio
        ? "\nBanco vazio: gravando os dados de teste…"
        : resetar
          ? "\nRESETAR_DADOS_TESTE=sim: recriando os dados de teste…"
          : `\nDados de teste mudaram (versão ${versao ?? "1"} → ${VERSAO_DADOS_TESTE}): recriando os dados de teste…`,
    );
    rodar("npx tsx prisma/seed.ts");
  } else {
    console.log("\nDados de teste já existem: mantidos. (Para recriar: RESETAR_DADOS_TESTE=sim e Redeploy.)");
  }
} else {
  console.log("\nSOLID_AMBIENTE não é 'teste': os dados de teste NÃO são gravados.");
}

// 4. Site
rodar("npx next build");

async function situacaoDoBanco() {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    const vazio = (await db.user.count()) === 0;
    const gravada = await db.systemSetting.findUnique({ where: { key: CHAVE_VERSAO_DADOS_TESTE } });
    return { vazio, versao: gravada?.value ?? null };
  } finally {
    await db.$disconnect();
  }
}
