import { describe, expect, it } from "vitest";
import { MATERIAIS } from "../../prisma/dados-teste";
import { buscarProdutos, distancia, normalizar } from "./busca";

// Usa o catálogo real dos dados de teste
const catalogo = MATERIAIS.map((m) => ({
  id: m.id,
  name: m.nome,
  category: m.categoria,
  keywords: m.palavrasChave ?? "",
}));

const buscar = (texto: string) => buscarProdutos(catalogo, texto).encontrados.map((p) => p.id);
const primeiro = (texto: string) => buscar(texto)[0];

describe("normalizar", () => {
  it("remove acentos, maiúsculas e separa números de letras", () => {
    expect(normalizar("Areia MÉDIA")).toBe("areia media");
    expect(normalizar("CP2 50kg")).toBe("cp 2 50 kg");
  });
});

describe("distancia", () => {
  it("conta letras trocadas", () => {
    expect(distancia("cimento", "cimento")).toBe(0);
    expect(distancia("cimeto", "cimento")).toBe(1);
  });
});

describe("busca de materiais", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(primeiro("areia media")).toBe("areia-media");
    expect(primeiro("ARÉIA MÉDIA")).toBe("areia-media");
  });

  it("entende cimento CP II escrito de vários jeitos", () => {
    for (const texto of ["cimento cp2", "cimento cp ii", "Cimento CP-II", "cp2"]) {
      expect(buscar(texto), texto).toEqual(["cimento-cp2"]);
    }
  });

  it("aceita singular/plural sem confundir números", () => {
    expect(buscar("tijolo 8 furo")).toEqual(["tijolo-8-furos"]);
    expect(buscar("tijolos 6 furos")).toEqual(["tijolo-6-furos"]);
  });

  it("tolera pequenos erros de digitação", () => {
    expect(primeiro("cimeto")).toMatch(/^cimento/);
    expect(primeiro("argamasa ac3")).toBe("argamassa-ac3");
    expect(primeiro("vergalhao 10mm")).toBe("vergalhao-10mm");
  });

  it("não confunde palavras parecidas que existem no catálogo", () => {
    expect(buscar("tela")).toEqual(["malha-pop"]);
    expect(buscar("telha")).not.toContain("malha-pop");
  });

  it("usa a categoria só quando o nome não ajuda", () => {
    // "Areia e pedra" é a categoria das areias, mas "pedra" deve trazer só britas
    expect(buscar("pedra")).not.toContain("areia-media");
    expect(buscar("hidraulica")).toEqual(
      expect.arrayContaining(["tubo-pvc-25", "tubo-esgoto-100", "registro-gaveta"]),
    );
  });

  it("entende sinônimos de obra", () => {
    expect(buscar("pedra")).toEqual(expect.arrayContaining(["brita-1", "brita-0", "po-de-brita"]));
    expect(buscar("massa")).toEqual(
      expect.arrayContaining(["argamassa-ac1", "argamassa-assentamento", "massa-corrida"]),
    );
    expect(buscar("tijolo de concreto")).toEqual(
      expect.arrayContaining(["bloco-concreto-14", "bloco-concreto-9"]),
    );
    expect(buscar("tijolo de concreto")).not.toContain("tijolo-8-furos");
    expect(primeiro("fio 2,5")).toBe("cabo-2-5");
  });

  it("sugere materiais parecidos quando não acha tudo", () => {
    const resultado = buscarProdutos(catalogo, "areia rosa");
    expect(resultado.encontrados).toEqual([]);
    expect(resultado.sugeridos.map((p) => p.id)).toEqual(
      expect.arrayContaining(["areia-media", "areia-fina", "areia-grossa"]),
    );
  });

  it("devolve tudo quando a busca está vazia", () => {
    expect(buscar("")).toHaveLength(catalogo.length);
  });
});
