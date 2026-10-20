// TEXTO PROVISÓRIO — precisa ser revisado por um advogado antes do lançamento.
export const metadata = { title: "Termos de Uso" };

export default function Termos() {
  return (
    <article className="max-w-2xl space-y-4 text-slate-700">
      <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
        Texto de exemplo, provisório. Será substituído pela versão revisada juridicamente.
      </p>
      <h1 className="text-2xl font-extrabold text-slate-900">Termos de Uso</h1>
      <h2 className="font-bold text-slate-900">1. O que é o Solid</h2>
      <p>
        O Solid é uma plataforma que reúne ofertas de lojas e depósitos de materiais de construção do
        Distrito Federal. Os produtos são vendidos e entregues pelas lojas; o Solid intermedeia o contato e
        o pedido.
      </p>
      <h2 className="font-bold text-slate-900">2. Cadastro</h2>
      <p>
        Você é responsável pela veracidade dos dados informados e pela guarda da sua senha. Cada CPF ou CNPJ
        pode ter apenas uma conta.
      </p>
      <h2 className="font-bold text-slate-900">3. Preços e ofertas</h2>
      <p>
        Preços, estoque e condições são definidos por cada loja. Ofertas marcadas como “Patrocinado” são
        anúncios pagos pela loja.
      </p>
      <h2 className="font-bold text-slate-900">4. Lojistas</h2>
      <p>
        Lojas cadastradas passam por aprovação antes de aparecer na busca e pagam comissão sobre os pedidos,
        conforme condições comerciais acordadas.
      </p>
    </article>
  );
}
