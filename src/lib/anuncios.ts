// Contador do rodízio dos anúncios (Premium/Destaque), um por produto e plano.
// Fica no BANCO, não na memória do servidor: na Vercel cada busca pode cair
// numa cópia diferente do site, e cada cópia teria o seu próprio contador
// (o rodízio deixaria de ser justo). Com o banco, todas as cópias usam o mesmo.
//
// O "upsert" com incremento é feito pelo banco num passo só
// (INSERT ... ON CONFLICT DO UPDATE): duas buscas ao mesmo tempo nunca
// recebem o mesmo número.
import { db } from "./db";

/** Devolve a rodada atual (0, 1, 2…) e já avança o contador para a próxima busca */
export async function proximaRodada(chave: string): Promise<number> {
  const contador = await db.adRotation.upsert({
    where: { key: chave },
    create: { key: chave, round: 1 },
    update: { round: { increment: 1 } },
    select: { round: true },
  });
  return contador.round - 1;
}
