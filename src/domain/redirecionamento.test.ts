import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./redirecionamento";

describe("destinoSeguro (volta depois do login)", () => {
  it("aceita páginas do próprio site", () => {
    expect(destinoSeguro("/carrinho")).toBe("/carrinho");
    expect(destinoSeguro("/pedido/abc?x=1")).toBe("/pedido/abc?x=1");
  });

  it("recusa endereços de outros sites", () => {
    for (const v of ["https://site-falso.com", "//site-falso.com", "/\\site-falso.com", "\\\\site-falso.com", "/x\n/y", "", null, 123]) {
      expect(destinoSeguro(v, "/"), String(v)).toBe("/");
    }
  });
});
