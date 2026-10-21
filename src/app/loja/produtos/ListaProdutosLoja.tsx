"use client";

// Lista de produtos do lojista, pensada para quem não tem familiaridade com tecnologia:
// botões grandes, uma ação por vez e confirmação antes de mudanças em massa.

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Percent, Search } from "lucide-react";
import { normalizar } from "@/domain/busca";
import { reajustarPreco } from "@/domain/ofertas";
import { alterarPreco, alternarDisponivel, reajustarEmMassa } from "@/lib/acoes-loja";
import { formatarReais } from "@/lib/dinheiro";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  embalagem: string;
  marca: string | null;
  priceCents: number;
  ativo: boolean;
  faixas: { minQuantity: number; priceCents: number }[];
};

const paraTexto = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export function ListaProdutosLoja({ produtos }: { produtos: Produto[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [percentual, setPercentual] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  const [filtro, setFiltro] = useState("");

  // Filtro da lista (ignora acentos e maiúsculas). "Selecionar todos" vale para os itens filtrados.
  const visiveis = produtos.filter((p) =>
    normalizar(`${p.nome} ${p.embalagem} ${p.marca ?? ""}`).includes(normalizar(filtro)),
  );

  const alternar = (id: string) =>
    setSelecionados((s) => {
      const novo = new Set(s);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  const todos = visiveis.length > 0 && visiveis.every((p) => selecionados.has(p.id));

  const aplicar = (sinal: 1 | -1) => {
    const p = Number(percentual.replace(",", ".")) * sinal;
    const exemplo = produtos.find((x) => selecionados.has(x.id));
    const texto = `${sinal > 0 ? "Aumentar" : "Dar desconto de"} ${Math.abs(p).toLocaleString("pt-BR")}% em ${selecionados.size} ${
      selecionados.size === 1 ? "produto" : "produtos"
    }?${exemplo ? `\n\nExemplo: ${exemplo.nome} passa de ${formatarReais(exemplo.priceCents)} para ${formatarReais(reajustarPreco(exemplo.priceCents, p))}.` : ""}\n\nAs faixas de atacado também serão reajustadas.`;
    if (!window.confirm(texto)) return;
    iniciar(async () => {
      const r = await reajustarEmMassa([...selecionados], p);
      if (r.erro) setMensagem({ tipo: "erro", texto: r.erro });
      else {
        setMensagem({ tipo: "ok", texto: "Preços reajustados." });
        setSelecionados(new Set());
        setPercentual("");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Reajuste em massa */}
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 font-bold">
          <Percent className="h-5 w-5 text-marca-600" /> Reajustar vários preços
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-marca-600"
            checked={todos}
            onChange={() => setSelecionados(todos ? new Set() : new Set(visiveis.map((p) => p.id)))}
          />
          Selecionar todos{filtro ? " os filtrados" : ""} ({visiveis.length})
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            inputMode="decimal"
            placeholder="%"
            aria-label="Porcentagem"
            className="w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-center text-base"
          />
          <button
            type="button"
            disabled={enviando || selecionados.size === 0 || !percentual}
            onClick={() => aplicar(1)}
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            Aumentar
          </button>
          <button
            type="button"
            disabled={enviando || selecionados.size === 0 || !percentual}
            onClick={() => aplicar(-1)}
            className="flex-1 rounded-lg border border-slate-900 px-3 py-2.5 text-sm font-bold disabled:opacity-40"
          >
            Dar desconto
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {selecionados.size === 0
            ? "Marque os produtos na lista abaixo."
            : `${selecionados.size} ${selecionados.size === 1 ? "produto selecionado" : "produtos selecionados"}.`}
        </p>
        {mensagem && (
          <p className={`text-sm font-medium ${mensagem.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`}>{mensagem.texto}</p>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-marca-500">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          type="search"
          placeholder="Procurar na minha lista (ex.: cimento)"
          aria-label="Procurar na minha lista"
          className="w-full py-3 text-base focus:outline-none"
        />
      </label>
      {visiveis.length === 0 && <p className="text-center text-slate-600">Nenhum produto encontrado.</p>}

      <ul className="space-y-2">
        {visiveis.map((p) => (
          <ItemProduto key={p.id} produto={p} selecionado={selecionados.has(p.id)} onSelecionar={() => alternar(p.id)} />
        ))}
      </ul>
    </div>
  );
}

function ItemProduto({ produto: p, selecionado, onSelecionar }: { produto: Produto; selecionado: boolean; onSelecionar: () => void }) {
  const [preco, setPreco] = useState(paraTexto(p.priceCents));
  // Se o preço mudar no servidor (ex.: reajuste em massa), atualiza o campo
  const [precoDoServidor, setPrecoDoServidor] = useState(p.priceCents);
  if (precoDoServidor !== p.priceCents) {
    setPrecoDoServidor(p.priceCents);
    setPreco(paraTexto(p.priceCents));
  }
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviando, iniciar] = useTransition();
  const mudou = preco !== paraTexto(p.priceCents);

  const salvarPreco = () =>
    iniciar(async () => {
      const r = await alterarPreco(p.id, preco);
      setErro(r.erro ?? null);
      setSalvo(!!r.ok);
    });

  return (
    <li className={`rounded-2xl border bg-white p-4 ${p.ativo ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selecionado} onChange={onSelecionar} className="mt-1 h-5 w-5 accent-marca-600" aria-label={`Selecionar ${p.nome}`} />
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-bold">{p.nome}</p>
          <p className="text-sm text-slate-500">
            {p.embalagem}
            {p.marca ? ` · ${p.marca}` : ""}
          </p>
          {p.faixas.length > 0 && (
            <p className="text-xs text-marca-700">Atacado: {p.faixas.map((f) => `${f.minQuantity}+ ${formatarReais(f.priceCents)}`).join(" · ")}</p>
          )}
        </div>
        <Link href={`/loja/produtos/${p.id}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-300" aria-label={`Editar ${p.nome}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Edição rápida do preço */}
        <label className="flex items-center rounded-lg border border-slate-300 bg-white pl-3 focus-within:border-marca-500">
          <span className="text-slate-500">R$</span>
          <input
            value={preco}
            onChange={(e) => {
              setPreco(e.target.value);
              setSalvo(false);
              setErro(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && mudou && salvarPreco()}
            inputMode="decimal"
            aria-label={`Preço de ${p.nome}`}
            className="w-24 px-2 py-2.5 text-base font-bold focus:outline-none"
          />
        </label>
        {mudou && (
          <button type="button" onClick={salvarPreco} disabled={enviando} className="rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {enviando ? "Salvando…" : "Salvar preço"}
          </button>
        )}
        {salvo && !mudou && <span className="text-sm font-medium text-emerald-700">Salvo ✓</span>}

        {/* Disponível / Sem estoque */}
        <button
          type="button"
          disabled={enviando}
          onClick={() => iniciar(async () => void (await alternarDisponivel(p.id)))}
          aria-pressed={p.ativo}
          className={`ml-auto rounded-full px-4 py-2.5 text-sm font-bold ${p.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
        >
          {p.ativo ? "● Disponível" : "○ Sem estoque"}
        </button>
      </div>
      {erro && <p className="mt-2 text-sm font-medium text-red-600">{erro}</p>}
    </li>
  );
}
