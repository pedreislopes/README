// Em qual ambiente o site está rodando.
// Na Vercel, o ambiente de TESTE é marcado com a variável SOLID_AMBIENTE=teste
// (configurada no painel da Vercel, não no código).

export const ehAmbienteDeTeste = () => process.env.SOLID_AMBIENTE === "teste";

export const TEXTO_AMBIENTE_TESTE = "Versão de teste — dados fictícios. Nenhuma compra é real.";
