// Calculadora de obra: /calculadora?servico=muro&comprimento=10&altura=2
// 1. Escolha do serviço  2. Medidas  3. Lista de materiais com o menor preço
import Link from "next/link";
import { BrickWall, ChevronLeft, Info, Layers, PaintRoller, Square, SquareStack } from "lucide-react";
import { AVISO_ESTIMATIVA, PERDA_PADRAO, SERVICOS, type Servico } from "@/config/calculadora";
import {
  calcularServico,
  escolherLojaUnica,
  escolherOfertaMaisBarata,
  type Escolha,
  type ValoresInformados,
} from "@/domain/calculadora";
import { formatarQuantidade } from "@/domain/quantidades";
import { estiloCampo } from "@/components/Formulario";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";
import { ListaMateriais, type EscolhaParaLista, type MaterialParaLista } from "./ListaMateriais";

export const metadata = { title: "Calculadora de obra" };

const ICONES: Record<string, typeof BrickWall> = {
  muro: BrickWall,
  contrapiso: Layers,
  laje: SquareStack,
  reboco: PaintRoller,
  piso: Square,
};

export default async function Calculadora(props: PageProps<"/calculadora">) {
  const params = await props.searchParams;
  const valores: ValoresInformados = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const servico = SERVICOS.find((s) => s.id === valores.servico);

  if (!servico) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Calculadora de obra</h1>
          <p className="mt-1 text-slate-600">
            Escolha o serviço, informe as medidas e montamos a lista de materiais com o menor preço.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SERVICOS.map((s) => {
            const Icone = ICONES[s.id] ?? Square;
            return (
              <li key={s.id}>
                <Link
                  href={`/calculadora?servico=${s.id}`}
                  className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-marca-500"
                >
                  <span className="rounded-xl bg-marca-50 p-3 text-marca-600">
                    <Icone className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-bold">{s.nome}</span>
                    <span className="block text-sm text-slate-600">{s.descricao}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Aviso />
      </div>
    );
  }

  // Só calcula depois que o cliente enviou o formulário
  const enviado = valores.calcular === "1";
  const resultado = enviado ? calcularServico(servico, valores, PERDA_PADRAO) : null;
  const erros = resultado && !resultado.ok ? resultado.erros : {};

  return (
    <div className="space-y-5">
      <Link href="/calculadora" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Outros serviços
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold">{servico.nome}</h1>
        <p className="mt-1 text-slate-600">{servico.descricao}</p>
      </div>

      <FormularioMedidas servico={servico} valores={valores} erros={erros} />

      {resultado?.ok && <Resultado servico={servico} resultado={resultado} />}
    </div>
  );
}

function Aviso() {
  return (
    <p role="note" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      {AVISO_ESTIMATIVA}
    </p>
  );
}

function FormularioMedidas({
  servico,
  valores,
  erros,
}: {
  servico: Servico;
  valores: ValoresInformados;
  erros: Record<string, string>;
}) {
  return (
    <form action="/calculadora" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="servico" value={servico.id} />
      <input type="hidden" name="calcular" value="1" />
      <div className="grid grid-cols-2 gap-3">
        {servico.campos.map((c) => (
          <div key={c.id}>
            <label htmlFor={c.id} className="block text-sm font-semibold">
              {c.rotulo} ({c.unidade})
            </label>
            <input
              id={c.id}
              name={c.id}
              inputMode="decimal"
              required={c.padrao === undefined}
              defaultValue={valores[c.id] ?? (c.padrao !== undefined ? formatarQuantidade(c.padrao) : "")}
              aria-invalid={erros[c.id] ? true : undefined}
              className={estiloCampo}
            />
            {erros[c.id] ? (
              <p className="mt-1 text-sm font-medium text-red-600">{erros[c.id]}</p>
            ) : (
              c.ajuda && <p className="mt-1 text-xs text-slate-500">{c.ajuda}</p>
            )}
          </div>
        ))}
        {servico.opcao && (
          <div>
            <label htmlFor={servico.opcao.id} className="block text-sm font-semibold">
              {servico.opcao.rotulo}
            </label>
            <select
              id={servico.opcao.id}
              name={servico.opcao.id}
              defaultValue={valores[servico.opcao.id] ?? servico.opcao.valores[0].valor}
              className={estiloCampo}
            >
              {servico.opcao.valores.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.rotulo}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <button type="submit" className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800">
        Calcular materiais
      </button>
    </form>
  );
}

async function Resultado({
  servico,
  resultado,
}: {
  servico: Servico;
  resultado: Extract<ReturnType<typeof calcularServico>, { ok: true }>;
}) {
  const usuario = await usuarioAtual();
  const papel = usuario?.role ?? null;

  // Ofertas à venda de cada material calculado
  const ids = resultado.materiais.map((m) => m.material.produtoId);
  const produtos = await db.product.findMany({
    where: { id: { in: ids } },
    include: {
      offers: {
        where: { active: true, store: { status: "APROVADA" } },
        include: { tiers: true, store: { select: { name: true, region: true } } },
      },
    },
  });

  type OfertaDoBanco = (typeof produtos)[number]["offers"][number];
  const ofertasPorProduto = new Map(produtos.map((p) => [p.id, p.offers]));

  // Plano 1: menor preço por item (cada material na loja mais barata para ele)
  // Plano 2: tudo numa loja só (a mais completa e, entre essas, a mais barata)
  const lojaUnica = escolherLojaUnica(
    resultado.materiais.map((m) => ({ produtoId: m.material.produtoId, exato: m.exato })),
    ofertasPorProduto,
    papel,
  );

  const paraLista = (escolha: Escolha<OfertaDoBanco> | null | undefined): EscolhaParaLista | null =>
    escolha
      ? {
          offerId: escolha.oferta.id,
          loja: escolha.oferta.store.name,
          regiao: escolha.oferta.store.region,
          packageLabel: escolha.oferta.packageLabel,
          passo: escolha.oferta.quantityStep,
          embalagens: escolha.embalagens,
          embalagensExatas: escolha.embalagensExatas,
          oferta: {
            priceCents: escolha.oferta.priceCents,
            baseQuantity: escolha.oferta.baseQuantity,
            tiersForCpf: escolha.oferta.tiersForCpf,
            tiers: escolha.oferta.tiers.map((t) => ({ minQuantity: t.minQuantity, priceCents: t.priceCents })),
          },
        }
      : null;

  const materiais: MaterialParaLista[] = resultado.materiais.map((m) => {
    const produto = produtos.find((p) => p.id === m.material.produtoId);
    return {
      produtoId: m.material.produtoId,
      nome: produto?.name ?? m.material.nome,
      explicacao: m.explicacao,
      fonte: m.material.fonte,
      conferir: m.material.conferir,
      exatoTexto: `${formatarQuantidade(Math.round(m.exato * 100) / 100)} ${m.material.unidadeTexto}`,
      porItem: paraLista(produto ? escolherOfertaMaisBarata(m.exato, produto.offers, papel) : null),
      lojaUnica: paraLista(lojaUnica?.escolhas.get(m.material.produtoId)),
    };
  });
  const nomeLojaUnica = lojaUnica
    ? produtos.flatMap((p) => p.offers).find((o) => o.storeId === lojaUnica.storeId)!.store
    : null;

  return (
    <section className="space-y-4">
      <Aviso />
      <div className="rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-sm text-slate-300">Medida calculada</p>
        <p className="text-lg font-bold">{resultado.medida.texto}</p>
        <p className="mt-1 text-sm text-slate-300">
          Já incluímos {Math.round(resultado.perda * 100)}% de perda. As quantidades são arredondadas para cima no
          formato vendido pelas lojas.
        </p>
      </div>
      {servico.observacao && <p className="text-sm text-slate-600">{servico.observacao}</p>}
      <h2 className="text-lg font-bold">Materiais (revise antes de montar o carrinho)</h2>
      <ListaMateriais materiais={materiais} papel={papel} lojaUnica={nomeLojaUnica} />
    </section>
  );
}
