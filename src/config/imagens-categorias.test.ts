import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "./constantes";
import { imagemDaCategoria, nomeDoArquivoDaCategoria } from "./imagens-categorias";

describe("imagens das categorias", () => {
  it("nome do arquivo sem acentos, vírgulas nem espaços", () => {
    expect(nomeDoArquivoDaCategoria("Ferragens, ferramentas e EPI")).toBe("ferragens-ferramentas-e-epi");
    expect(nomeDoArquivoDaCategoria("Aço para estrutura")).toBe("aco-para-estrutura");
    expect(nomeDoArquivoDaCategoria("Hidráulica")).toBe("hidraulica");
  });

  it("toda categoria tem a sua imagem em public/categorias", () => {
    const faltando = CATEGORIAS.filter((c) => !existsSync(`public${imagemDaCategoria(c)}`));
    expect(faltando).toEqual([]);
  });
});
