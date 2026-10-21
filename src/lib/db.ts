// Conexão única com o banco de dados, reaproveitada em todo o sistema.
// (Durante o desenvolvimento o Next.js recarrega o código várias vezes;
// guardar a conexão em "globalThis" evita abrir conexões demais.)
import { PrismaClient } from "@prisma/client";
import { urlsDoBanco } from "../../scripts/url-banco.mjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Na internet (Vercel + Neon) o endereço vem das variáveis de ambiente.
// No computador não há variável: vale o arquivo SQLite de prisma/schema.prisma.
const { pool } = urlsDoBanco(process.env as Record<string, string | undefined>);

export const db = globalForPrisma.prisma ?? new PrismaClient(pool ? { datasourceUrl: pool } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
