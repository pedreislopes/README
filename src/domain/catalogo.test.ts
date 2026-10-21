import { describe, expect, it } from "vitest";
import { gerarIdMaterial, validarMotivoAdmin } from "./catalogo";

describe("catálogo", () => {
  it("gera o código do material a partir do nome", () => {
    expect(gerarIdMaterial("Bloco de concreto 19x19x39 cm", new Set())).toBe("bloco-de-concreto-19x19x39-cm");
    expect(gerarIdMaterial("Cimento CP IV-32 (saco)", new Set())).toBe("cimento-cp-iv-32-saco");
  });

  it("não repete código já existente", () => {
    expect(gerarIdMaterial("Brita 2", new Set(["brita-2"]))).toBe("brita-2-2");
  });

  it("exige motivo para recusar ou suspender", () => {
    expect(validarMotivoAdmin("  ")).not.toBeNull();
    expect(validarMotivoAdmin("Documentação incompleta")).toBeNull();
  });
});
