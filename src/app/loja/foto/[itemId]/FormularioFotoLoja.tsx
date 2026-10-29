"use client";

import { useActionState } from "react";
import { Alerta, estiloBotaoPrincipal, estiloCampo } from "@/components/Formulario";
import { CampoFoto } from "@/components/CampoFoto";
import { enviarFotoDaLoja } from "@/lib/acoes-fotos";

const ORIGENS = ["Foto própria da loja", "Kit oficial do fabricante", "Outra (explique abaixo)"];

export function FormularioFotoLoja({ itemId }: { itemId: string }) {
  const [estado, acao, enviando] = useActionState(enviarFotoDaLoja, {});
  return (
    <form action={acao} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <input type="hidden" name="itemId" value={itemId} />
      <CampoFoto />
      <div>
        <label htmlFor="origem" className="block text-sm font-semibold">
          Origem da imagem
        </label>
        <select id="origem" name="origem" required className={estiloCampo} defaultValue="">
          <option value="" disabled>
            Escolha…
          </option>
          {ORIGENS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="autorizacao" className="block text-sm font-semibold">
          Autorização de uso
        </label>
        <input
          id="autorizacao"
          name="autorizacao"
          required
          maxLength={300}
          placeholder="Ex.: foto tirada pela equipe da loja"
          className={estiloCampo}
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="declaro" required className="mt-0.5 h-5 w-5 accent-marca-600" />
        <span>Declaro que a loja tem o direito de usar esta imagem e autoriza o Solid a publicá-la no site.</span>
      </label>
      <button type="submit" disabled={enviando} className={estiloBotaoPrincipal}>
        {enviando ? "Enviando…" : "Enviar foto para aprovação"}
      </button>
    </form>
  );
}
