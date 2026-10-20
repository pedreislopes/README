// =============================================================================
// Validação de CPF e CNPJ
// =============================================================================
// Além do formato (11 ou 14 números), conferimos os "dígitos verificadores":
// os 2 últimos números são resultado de uma conta feita com os anteriores.
// Isso barra números digitados errado e inventados (ex.: 111.111.111-11).
// Não consulta a Receita Federal — só confere se o número é matematicamente válido.
// =============================================================================

/** Remove tudo que não for número: "123.456.789-09" -> "12345678909" */
export function somenteNumeros(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** Calcula um dígito verificador a partir dos números e dos pesos. */
function digitoVerificador(numeros: string, pesos: number[]): number {
  const soma = pesos.reduce((total, peso, i) => total + Number(numeros[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Calcula os 2 dígitos finais de um CPF a partir dos 9 primeiros números. */
export function digitosCpf(nove: string): string {
  const d1 = digitoVerificador(nove, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(nove + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${d1}${d2}`;
}

/** Calcula os 2 dígitos finais de um CNPJ a partir dos 12 primeiros números. */
export function digitosCnpj(doze: string): string {
  const d1 = digitoVerificador(doze, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(doze + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${d1}${d2}`;
}

/** Todos os números iguais (000..., 111...) passam na conta, mas não são válidos. */
function todosIguais(numeros: string): boolean {
  return /^(\d)\1+$/.test(numeros);
}

export function cpfValido(texto: string): boolean {
  const n = somenteNumeros(texto);
  if (n.length !== 11 || todosIguais(n)) return false;
  return digitosCpf(n.slice(0, 9)) === n.slice(9);
}

export function cnpjValido(texto: string): boolean {
  const n = somenteNumeros(texto);
  if (n.length !== 14 || todosIguais(n)) return false;
  return digitosCnpj(n.slice(0, 12)) === n.slice(12);
}

/** "12345678909" -> "123.456.789-09" */
export function formatarCpf(texto: string): string {
  return somenteNumeros(texto).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/** "11222333000181" -> "11.222.333/0001-81" */
export function formatarCnpj(texto: string): string {
  return somenteNumeros(texto).replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}
