// =============================================================================
// Fotos dos produtos de marca: limites do envio e tamanhos gerados
// =============================================================================

/** Formatos aceitos no envio (o arquivo é conferido por dentro, não só pelo nome) */
export const FORMATOS_FOTO = ["jpeg", "png", "webp"] as const;
export const ACCEPT_FOTO = "image/jpeg,image/png,image/webp";
export const NOMES_FORMATOS_FOTO = "JPG, PNG ou WEBP";

/** Tamanho máximo do arquivo escolhido */
export const FOTO_MAX_MB = 5;
export const FOTO_MAX_BYTES = FOTO_MAX_MB * 1024 * 1024;

/**
 * Antes de enviar, o navegador já reduz a foto para no máximo este lado (em pixels),
 * para o envio ser rápido no 4G e caber no limite de envio da Vercel (4,5 MB).
 */
export const FOTO_LADO_ENVIO = 2000;

/** Versões guardadas (WebP): grande (página do produto, foto ampliada) e miniatura (listas) */
export const FOTO_LADO_GRANDE = 1200;
export const FOTO_LADO_MINIATURA = 360;

/** Fotos com mais pixels que isso são recusadas (proteção contra arquivos "bomba") */
export const FOTO_MAX_PIXELS = 50_000_000;

/** Exemplos de origem e autorização (o administrador escolhe ou escreve outra) */
export const ORIGENS_FOTO = ["Kit oficial do fabricante", "Foto própria da loja", "Foto própria do Solid", "Ilustração de teste"];

/** Endereço da foto: grande ou miniatura */
export const urlDaFoto = (id: string, mini = false) => `/fotos/${id}${mini ? "?t=mini" : ""}`;
