// =============================================================================
// SOLID — Gravação dos dados de teste no banco
// =============================================================================
// Rodado automaticamente por "npm run banco:resetar".
// APAGA tudo o que estiver no banco e recria os dados de prisma/dados-teste.ts.
//
// Os preços variam entre as lojas de forma "sorteada", mas o sorteio usa
// sempre a mesma semente: rodando de novo, os preços saem iguais.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PASSO_PADRAO_POR_UNIDADE } from "../src/config/carrinho";
import { CUSTO_BCRYPT, VERSAO_TERMOS } from "../src/config/seguranca";
import type { Papel } from "../src/config/constantes";
import { calcularComissao } from "../src/domain/comissao";
import { digitosCnpj, digitosCpf } from "../src/domain/documentos";
import { digitoEan } from "../src/domain/marcas";
import { calcularItem } from "../src/domain/precos";
import { otimizarImagem } from "../src/lib/fotos";
import sharp from "sharp";
import { svgDeTeste } from "./fotos-teste";
import {
  CLIENTES,
  EMBALAGENS_ALTERNATIVAS,
  LOJAS,
  MATERIAIS,
  PEDIDOS_EXEMPLO,
  PRODUTOS_DE_MARCA,
  SENHA_TESTE,
  VERSAO_DADOS_TESTE,
  CHAVE_VERSAO_DADOS_TESTE,
  type MaterialTeste,
} from "./dados-teste";

// TRAVA DE SEGURANÇA: este programa APAGA todos os dados antes de gravar os de teste.
// Num banco da internet (PostgreSQL), só roda se o ambiente estiver marcado como teste.
const url = process.env.DATABASE_URL ?? "";
if (url.startsWith("postgres") && process.env.SOLID_AMBIENTE !== "teste") {
  console.error("✖ Recusado: banco PostgreSQL sem SOLID_AMBIENTE=teste. Os dados de teste apagam tudo.");
  process.exit(1);
}

const db = new PrismaClient();

// --- Regras de variação de preço -------------------------------------------
/** Diferença entre a loja mais barata e a mais cara: entre 8% e 20% */
const DIFERENCA_MIN = 0.08;
const DIFERENCA_MAX = 0.195; // um pouco abaixo de 20% para o arredondamento dos centavos não passar do limite
/** Lojas anunciantes (Destaque/Premium) ficam pelo menos 4% acima da mais barata (para o teste dos selos) */
const DESTAQUE_ACIMA_DO_MAIS_BARATO = 0.04;
/** Chance de uma loja vender um material / ter faixas de atacado */
const CHANCE_VENDER = 0.8;
const CHANCE_FAIXAS = 0.6;
/** Lojas que sempre têm faixas de atacado (facilita os testes) */
const LOJAS_SEMPRE_COM_FAIXAS = ["taguatinga", "sobradinho"];

const MARCAS: Record<string, string[]> = {
  "Cimento e argamassa": ["Ciplan", "Votoran", "CSN", "Quartzolit"],
  Hidráulica: ["Tigre", "Amanco", "Krona"],
  Elétrica: ["Sil", "Cobrecom", "Corfio"],
  Tintas: ["Suvinil", "Coral", "Iquine"],
};

