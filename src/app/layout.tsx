import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BarraInferior, Cabecalho } from "@/components/Navegacao";
import { contarItensDoCarrinho } from "@/lib/carrinho";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";
import "./globals.css";

// Todas as páginas mostram dados atualizados do banco (preços, pedidos),
// então pedimos ao Next.js para montá-las a cada acesso, sem guardar cópia.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Solid — Materiais de construção no DF pelo menor preço",
    template: "%s | Solid",
  },
  description:
    "Compare preços de cimento, areia, tijolo e outros materiais de construção em lojas de Brasília e do DF.",
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await usuarioAtual();
  const itensNoCarrinho = await contarItensDoCarrinho();
  // Lojista: número de pedidos novos no menu
  const pedidosNovos =
    usuario?.role === "LOJISTA"
      ? await db.order.count({ where: { status: "NOVO", store: { ownerId: usuario.id } } })
      : null;
  const menu = { nomeUsuario: usuario?.name ?? null, itensNoCarrinho, pedidosNovos };
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Cabecalho {...menu} />
        {/* pb-20 deixa espaço para a barra inferior no celular */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:pb-10">{children}</main>
        <BarraInferior {...menu} />
      </body>
    </html>
  );
}
