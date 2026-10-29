// Teste com o banco de verdade (prisma/dev.db): o contador do rodízio é
// compartilhado e nunca entrega o mesmo número para duas buscas.
import { afterAll, describe, expect, it } from "vitest";
import { proximaRodada } from "./anuncios";
import { db } from "./db";

const CHAVE = "teste-automatico:DESTAQUE";

describe("contador do rodízio no banco", () => {
  afterAll(async () => {
    await db.adRotation.deleteMany({ where: { key: CHAVE } });
    await db.$disconnect();
  });

  it("começa em 0, avança 1 por busca e não repete com buscas simultâneas", async () => {
    await db.adRotation.deleteMany({ where: { key: CHAVE } });
    expect(await proximaRodada(CHAVE)).toBe(0);
    expect(await proximaRodada(CHAVE)).toBe(1);
    // 20 buscas ao mesmo tempo (como várias cópias do site na Vercel)
    const rodadas = await Promise.all(Array.from({ length: 20 }, () => proximaRodada(CHAVE)));
    expect([...rodadas].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 2));
    expect((await db.adRotation.findUniqueOrThrow({ where: { key: CHAVE } })).round).toBe(22);
  });
});
