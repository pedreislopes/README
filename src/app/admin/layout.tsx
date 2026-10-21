// Moldura do painel do administrador. exigirAdmin() barra qualquer outra conta.
import { Abas } from "@/components/Abas";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigirAdmin();
  const [lojasPendentes, sugestoesPendentes] = await Promise.all([
    db.store.count({ where: { status: "PENDENTE" } }),
    db.materialSuggestion.count({ where: { status: "PENDENTE" } }),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Administração</p>
        <h1 className="text-xl font-extrabold">Painel Solid</h1>
      </div>
      <Abas
        rotulo="Painel do administrador"
        raiz="/admin"
        abas={[
          { href: "/admin", rotulo: "Início" },
          { href: "/admin/lojas", rotulo: "Lojas", contador: lojasPendentes },
          { href: "/admin/pedidos", rotulo: "Pedidos" },
          { href: "/admin/materiais", rotulo: "Materiais", contador: sugestoesPendentes },
          { href: "/admin/registro", rotulo: "Registro" },
        ]}
      />
      {children}
    </div>
  );
}
