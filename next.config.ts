import type { NextConfig } from "next";

/** Cabeçalhos de segurança enviados em todas as páginas */
const CABECALHOS_SEGURANCA = [
  // Impede que o Solid seja exibido dentro de outro site (golpe de "clique disfarçado")
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador não tenta "adivinhar" o tipo dos arquivos
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ao clicar num link externo, não envia o endereço completo da página do Solid
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O site não usa câmera, microfone nem localização
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // "cacheComponents" (cache avançado do Next.js) fica desligado de propósito:
  // o Solid mostra preços e pedidos sempre atualizados, e o modelo simples
  // (montar a página a cada acesso) é mais fácil de entender e manter.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Envio de fotos: o navegador já reduz a foto (normalmente < 1 MB); 4 MB é a
      // folga, abaixo do limite de 4,5 MB por envio da Vercel
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
