// =============================================================================
// Imagens das categorias (página inicial)
// =============================================================================
// Cada categoria usa o arquivo public/categorias/<nome-da-categoria>.jpg
// (ex.: "Areia e pedra" -> public/categorias/areia-e-pedra.jpg).
// Para trocar por uma foto real, basta substituir o arquivo mantendo o MESMO
// nome (veja o passo a passo no README, seção "Fotos das categorias").
// O site redimensiona e otimiza a foto sozinho para cada tela.
// =============================================================================

/** "Ferragens, ferramentas e EPI" -> "ferragens-ferramentas-e-epi" */
export function nomeDoArquivoDaCategoria(categoria: string): string {
  return categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const imagemDaCategoria = (categoria: string) => `/categorias/${nomeDoArquivoDaCategoria(categoria)}.jpg`;
