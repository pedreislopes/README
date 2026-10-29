import { describe, expect, it } from "vitest";
import { REGIOES, REGIOES_DF, REGIOES_EM_GRUPOS, REGIOES_ENTORNO, regioesDoFiltro, rotuloRegiao } from "./constantes";

describe("Regiões", () => {
  it("tem as 35 regiões administrativas oficiais do DF, sem repetição", () => {
    expect(REGIOES_DF).toHaveLength(35);
    expect(new Set(REGIOES).size).toBe(REGIOES.length);
    for (const r of ["Lago Sul", "Lago Norte", "Arapoanga", "Água Quente", "Sol Nascente/Pôr do Sol"]) {
      expect(REGIOES_DF).toContain(r);
    }
  });

  it("tem as principais cidades do Entorno", () => {
    for (const r of ["Valparaíso de Goiás", "Águas Lindas de Goiás", "Luziânia", "Formosa", "Novo Gama", "Cidade Ocidental"]) {
      expect(REGIOES_ENTORNO).toContain(r);
    }
  });

  it("lista em ordem alfabética, separada em DF e Entorno", () => {
    expect(REGIOES_EM_GRUPOS.map((g) => g.grupo.nome)).toEqual(["DF", "Entorno"]);
    expect(REGIOES_EM_GRUPOS[0].regioes[0]).toBe("Água Quente");
    expect(REGIOES_EM_GRUPOS[1].regioes[0]).toBe("Águas Lindas de Goiás");
  });

  it("interpreta o filtro: região, todo o DF, todo o Entorno ou inválido", () => {
    expect(regioesDoFiltro("Lago Sul")?.regioes).toEqual(["Lago Sul"]);
    expect(regioesDoFiltro("DF")?.regioes).toHaveLength(35);
    expect(regioesDoFiltro("Entorno")?.rotulo).toBe("Todo o Entorno");
    expect(regioesDoFiltro("Asa Sul")).toBeNull(); // bairro, não região oficial
    expect(regioesDoFiltro("")).toBeNull();
  });

  it("mostra os bairros conhecidos do Plano Piloto", () => {
    expect(rotuloRegiao("Plano Piloto")).toBe("Plano Piloto (Asa Norte, Asa Sul, Noroeste)");
    expect(rotuloRegiao("Gama")).toBe("Gama");
  });
});
