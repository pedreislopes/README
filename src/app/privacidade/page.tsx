// TEXTO PROVISÓRIO — precisa ser revisado por um advogado antes do lançamento.
export const metadata = { title: "Política de Privacidade" };

export default function Privacidade() {
  return (
    <article className="max-w-2xl space-y-4 text-slate-700">
      <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
        Texto de exemplo, provisório. Será substituído pela versão revisada juridicamente.
      </p>
      <h1 className="text-2xl font-extrabold text-slate-900">Política de Privacidade</h1>
      <p>Esta política explica como o Solid trata seus dados pessoais, conforme a Lei 13.709/2018 (LGPD).</p>
      <h2 className="font-bold text-slate-900">Quais dados coletamos</h2>
      <p>Nome, e-mail, telefone, CPF ou CNPJ e o histórico de pedidos feitos na plataforma.</p>
      <h2 className="font-bold text-slate-900">Para que usamos</h2>
      <p>
        Para identificar sua conta, mostrar os preços corretos (varejo ou atacado), registrar pedidos e
        repassá-los às lojas escolhidas por você.
      </p>
      <h2 className="font-bold text-slate-900">Com quem compartilhamos</h2>
      <p>Apenas com as lojas dos pedidos que você fizer, na medida necessária para atendê-los.</p>
      <h2 className="font-bold text-slate-900">Segurança</h2>
      <p>
        Senhas são guardadas com criptografia forte (bcrypt) e nunca em texto. Seu documento aparece mascarado
        nas telas.
      </p>
      <h2 className="font-bold text-slate-900">Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados pelo e-mail privacidade@solid.exemplo
        (endereço provisório).
      </p>
    </article>
  );
}
