/**
 * Endereço para onde voltar depois do login. Só aceita páginas do PRÓPRIO site,
 * para ninguém usar um link do Solid para mandar o cliente a um site falso.
 * Recusa "//site.com" e "/\site.com" (alguns navegadores tratam a barra
 * invertida como barra normal).
 */
export function destinoSeguro(voltar: unknown, padrao = "/"): string {
  const v = typeof voltar === "string" ? voltar : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return padrao;
  // Caracteres de controle (quebras de linha etc.) também são recusados
  return /[\u0000-\u001f]/.test(v) ? padrao : v;
}
