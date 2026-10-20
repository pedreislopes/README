import { describe, expect, it } from "vitest";
import { verificarBloqueio } from "./tentativas";

const agora = new Date("2026-10-21T12:00:00Z");
const minutosAtras = (m: number) => new Date(agora.getTime() - m * 60_000);

describe("verificarBloqueio", () => {
  it("libera abaixo do limite", () => {
    const falhas = [1, 2, 3, 4].map(minutosAtras);
    expect(verificarBloqueio(falhas, 5, 15, agora).bloqueado).toBe(false);
  });

  it("bloqueia ao atingir o limite e informa quanto falta", () => {
    const falhas = [10, 8, 6, 4, 2].map(minutosAtras);
    expect(verificarBloqueio(falhas, 5, 15, agora)).toEqual({ bloqueado: true, minutosRestantes: 5 });
  });

  it("ignora erros antigos, fora da janela", () => {
    const falhas = [40, 30, 20, 3, 2].map(minutosAtras);
    expect(verificarBloqueio(falhas, 5, 15, agora).bloqueado).toBe(false);
  });
});
