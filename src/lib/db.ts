// Conexão única com o banco de dados, reaproveitada em todo o sistema.
// (Durante o desenvolvimento o Next.js recarrega o código várias vezes;
// guardar a conexão em "globalThis" evita abrir conexões demais.)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
