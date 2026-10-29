import { describe, expect, it } from "vitest";
import { situacaoDoLink, textoEmailRecuperacao } from "./recuperacao";

describe("link de redefinição de senha", () => {
  const agora = new Date("2026-11-01T12:00:00Z");
  const daqui = (min: number) => new Date(agora.getTime() + min * 60_000);

  it("vale até vencer e só uma vez", () => {
    expect(situacaoDoLink({ expiresAt: daqui(10), usedAt: null }, agora)).toBe("VALIDO");
    expect(situacaoDoLink({ expiresAt: daqui(-1), usedAt: null }, agora)).toBe("EXPIRADO");
    expect(situacaoDoLink({ expiresAt: daqui(0), usedAt: null }, agora)).toBe("EXPIRADO");
    expect(situacaoDoLink({ expiresAt: daqui(10), usedAt: daqui(-5) }, agora)).toBe("USADO");
    expect(situacaoDoLink(null, agora)).toBe("INEXISTENTE");
  });

  it("e-mail traz o link, a validade e o aviso para quem não pediu", () => {
    const e = textoEmailRecuperacao("Ana Beatriz Oliveira", "https://solid.exemplo/redefinir-senha?token=abc", 30);
    expect(e.texto).toContain("Olá, Ana!");
    expect(e.texto).toContain("https://solid.exemplo/redefinir-senha?token=abc");
    expect(e.texto).toContain("vale por 30 minutos");
    expect(e.texto).toContain("Se não foi você");
  });
});
