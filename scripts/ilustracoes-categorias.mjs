// =============================================================================
// Ilustrações provisórias das categorias (até chegarem as fotos reais).
// Gera public/categorias/<categoria>.jpg (1200 x 900 px) a partir dos desenhos
// abaixo. Rodar:  node scripts/ilustracoes-categorias.mjs
//
// ATENÇÃO: rodar de novo SOBRESCREVE as imagens. Depois de trocar por fotos
// reais (veja o README), não rode mais este programa — ou rode com o nome de
// uma categoria só:  node scripts/ilustracoes-categorias.mjs tintas
// =============================================================================
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const C = {
  fundo1: "#fff7ed",
  fundo2: "#ffedd5",
  laranja: "#ea580c",
  laranjaClaro: "#f97316",
  pessego: "#fdba74",
  creme: "#fed7aa",
  escuro: "#1e293b",
  cinza: "#64748b",
  cinzaClaro: "#cbd5e1",
  cinzaMuitoClaro: "#e2e8f0",
  branco: "#ffffff",
  sombra: "#0f172a",
};

/** Moldura comum: fundo em degradê, círculo decorativo e sombra no chão */
const cena = (desenho, { chao = 250, larguraChao = 150 } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="1200" height="900">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.fundo1}"/><stop offset="1" stop-color="${C.fundo2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#fundo)"/>
  <circle cx="330" cy="62" r="70" fill="${C.creme}" opacity=".55"/>
  <circle cx="60" cy="235" r="46" fill="${C.creme}" opacity=".45"/>
  <ellipse cx="200" cy="${chao}" rx="${larguraChao}" ry="14" fill="${C.sombra}" opacity=".10"/>
  ${desenho}
</svg>`;

// --- Desenhos ----------------------------------------------------------------

/** Saco de cimento sem marca (x,y = canto superior esquerdo) */
const saco = (x, y, w = 120, h = 66, cor = "#d6d3d1") => `
  <g transform="translate(${x} ${y})">
    <path d="M6 8 Q${w / 2} -4 ${w - 6} 8 Q${w + 4} ${h / 2} ${w - 6} ${h - 6} Q${w / 2} ${h + 6} 6 ${h - 6} Q-4 ${h / 2} 6 8Z" fill="${cor}"/>
    <path d="M6 8 Q${w / 2} -4 ${w - 6} 8" fill="none" stroke="#a8a29e" stroke-width="3"/>
    <rect x="${w * 0.12}" y="${h * 0.38}" width="${w * 0.76}" height="${h * 0.24}" rx="3" fill="${C.laranja}" opacity=".85"/>
    <path d="M${w * 0.2} ${h * 0.2} h${w * 0.3}" stroke="#a8a29e" stroke-width="3" stroke-linecap="round"/>
    <path d="M${w * 0.55} ${h * 0.78} h${w * 0.25}" stroke="#a8a29e" stroke-width="3" stroke-linecap="round"/>
  </g>`;

const DESENHOS = {
  "cimento-e-argamassa": () =>
    cena(`
    ${saco(78, 176)} ${saco(202, 176, 120, 66, "#e7e5e4")}
    ${saco(140, 116, 120, 66, "#e7e5e4")}
    <g transform="translate(330 150) rotate(-60)">
      <path d="M0 0 L46 -10 L40 14 Z" fill="${C.cinza}"/>
      <rect x="-30" y="-4" width="34" height="8" rx="4" fill="${C.laranja}"/>
    </g>`),

  "areia-e-pedra": () =>
    cena(
      `
    <path d="M40 252 Q120 120 180 128 Q240 136 300 252 Z" fill="#e9b872"/>
    <path d="M70 252 Q130 150 180 152 Q220 156 260 252 Z" fill="#f2c98a" opacity=".8"/>
    ${Array.from({ length: 40 }, (_, i) => `<circle cx="${70 + ((i * 53) % 200)}" cy="${170 + ((i * 37) % 75)}" r="1.6" fill="#b7824a" opacity=".6"/>`).join("")}
    <g>
      ${[
        [290, 242, 14], [312, 238, 12], [330, 244, 13], [302, 226, 11], [322, 222, 12], [312, 208, 10], [344, 236, 10], [278, 236, 9],
      ]
        .map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${["#94a3b8", "#64748b", "#a3a3a3", "#78716c"][i % 4]}"/>`)
        .join("")}
    </g>
    <g transform="translate(206 104) rotate(32)">
      <rect x="-3" y="-60" width="6" height="64" rx="3" fill="#a16207"/>
      <path d="M-16 2 h32 l-4 30 q-12 10 -24 0 z" fill="${C.cinza}"/>
    </g>`,
      { larguraChao: 170 },
    ),

  "tijolos-e-blocos": () => {
    const tijolo = (x, y, w = 58, h = 30) => `
      <g transform="translate(${x} ${y})">
        <rect width="${w}" height="${h}" rx="3" fill="#c2410c"/>
        <rect width="${w}" height="${h * 0.3}" rx="3" fill="#ea580c"/>
        ${[0, 1, 2, 3].map((c) => [0, 1].map((l) => `<rect x="${7 + c * 12.5}" y="${11 + l * 9}" width="8" height="6" rx="1.5" fill="#7c2d12" opacity=".75"/>`).join("")).join("")}
      </g>`;
    const linhas = [];
    for (let l = 0; l < 4; l++) {
      const n = 4 - (l === 3 ? 1 : 0);
      const desloc = l % 2 ? 31 : 0;
      for (let c = 0; c < n; c++) linhas.push(tijolo(80 + desloc + c * 62, 216 - l * 33));
    }
    return cena(`
      <rect x="70" y="248" width="270" height="8" rx="2" fill="#a16207"/>
      ${linhas.join("")}
      ${tijolo(292, 90)}`);
  },

  "aco-para-estrutura": () => {
    const barra = (y, i) => `
      <g transform="translate(0 ${y})">
        <rect x="40" y="-4" width="320" height="8" rx="4" fill="${i % 2 ? "#475569" : "#64748b"}"/>
        ${Array.from({ length: 26 }, (_, k) => `<path d="M${50 + k * 12} -4 l4 8" stroke="#334155" stroke-width="2"/>`).join("")}
      </g>`;
    return cena(`
      <g transform="rotate(-12 200 190)">
        ${[150, 162, 174, 186, 198, 210].map(barra).join("")}
        ${[110, 290].map((x) => `<rect x="${x}" y="142" width="10" height="76" rx="3" fill="${C.laranja}"/>`).join("")}
      </g>
      `);
  },

  "ferragens-ferramentas-e-epi": () =>
    cena(`
    <g transform="translate(60 118) scale(.9)">
      <path d="M0 80 Q0 0 80 0 Q160 0 160 80 Z" fill="${C.laranjaClaro}"/>
      <path d="M70 2 h20 v78 h-20z" fill="${C.laranja}"/>
      <rect x="-16" y="76" width="192" height="16" rx="8" fill="${C.laranja}"/>
      <path d="M30 40 Q40 18 64 12" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".6"/>
    </g>
    <g transform="translate(222 232) rotate(-28)">
      <rect x="0" y="-6" width="120" height="12" rx="6" fill="#a16207"/>
      <path d="M118 -20 h22 q10 0 10 10 v20 q0 10 -10 10 h-22z" fill="${C.cinza}"/>
      <path d="M150 -12 q22 -10 26 -26" stroke="${C.cinza}" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>
    ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${96 + i * 14} ${226 + (i % 2) * 5}) rotate(${70 + i * 8})"><rect x="-1.5" y="0" width="3" height="34" fill="#475569"/><rect x="-5" y="-2" width="10" height="3" rx="1" fill="#334155"/></g>`).join("")}`),

  hidraulica: () =>
    cena(`
    <rect x="40" y="186" width="190" height="26" rx="6" fill="#b45309"/>
    <rect x="40" y="186" width="190" height="8" rx="4" fill="#d97706"/>
    <path d="M226 186 h40 q24 0 24 -24 v-70 h26 v70 q0 50 -50 50 h-40z" fill="#b45309"/>
    <rect x="286" y="78" width="34" height="16" rx="4" fill="#92400e"/>
    <rect x="150" y="226" width="200" height="26" rx="13" fill="${C.branco}" stroke="${C.cinzaClaro}" stroke-width="3"/>
    <rect x="140" y="222" width="22" height="34" rx="5" fill="${C.cinzaMuitoClaro}" stroke="${C.cinzaClaro}" stroke-width="3"/>
    <g transform="translate(110 150)">
      <rect x="-8" y="0" width="16" height="36" fill="#94a3b8"/>
      <circle cx="0" cy="-6" r="18" fill="none" stroke="${C.laranja}" stroke-width="7"/>
      <rect x="-3" y="-24" width="6" height="18" fill="${C.laranja}"/>
    </g>
    <path d="M318 108 q6 14 0 20 q-6 -6 0 -20z" fill="#38bdf8"/>
    <path d="M330 126 q6 14 0 20 q-6 -6 0 -20z" fill="#38bdf8" opacity=".7"/>`),

  eletrica: () => {
    const rolo = (x, y, r, cor) => `
      <g transform="translate(${x} ${y})">
        ${[1, 0.82, 0.64, 0.46].map((k, i) => `<circle r="${r * k}" fill="none" stroke="${cor}" stroke-width="${r * 0.16}" opacity="${1 - i * 0.12}"/>`).join("")}
        <circle r="${r * 0.3}" fill="${C.fundo2}"/>
      </g>`;
    return cena(`
      ${rolo(130, 178, 62, "#dc2626")}
      ${rolo(232, 192, 50, "#2563eb")}
      ${rolo(312, 206, 36, "#16a34a")}
      <path d="M182 190 q30 40 70 46" stroke="#dc2626" stroke-width="8" fill="none" stroke-linecap="round"/>
      <g transform="translate(286 70)">
        <rect width="64" height="80" rx="10" fill="${C.branco}" stroke="${C.cinzaClaro}" stroke-width="3"/>
        <circle cx="22" cy="34" r="5" fill="${C.escuro}"/><circle cx="42" cy="34" r="5" fill="${C.escuro}"/>
        <circle cx="32" cy="52" r="4" fill="${C.escuro}"/>
      </g>
      <path d="M78 84 l-18 34 h16 l-10 30 l28 -42 h-16 l12 -22z" fill="${C.laranjaClaro}"/>`);
  },

  "pisos-e-revestimentos": () => {
    const piso = [];
    for (let l = 0; l < 5; l++)
      for (let c = 0; c < 5; c++) {
        const x = 200 + (c - l) * 34;
        const y = 120 + (c + l) * 20;
        const escuro = (c + l) % 2;
        piso.push(`<path d="M${x} ${y} l34 20 l-34 20 l-34 -20z" fill="${escuro ? "#cbd5e1" : "#f1f5f9"}" stroke="#94a3b8" stroke-width="1.5"/>`);
      }
    return cena(
      `
      ${piso.join("")}
      <g transform="translate(286 70)">
        <rect x="8" y="8" width="70" height="70" rx="4" fill="#fdba74"/>
        <rect x="0" y="0" width="70" height="70" rx="4" fill="${C.laranjaClaro}"/>
        <path d="M0 35 h70 M35 0 v70" stroke="${C.branco}" stroke-width="3" opacity=".7"/>
      </g>`,
      { chao: 262, larguraChao: 180 },
    );
  },

  tintas: () =>
    cena(`
    <g transform="translate(96 120)">
      <path d="M0 18 h120 v104 q0 12 -12 12 h-96 q-12 0 -12 -12z" fill="${C.cinzaMuitoClaro}" stroke="${C.cinzaClaro}" stroke-width="3"/>
      <ellipse cx="60" cy="18" rx="60" ry="14" fill="${C.laranjaClaro}"/>
      <ellipse cx="60" cy="18" rx="48" ry="9" fill="${C.laranja}"/>
      <rect x="10" y="54" width="100" height="40" rx="6" fill="${C.laranjaClaro}"/>
      <path d="M16 22 v22 q0 7 6 7 q6 0 6 -7 v-20" fill="${C.laranjaClaro}"/>
      <path d="M0 18 q60 -70 120 0" stroke="#475569" stroke-width="4" fill="none"/>
    </g>
    <g transform="translate(262 92) rotate(18)">
      <rect x="-40" y="0" width="80" height="34" rx="14" fill="${C.laranjaClaro}"/>
      <rect x="-40" y="0" width="80" height="10" rx="5" fill="${C.pessego}"/>
      <path d="M40 17 h14 v40 h-10 v60" stroke="#475569" stroke-width="6" fill="none" stroke-linejoin="round"/>
      <rect x="38" y="112" width="12" height="44" rx="6" fill="${C.escuro}"/>
    </g>`),

  madeiras: () => {
    const tabua = (y, x, cor) => `
      <g transform="translate(${x} ${y})">
        <rect width="250" height="26" rx="3" fill="${cor}"/>
        <path d="M12 9 q60 -6 110 2 t120 -2 M20 18 q70 6 140 0 t80 2" stroke="#92400e" stroke-width="1.5" fill="none" opacity=".45"/>
        <ellipse cx="250" cy="13" rx="9" ry="13" fill="#f5d0a0"/>
        <ellipse cx="250" cy="13" rx="5" ry="8" fill="none" stroke="#b45309" stroke-width="1.5"/>
      </g>`;
    return cena(`
      ${tabua(222, 64, "#d6a467")}${tabua(194, 78, "#c8925a")}${tabua(166, 70, "#deb07a")}${tabua(138, 86, "#c8925a")}
      <g transform="translate(300 70) rotate(-35)">
        <rect x="0" y="0" width="16" height="110" rx="3" fill="#deb07a"/>
        <rect x="22" y="0" width="16" height="110" rx="3" fill="#c8925a"/>
      </g>`);
  },

  "telhas-e-coberturas": () => {
    const telhas = [];
    for (let l = 0; l < 6; l++)
      for (let c = 0; c < 12; c++) {
        const x = 40 + c * 30 - (l % 2) * 15;
        const y = 92 + l * 18;
        telhas.push(`<path d="M${x} ${y} q15 -16 30 0 v12 q-15 -10 -30 0z" fill="${l % 2 ? "#c2410c" : "#ea580c"}" stroke="#9a3412" stroke-width="1.5"/>`);
      }
    return cena(`
      <defs><clipPath id="telhado"><path d="M58 182 L200 72 L342 182 Z"/></clipPath></defs>
      <rect x="92" y="176" width="216" height="76" fill="${C.creme}" stroke="#fdba74" stroke-width="3"/>
      <rect x="182" y="200" width="36" height="52" rx="3" fill="#b45309"/>
      <rect x="114" y="196" width="40" height="30" rx="3" fill="${C.branco}" stroke="#94a3b8" stroke-width="3"/>
      <rect x="246" y="196" width="40" height="30" rx="3" fill="${C.branco}" stroke="#94a3b8" stroke-width="3"/>
      <rect x="252" y="70" width="22" height="50" rx="2" fill="#475569"/>
      <path d="M260 62 q8 -14 0 -26 M270 60 q8 -12 2 -22" stroke="${C.cinzaClaro}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g clip-path="url(#telhado)">${telhas.join("")}</g>
      <path d="M52 186 L200 70 L348 186" fill="none" stroke="#9a3412" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`);
  },
};

const pasta = new URL("../public/categorias/", import.meta.url);
mkdirSync(pasta, { recursive: true });
const pedidas = process.argv.slice(2);
for (const [nome, desenhar] of Object.entries(DESENHOS)) {
  if (pedidas.length && !pedidas.includes(nome)) continue;
  await sharp(Buffer.from(desenhar()))
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(new URL(`${nome}.jpg`, pasta).pathname);
  console.log(`✔ public/categorias/${nome}.jpg`);
}