// --- Sorteio com semente fixa (sempre gera a mesma sequência) ----------------
function criarSorteio(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sortear = criarSorteio(2026);
const entre = (min: number, max: number) => min + sortear() * (max - min);
const escolher = <T>(lista: T[]) => lista[Math.floor(sortear() * lista.length)];

/** Arredonda reais para centavos: acima de R$ 10, de 10 em 10 centavos. */
function paraCentavos(reais: number): number {
  return reais >= 10 ? Math.round(reais * 10) * 10 : Math.round(reais * 100);
}

/** Gera um CPF/CNPJ válido a partir de um número base (só para teste). */
const cpfTeste = (n: number) => {
  const nove = String(n).padStart(9, "0");
  return nove + digitosCpf(nove);
};
const cnpjTeste = (n: number) => {
  const doze = String(n).padStart(8, "0") + "0001";
  return doze + digitosCnpj(doze);
};

/**
 * Decide quais lojas vendem o material e o "fator" de preço de cada uma
 * (1,00 = loja mais barata; 1,15 = 15% mais cara).
 */
function sortearFatores(lojasAprovadas: string[], anunciantes: Set<string>) {
  const vendem = lojasAprovadas.filter((id) => anunciantes.has(id) || sortear() < CHANCE_VENDER);
  // Garante pelo menos 4 lojas comparando preço
  for (const id of lojasAprovadas) {
    if (vendem.length >= 4) break;
    if (!vendem.includes(id)) vendem.push(id);
  }

  const comuns = vendem.filter((id) => !anunciantes.has(id));
  const brutos = comuns.map(() => sortear());
  const menor = Math.min(...brutos);
  const maior = Math.max(...brutos);
  const diferenca = entre(DIFERENCA_MIN, DIFERENCA_MAX);

  const fatores = new Map<string, number>();
  comuns.forEach((id, i) => {
    // Reescala para que a mais barata fique em 1,00 e a mais cara em 1 + diferença
    const proporcao = maior === menor ? 0 : (brutos[i] - menor) / (maior - menor);
    fatores.set(id, 1 + proporcao * diferenca);
  });
  for (const id of vendem.filter((x) => anunciantes.has(x))) {
    fatores.set(id, 1 + entre(DESTAQUE_ACIMA_DO_MAIS_BARATO, diferenca));
  }
  return fatores;
}

async function main() {
  console.log("Limpando o banco…");
  await db.adminLog.deleteMany();
  await db.storeImport.deleteMany();
  await db.catalogImport.deleteMany();
  await db.passwordReset.deleteMany();
  await db.adRotation.deleteMany();
  await db.materialSuggestion.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.purchase.deleteMany();
  await db.priceTier.deleteMany();
  await db.offer.deleteMany();
  await db.photoSubmission.deleteMany();
  await db.catalogItem.deleteMany();
  await db.photo.deleteMany();
  await db.product.deleteMany();
  await db.store.deleteMany();
  await db.session.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.user.deleteMany();

  // Mesmo custo do cadastro real: o tempo de resposta do login não pode variar
  const senha = await bcrypt.hash(SENHA_TESTE, CUSTO_BCRYPT);

  console.log("Criando clientes e administrador…");
  for (const [i, c] of CLIENTES.entries()) {
    await db.user.create({
      data: {
        name: c.nome,
        email: c.email,
        passwordHash: senha,
        role: c.papel,
        document: c.papel === "CNPJ" ? cnpjTeste(45120330 + i) : cpfTeste(123456780 + i * 7),
        phone: c.telefone,
        termsAcceptedAt: new Date(),
        termsVersion: VERSAO_TERMOS,
      },
    });
  }

  console.log("Criando lojas…");
  for (const [i, loja] of LOJAS.entries()) {
    const cnpj = cnpjTeste(30100200 + i * 1111);
    await db.store.create({
      data: {
        id: loja.id,
        name: loja.nome,
        cnpj,
        region: loja.regiao,
        address: loja.endereco,
        phone: loja.telefone,
        status: loja.status,
        commissionPercent: loja.comissao,
        adPlan: loja.plano ?? "NENHUM",
        owner: {
          create: {
            name: loja.dono.nome,
            email: loja.dono.email,
            passwordHash: senha,
            role: "LOJISTA",
            document: cnpj,
            phone: loja.telefone,
            termsAcceptedAt: new Date(),
            termsVersion: VERSAO_TERMOS,
          },
        },
      },
    });
  }

  console.log("Criando materiais e ofertas…");
  const aprovadas = LOJAS.filter((l) => l.status === "APROVADA").map((l) => l.id);
  // Lojas com plano de anúncio (Destaque ou Premium)
  const anunciantes = new Set(LOJAS.filter((l) => l.plano).map((l) => l.id));
  const pendentes = LOJAS.filter((l) => l.status === "PENDENTE").map((l) => l.id);
  /** Preço por unidade base de cada loja, para as embalagens alternativas */
  const precoBase = new Map<string, number>();

  async function criarOferta(
    m: MaterialTeste,
    lojaId: string,
    reais: number,
    embalagem = m.embalagem,
    quantidadeBase = m.quantidadeBase,
    comFaixas = false,
  ) {
    const priceCents = paraCentavos(reais);
    const marcas = m.marcas ?? MARCAS[m.categoria];
    await db.offer.create({
      data: {
        storeId: lojaId,
        productId: m.id,
        brand: marcas ? escolher(marcas) : null,
        packageLabel: embalagem,
        baseQuantity: quantidadeBase,
        priceCents,
        // Areia e brita (m³) de 0,5 em 0,5; o resto só em quantidades inteiras
        quantityStep: quantidadeBase === 1 ? (PASSO_PADRAO_POR_UNIDADE[m.unidadeBase] ?? 1) : 1,
        tiersForCpf: comFaixas && (m.faixasParaCpf ?? false),
        tiers: comFaixas
          ? {
              create: m.faixas!.map((f) => ({
                minQuantity: f.min,
                priceCents: paraCentavos((priceCents / 100) * (1 - f.desconto)),
              })),
            }
          : undefined,
      },
    });
    return priceCents;
  }

  for (const m of MATERIAIS) {
    await db.product.create({
      data: {
        id: m.id,
        name: m.nome,
        category: m.categoria,
        baseUnit: m.unidadeBase,
        keywords: m.palavrasChave ?? "",
        brandMatters: !!m.caracteristicas,
        specTemplate: m.caracteristicas ?? "",
      },
    });
    // Produto de marca: as ofertas são criadas a partir do catálogo central (abaixo)
    if (m.caracteristicas) continue;

    const fatores = sortearFatores(aprovadas, anunciantes);
    // A loja pendente vende parte dos materiais (aparecem após a aprovação)
    for (const id of pendentes) if (sortear() < 0.5) fatores.set(id, entre(1, 1 + DIFERENCA_MAX));

    for (const [lojaId, fator] of fatores) {
      const comFaixas =
        !!m.faixas && (LOJAS_SEMPRE_COM_FAIXAS.includes(lojaId) || sortear() < CHANCE_FAIXAS);
      const centavos = await criarOferta(
        m,
        lojaId,
        m.precoReferencia * fator,
        undefined,
        undefined,
        comFaixas,
      );
      precoBase.set(`${m.id}|${lojaId}`, centavos / 100 / m.quantidadeBase);
    }
  }

  for (const alt of EMBALAGENS_ALTERNATIVAS) {
    const m = MATERIAIS.find((x) => x.id === alt.materialId)!;
    for (const lojaId of alt.lojas) {
      const porUnidade =
        precoBase.get(`${m.id}|${lojaId}`) ?? (m.precoReferencia / m.quantidadeBase) * entre(1, 1.1);
      await criarOferta(m, lojaId, porUnidade * alt.quantidadeBase * (1 + alt.acrescimo), alt.embalagem, alt.quantidadeBase);
    }
  }

  await criarCatalogoDeMarca(aprovadas, pendentes);
  await criarPedidosDeExemplo();

  // Sugestão de material aguardando o administrador
  await db.materialSuggestion.create({
    data: {
      storeId: "taguatinga",
      name: "Bloco de concreto estrutural 19x19x39 cm",
      category: "Tijolos e blocos",
      baseUnit: "un",
      note: "Muito pedido por construtoras de Taguatinga.",
    },
  });
  // Sugestão de PRODUTO DE MARCA (o lojista informa só marca, modelo e código de barras)
  await db.materialSuggestion.create({
    data: {
      storeId: "taguatinga",
      kind: "PRODUTO_MARCA",
      name: "Forja Cerrado MU-29 fibra",
      category: "Ferragens, ferramentas e EPI",
      baseUnit: "un",
      typeProductId: "martelo-unha",
      brand: "Forja Cerrado",
      model: "MU-29 fibra",
      ean: eanDeTeste(900),
      note: "Clientes pedem o modelo de 29 mm.",
    },
  });
  await conferir(anunciantes);

  // Marca a versão dos dados de teste (o ambiente de teste regrava quando ela muda)
  await db.systemSetting.upsert({
    where: { key: CHAVE_VERSAO_DADOS_TESTE },
    create: { key: CHAVE_VERSAO_DADOS_TESTE, value: VERSAO_DADOS_TESTE },
    update: { value: VERSAO_DADOS_TESTE },
  });
}

/** Código de barras fictício e válido, na faixa 200 (uso interno, nunca é de um produto real) */
function eanDeTeste(n: number) {
  const doze = "200" + String(n).padStart(9, "0");
  return doze + digitoEan(doze);
}

async function fotoDeTeste(materialId: string, cor: string | undefined, publica: boolean) {
  const svg = svgDeTeste(materialId, cor);
  if (!svg) return null;
  const foto = await otimizarImagem(await sharp(Buffer.from(svg)).png().toBuffer());
  if ("erro" in foto) throw new Error(foto.erro);
  return (await db.photo.create({ data: { ...foto, public: publica }, select: { id: true } })).id;
}

/**
 * Catálogo central de produtos de marca + ofertas das lojas.
 * Cada item é vendido por 2 a 4 lojas, com preços até 15% diferentes entre elas.
 */
async function criarCatalogoDeMarca(aprovadas: string[], pendentes: string[]) {
  console.log("Criando o catálogo de produtos de marca…");
  for (const [i, item] of PRODUTOS_DE_MARCA.entries()) {
    const m = MATERIAIS.find((x) => x.id === item.materialId)!;
    const photoId = item.foto ? await fotoDeTeste(m.id, item.cor, true) : null;
    const criado = await db.catalogItem.create({
      data: {
        productId: m.id,
        brand: item.marca,
        model: item.modelo,
        ean: eanDeTeste(i + 1),
        packageLabel: m.embalagem,
        baseQuantity: m.quantidadeBase,
        specs: JSON.stringify(item.caracteristicas),
        photoId,
        photoSource: photoId ? "Ilustração de teste" : null,
        photoAuthorization: photoId ? "Imagem fictícia gerada para os dados de teste" : null,
      },
    });

    // Sorteia de 2 a 4 lojas aprovadas (e às vezes a pendente)
    const lojas = [...aprovadas].sort(() => sortear() - 0.5).slice(0, 2 + Math.floor(sortear() * 3));
    for (const id of pendentes) if (sortear() < 0.3) lojas.push(id);
    for (const lojaId of lojas) {
      await db.offer.create({
        data: {
          storeId: lojaId,
          productId: m.id,
          catalogItemId: criado.id,
          brand: item.marca,
          packageLabel: m.embalagem,
          baseQuantity: m.quantidadeBase,
          priceCents: paraCentavos(item.preco * entre(1, 1.15)),
        },
      });
    }
  }

  // Foto enviada por um lojista, aguardando a aprovação do administrador
  const semFoto = await db.catalogItem.findFirstOrThrow({ where: { productId: "martelo-unha", photoId: null }, orderBy: { brand: "asc" } });
  const photoId = (await fotoDeTeste("martelo-unha", "#0f766e", false))!;
  await db.photoSubmission.create({
    data: {
      catalogItemId: semFoto.id,
      storeId: "taguatinga",
      photoId,
      source: "Foto própria da loja",
      authorization: "Tirada pela equipe da loja",
    },
  });
}

/** Cria pedidos de exemplo usando as MESMAS regras de preço e comissão do site */
async function criarPedidosDeExemplo() {
  console.log("Criando pedidos de exemplo…");
  for (const exemplo of PEDIDOS_EXEMPLO) {
    const cliente = await db.user.findUniqueOrThrow({ where: { email: exemplo.cliente } });
    const data = new Date(Date.now() - exemplo.diasAtras * 24 * 60 * 60 * 1000);
    const pedidos = [];

    for (const p of exemplo.lojas) {
      const loja = await db.store.findUniqueOrThrow({ where: { id: p.loja } });
      const itens = [];
      const usados: string[] = [];
      let economia = 0;
      for (const [materialId, quantidade] of p.itens) {
        const principal = MATERIAIS.find((m) => m.id === materialId)!.embalagem;
        const oferta = await db.offer.findFirst({
          where: { storeId: loja.id, productId: materialId, packageLabel: principal },
          include: { tiers: true, product: true },
        });
        // Se a loja não vende este material nos dados sorteados, usa outro produto dela
        const escolhida =
          oferta ??
          (await db.offer.findFirst({
            where: { storeId: loja.id, productId: { notIn: usados } },
            include: { tiers: true, product: true },
            orderBy: { productId: "asc" },
          }));
        if (!escolhida) continue;
        usados.push(escolhida.productId);
        const c = calcularItem(escolhida, cliente.role as Papel, quantidade, 1);
        itens.push({
          offerId: escolhida.id,
          productName: escolhida.product.name,
          packageLabel: escolhida.packageLabel,
          quantity: quantidade,
          listUnitPriceCents: c.listUnitCents,
          unitPriceCents: c.unitCents,
          totalCents: c.totalCents,
        });
        economia += c.economiaCents;
      }
      if (itens.length === 0) continue;
      const subtotal = itens.reduce((s, i) => s + i.totalCents, 0);
      pedidos.push({
        storeId: loja.id,
        status: p.status,
        subtotalCents: subtotal,
        savingsCents: economia,
        commissionPercent: loja.commissionPercent,
        commissionCents: calcularComissao(subtotal, loja.commissionPercent),
        createdAt: data,
        items: { create: itens },
      });
    }

    await db.purchase.create({
      data: {
        userId: cliente.id,
        createdAt: data,
        totalCents: pedidos.reduce((s, p) => s + p.subtotalCents, 0),
        savingsCents: pedidos.reduce((s, p) => s + p.savingsCents, 0),
        orders: { create: pedidos },
      },
    });
  }
}

/** Confere as regras pedidas para os dados de teste e mostra um resumo. */
async function conferir(anunciantes: Set<string>) {
  const produtos = await db.product.findMany({
    include: { offers: { include: { store: true, tiers: true } } },
  });
  const problemas: string[] = [];
  let menorDif = Infinity;
  let maiorDif = 0;

  for (const p of produtos.filter((x) => !x.brandMatters)) {
    // Compara só a embalagem principal, em lojas aprovadas
    const principal = MATERIAIS.find((m) => m.id === p.id)!.embalagem;
    const ofertas = p.offers
      .filter((o) => o.store.status === "APROVADA" && o.packageLabel === principal)
      .sort((a, b) => a.priceCents - b.priceCents);
    const dif = ofertas.at(-1)!.priceCents / ofertas[0].priceCents - 1;
    menorDif = Math.min(menorDif, dif);
    maiorDif = Math.max(maiorDif, dif);
    if (anunciantes.has(ofertas[0].storeId)) problemas.push(`${p.name}: loja anunciante é a mais barata`);
    if (dif < 0.05 || dif > 0.2) problemas.push(`${p.name}: diferença de ${(dif * 100).toFixed(1)}%`);
  }

  // Produtos de marca: cada item do catálogo é vendido por pelo menos 2 lojas aprovadas
  const itens = await db.catalogItem.findMany({ include: { offers: { include: { store: true } } } });
  for (const item of itens) {
    const lojas = item.offers.filter((o) => o.store.status === "APROVADA").length;
    if (lojas < 2) problemas.push(`${item.brand} ${item.model}: só ${lojas} loja(s)`);
  }
  const comFoto = itens.filter((i) => i.photoId).length;
  console.log(`✔ ${itens.length} produtos de marca no catálogo central (${comFoto} com foto)`);

  const totalOfertas = await db.offer.count();
  const comFaixas = await db.offer.count({ where: { tiers: { some: {} } } });
  const faixasCpf = await db.offer.findMany({
    where: { tiersForCpf: true },
    select: { productId: true },
    distinct: ["productId"],
  });

  console.log(`\n✔ ${await db.store.count()} lojas, ${produtos.length} materiais, ${totalOfertas} ofertas`);
  console.log(`✔ ${comFaixas} ofertas com faixas de atacado`);
  console.log(`✔ ${await db.order.count()} pedidos de exemplo (${await db.order.count({ where: { status: "NOVO" } })} novos)`);
  console.log(`✔ Faixas liberadas para CPF em: ${faixasCpf.map((f) => f.productId).join(", ")}`);
  console.log(
    `✔ Diferença entre a loja mais barata e a mais cara: de ${(menorDif * 100).toFixed(1)}% a ${(maiorDif * 100).toFixed(1)}%`,
  );
  if (problemas.length) {
    throw new Error("Dados de teste fora das regras:\n" + problemas.join("\n"));
  }
  console.log("✔ Lojas Destaque/Premium nunca são as mais baratas\n");
  console.log(`Usuários de teste criados. Senha de todos: ${SENHA_TESTE}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
