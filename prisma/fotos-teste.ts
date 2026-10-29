// =============================================================================
// Fotos FICTÍCIAS dos produtos de marca dos dados de teste
// =============================================================================
// Desenhos simples em fundo branco (como as fotos de catálogo de fabricante),
// gerados aqui mesmo: nenhuma imagem da internet. Sem textos, para funcionar
// em qualquer computador (inclusive na Vercel, que não tem fontes instaladas).
// =============================================================================

const fundo = (desenho: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">
  <rect width="400" height="400" fill="#ffffff"/>
  <ellipse cx="200" cy="350" rx="140" ry="12" fill="#0f172a" opacity=".08"/>
  ${desenho}
</svg>`;

const DESENHOS: Record<string, (cor: string) => string> = {
  "martelo-unha": (cor) => `
    <g transform="rotate(-30 200 200)">
      <rect x="185" y="120" width="30" height="230" rx="12" fill="${cor}"/>
      <rect x="185" y="270" width="30" height="80" rx="12" fill="#1e293b" opacity=".85"/>
      <path d="M120 90 h150 q14 0 14 14 v36 q0 14 -14 14 h-150 q-8 0 -8 -8 v-48 q0 -8 8 -8z" fill="#64748b"/>
      <path d="M284 100 q40 -6 60 -50 q-30 30 -60 24z M284 140 q40 6 60 50 q-30 -30 -60 -24z" fill="#64748b"/>
      <rect x="120" y="96" width="40" height="52" rx="4" fill="#94a3b8"/>
    </g>`,
  "trena-5m": (cor) => `
    <rect x="90" y="110" width="200" height="200" rx="40" fill="${cor}"/>
    <rect x="120" y="140" width="140" height="140" rx="70" fill="#1e293b" opacity=".85"/>
    <circle cx="190" cy="210" r="22" fill="${cor}"/>
    <rect x="270" y="270" width="90" height="30" rx="4" fill="#facc15" stroke="#a16207" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${282 + i * 14} 270 v${i % 2 ? 10 : 16}" stroke="#1e293b" stroke-width="2"/>`).join("")}
    <rect x="250" y="120" width="26" height="40" rx="6" fill="#1e293b"/>`,
  "nivel-aluminio": (cor) => `
    <rect x="40" y="170" width="320" height="60" rx="8" fill="${cor}"/>
    <rect x="40" y="170" width="320" height="14" rx="6" fill="#cbd5e1"/>
    <rect x="170" y="186" width="60" height="30" rx="14" fill="#bbf7d0" stroke="#15803d" stroke-width="3"/>
    <circle cx="200" cy="201" r="7" fill="#15803d" opacity=".6"/>
    <rect x="70" y="186" width="30" height="30" rx="14" fill="#bbf7d0" stroke="#15803d" stroke-width="3"/>`,
  "colher-pedreiro": (cor) => `
    <path d="M90 120 L310 200 L120 300 Z" fill="#94a3b8" stroke="#64748b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M300 196 l40 -50" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
    <rect x="320" y="80" width="26" height="80" rx="12" transform="rotate(40 333 120)" fill="${cor}"/>`,
  "desempenadeira-aco": (cor) => `
    <rect x="60" y="210" width="280" height="90" rx="10" fill="#94a3b8" stroke="#64748b" stroke-width="4"/>
    <path d="M120 210 v-40 h160 v40" fill="none" stroke="#475569" stroke-width="10"/>
    <rect x="110" y="120" width="180" height="50" rx="24" fill="${cor}"/>`,
  "tinta-acrilica-18": (cor) => `
    <path d="M110 120 h180 v190 q0 20 -20 20 h-140 q-20 0 -20 -20z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
    <ellipse cx="200" cy="120" rx="90" ry="18" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="110" y="170" width="180" height="100" fill="${cor}"/>
    <rect x="130" y="190" width="70" height="12" rx="6" fill="#ffffff" opacity=".85"/>
    <rect x="130" y="212" width="110" height="8" rx="4" fill="#ffffff" opacity=".6"/>
    <path d="M110 120 q90 -90 180 0" fill="none" stroke="#64748b" stroke-width="6"/>`,
  "piso-ceramico-60": (cor) => `
    <g transform="translate(200 210) skewX(-20) scale(1 .7)">
      ${[0, 1].map((l) => [0, 1].map((c) => `<rect x="${-150 + c * 152}" y="${-150 + l * 152}" width="148" height="148" fill="${cor}" stroke="#ffffff" stroke-width="6"/>`).join("")).join("")}
      <path d="M-120 -120 q60 30 120 0 t110 10" stroke="#ffffff" stroke-width="3" fill="none" opacity=".5"/>
    </g>`,
  "porcelanato-60": (cor) => `
    <g transform="translate(200 210) skewX(-20) scale(1 .7)">
      ${[0, 1].map((l) => [0, 1].map((c) => `<rect x="${-150 + c * 151}" y="${-150 + l * 151}" width="149" height="149" fill="${cor}" stroke="#cbd5e1" stroke-width="2"/>`).join("")).join("")}
      <path d="M-140 -60 l90 -80 M-60 120 l150 -140" stroke="#ffffff" stroke-width="10" opacity=".7"/>
    </g>`,
  "registro-gaveta": (cor) => `
    <rect x="60" y="210" width="280" height="44" rx="8" fill="${cor}"/>
    <rect x="160" y="180" width="80" height="100" rx="12" fill="${cor}" stroke="#854d0e" stroke-width="4"/>
    <rect x="190" y="120" width="20" height="62" fill="#a16207"/>
    <rect x="150" y="104" width="100" height="22" rx="8" fill="#a16207"/>
    ${[70, 90, 290, 310].map((x) => `<path d="M${x} 212 v40" stroke="#854d0e" stroke-width="3"/>`).join("")}`,
  "disjuntor-20a": (cor) => `
    <rect x="140" y="80" width="120" height="250" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="5"/>
    <rect x="160" y="150" width="80" height="110" rx="6" fill="#e2e8f0"/>
    <rect x="182" y="170" width="36" height="60" rx="6" fill="${cor}"/>
    <rect x="160" y="100" width="80" height="18" rx="4" fill="#cbd5e1"/>
    <rect x="160" y="290" width="80" height="18" rx="4" fill="#cbd5e1"/>`,
};

export function svgDeTeste(materialId: string, cor = "#ea580c"): string | null {
  const desenho = DESENHOS[materialId];
  return desenho ? fundo(desenho(cor)) : null;
}
