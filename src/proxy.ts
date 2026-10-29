// =============================================================================
// Senha de acesso ao ambiente de TESTE.
// Se a variável SENHA_ACESSO_TESTE estiver configurada (no painel da Vercel),
// o navegador pede usuário e senha antes de abrir qualquer página. Assim só
// quem recebeu a senha vê o site de teste (onde os usuários de teste,
// inclusive o administrador, têm senhas conhecidas).
// No seu computador a variável não existe e nada muda.
// =============================================================================
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const USUARIO = "solid";

/** Compara textos sem "vazar" pelo tempo de resposta quantos caracteres acertou */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function proxy(request: NextRequest) {
  const senha = process.env.SENHA_ACESSO_TESTE;
  if (!senha) return NextResponse.next();

  const cabecalho = request.headers.get("authorization") ?? "";
  if (cabecalho.startsWith("Basic ")) {
    const [usuario, ...resto] = Buffer.from(cabecalho.slice(6), "base64").toString("utf8").split(":");
    if (iguais(usuario.toLowerCase(), USUARIO) && iguais(resto.join(":"), senha)) return NextResponse.next();
  }
  return new NextResponse("Ambiente de teste do Solid: acesso restrito.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Solid - ambiente de teste", charset="UTF-8"' },
  });
}

export const config = {
  // Protege tudo, menos os arquivos internos de estilo/imagem do próprio Next.js
  // e as imagens públicas das categorias (o otimizador de imagens da Vercel
  // precisa buscá-las sem senha; são só ilustrações/fotos, nada sigiloso)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|categorias/).*)"],
};
