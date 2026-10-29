// Entrega uma foto de produto: /fotos/<id> (grande) ou /fotos/<id>?t=mini (miniatura).
// Fotos públicas podem ficar guardadas no navegador por 1 ano (o id muda quando a foto muda).
// Fotos ainda não aprovadas: só o administrador e a loja que enviou conseguem ver.
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/sessao";

export async function GET(request: Request, ctx: RouteContext<"/fotos/[id]">) {
  const { id } = await ctx.params;
  const mini = new URL(request.url).searchParams.get("t") === "mini";
  const foto = await db.photo.findUnique({
    where: { id },
    select: { large: !mini, thumb: mini, public: true, submission: { select: { store: { select: { ownerId: true } } } } },
  });
  if (!foto) return new Response("Foto não encontrada.", { status: 404 });

  if (!foto.public) {
    const usuario = await usuarioAtual();
    const podeVer = usuario && (usuario.role === "ADMIN" || foto.submission?.store.ownerId === usuario.id);
    if (!podeVer) return new Response("Foto não encontrada.", { status: 404 });
  }

  const bytes = (mini ? foto.thumb : foto.large) as Uint8Array<ArrayBuffer>;
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": foto.public ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
