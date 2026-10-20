import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "cacheComponents" (cache avançado do Next.js) fica desligado de propósito:
  // o Solid mostra preços e pedidos sempre atualizados, e o modelo simples
  // (montar a página a cada acesso) é mais fácil de entender e manter.
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
