// Enviar foto de um produto de marca que ainda não tem foto no site.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { exigirLoja } from "@/lib/loja";
import { FormularioFotoLoja } from "./FormularioFotoLoja";

export const metadata = { title: "Enviar foto do produto" };

export default async function EnviarFoto(props: PageProps<"/loja/foto/[itemId]">) {
  const { loja } = await exigirLoja();
  const { itemId } = await props.params;
  const item = await db.catalogItem.findFirst({
    where: { id: itemId, active: true },
    include: {
      product: { select: { name: true } },
      photoSubmissions: { where: { storeId: loja.id, status: "PENDENTE" }, take: 1 },
    },
  });
  if (!item) notFound();

  return (
    <div className="space-y-4">
      <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-slate-600">
        <ChevronLeft className="h-4 w-4" /> Meus produtos
      </Link>
      <header>
        <p className="text-sm text-slate-500">{item.product.name}</p>
        <h2 className="text-lg font-bold">
          Foto: {item.brand} {item.model}
        </h2>
      </header>
      {item.photoId ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">Este produto já tem foto no site. Obrigado!</p>
      ) : item.photoSubmissions.length > 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">Você já enviou uma foto deste produto. Ela aguarda a aprovação do Solid.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            A foto aparece para todas as lojas que vendem este produto, <strong>depois da aprovação</strong> do Solid. Prefira
            o produto inteiro, de frente, com fundo branco e sem pessoas.
          </p>
          <FormularioFotoLoja itemId={item.id} />
        </>
      )}
    </div>
  );
}
