// =============================================================================
// Envio de e-mails
// =============================================================================
// Hoje NÃO há serviço de e-mail configurado. Enquanto isso:
//   - no computador e no ambiente de teste, o e-mail (com o link) aparece no
//     registro do servidor ("logs"), para dar para testar;
//   - em produção sem serviço configurado, o e-mail não é enviado e o registro
//     mostra só um aviso (sem o link, que é secreto).
//
// PARA LIGAR UM SERVIÇO DE E-MAIL (ex.: Resend, resend.com):
//   1. Crie a conta e confirme o domínio do site (ex.: solid.com.br).
//   2. Na Vercel, em Settings → Environment Variables, crie:
//        RESEND_API_KEY = a chave gerada no Resend (secreta: nunca no código)
//        EMAIL_REMETENTE = Solid <nao-responda@solid.com.br>
//   3. Faça Redeploy. Pronto: os e-mails passam a ser enviados de verdade.
// Para usar outro serviço, troque só a função enviarPeloResend abaixo.
// =============================================================================

import { ehAmbienteDeTeste } from "@/config/ambiente";

export type Email = { para: string; assunto: string; texto: string };

export async function enviarEmail(email: Email): Promise<void> {
  const chave = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;
  if (chave && remetente) {
    await enviarPeloResend(email, chave, remetente);
    return;
  }

  if (process.env.NODE_ENV !== "production" || ehAmbienteDeTeste()) {
    console.info(
      [
        "──── E-MAIL (não enviado: serviço de e-mail não configurado) ────",
        `Para: ${email.para}`,
        `Assunto: ${email.assunto}`,
        "",
        email.texto,
        "─────────────────────────────────────────────────────────────────",
      ].join("\n"),
    );
  } else {
    console.warn(`E-mail "${email.assunto}" NÃO enviado: configure RESEND_API_KEY e EMAIL_REMETENTE.`);
  }
}

async function enviarPeloResend(email: Email, chave: string, remetente: string) {
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: remetente, to: [email.para], subject: email.assunto, text: email.texto }),
  });
  if (!resposta.ok) {
    // Sem o conteúdo do e-mail no registro: ele pode ter um link secreto
    console.error(`Falha ao enviar e-mail pelo Resend (HTTP ${resposta.status}).`);
  }
}

/**
 * Endereço do site para montar links nos e-mails. Vem da configuração, NUNCA
 * do pedido recebido (senão alguém poderia forjar o endereço e roubar o link).
 */
export function enderecoDoSite(): string {
  const configurado = process.env.SOLID_URL_SITE?.replace(/\/+$/, "");
  if (configurado) return configurado;
  // Preenchida automaticamente pela Vercel com o endereço principal do projeto
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
