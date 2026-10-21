// Descobre o endereço do banco PostgreSQL nas variáveis de ambiente.
// A integração do Neon na Vercel normalmente cria DATABASE_URL e
// DATABASE_URL_UNPOOLED; se tiver sido conectada com um prefixo (ex.:
// STORAGE_DATABASE_URL) ou com os nomes antigos (POSTGRES_PRISMA_URL...),
// aceitamos também. Usado pelo site (src/lib/db.ts) e pela publicação.

export function urlsDoBanco(env) {
  const terminaCom = (sufixo) => Object.keys(env).find((k) => k.endsWith(sufixo) && env[k]);
  const pool =
    env.DATABASE_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || (terminaCom("_DATABASE_URL") && env[terminaCom("_DATABASE_URL")]);
  const direta =
    env.DATABASE_URL_UNPOOLED ||
    env.POSTGRES_URL_NON_POOLING ||
    (terminaCom("_DATABASE_URL_UNPOOLED") && env[terminaCom("_DATABASE_URL_UNPOOLED")]) ||
    pool;
  return { pool: pool || null, direta: direta || null };
}
