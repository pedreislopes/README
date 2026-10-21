# Solid

Marketplace de materiais de construção para Brasília/DF: compare preços entre lojas e compre tudo em um só lugar.

> 🚧 Projeto em construção. O passo a passo completo para rodar no seu computador
> será escrito ao final (Etapa 10).

## Comandos principais (para quem já tem o Node.js instalado)

```bash
npm install            # baixa as dependências
npm run banco:resetar  # cria o banco de dados com os dados de teste
npm run dev            # liga o site em http://localhost:3000
npm test               # testes das regras (preços, calculadora, comissão…)
npm run test:e2e       # testes de ponta a ponta num navegador de celular (360 px)
```

> Os testes de ponta a ponta **apagam e recriam os dados de teste** do banco local.

## Usuários de teste

A senha de **todos** é `solid123`.

| Tipo | E-mail | Para que serve |
|---|---|---|
| Cliente CPF | `cpf@teste.com` | Vê o preço normal |
| Cliente CNPJ | `cnpj@teste.com` | Vê os preços de atacado (Construtora Planalto) |
| Lojista | `lojista@teste.com` | Dono da Casa do Construtor Taguatinga |
| Lojista (pendente) | `pendente@teste.com` | Loja aguardando aprovação do administrador |
| Administrador | `admin@teste.com` | Aprova lojas, define comissões e destaque |

As outras 7 lojas também têm login (todas com a senha `solid123`):
`ceilandia@`, `aguasclaras@`, `asanorte@`, `samambaia@`, `gama@`, `sobradinho@` e `guara@teste.com`.

## Dados de teste

Ficam em `prisma/dados-teste.ts` (listas fáceis de editar) e são gravados por `prisma/seed.ts`.

| Loja | Região | Comissão | Observação |
|---|---|---|---|
| Casa do Construtor Taguatinga | Taguatinga | 3% | Loja do usuário `lojista@teste.com` |
| Depósito Ceilândia Forte | Ceilândia | 0% | |
| Materiais Águas Claras | Águas Claras | 5% | |
| Asa Norte Materiais de Construção | Asa Norte | 3% | Vende cimento em saco de 25 kg e tijolo avulso |
| Samambaia Depósito Popular | Samambaia | 0% | |
| Gama Construções e Materiais | Gama | 5% | |
| Sobradinho Casa & Obra | Sobradinho | 4% | **Oferta destaque** (com aviso "Patrocinado"), nunca é a mais barata |
| Guará Material de Construção | Guará | 3% | |
| Depósito Nova Era Vicente Pires | Vicente Pires | 5% | **Aguardando aprovação**, não aparece na busca |

- 44 materiais em 10 categorias, com diferença de 8% a 20% entre a loja mais barata e a mais cara.
- Faixas de atacado (ex.: cimento 50+ sacos e 200+ sacos) só para CNPJ, **exceto** em
  *Argamassa colante AC-I* e *Bloco de concreto 14x19x39*, que valem também para CPF.

## Segurança do login

- Senhas guardadas com **bcrypt** (criptografia forte, de mão única), nunca em texto.
- Login com mensagem única **"E-mail ou senha incorretos"**, com o mesmo tempo de resposta
  exista ou não o e-mail, para não revelar quem tem cadastro.
- **Limite de tentativas**: 5 erros seguidos no mesmo e-mail (ou 20 no mesmo endereço de internet)
  bloqueiam o login por 15 minutos. Ajustável em `src/config/seguranca.ts`.
- Não há duas contas com o mesmo **CPF/CNPJ** nem com o mesmo e-mail.
- Cadastro exige aceite dos **Termos de Uso** e da **Política de Privacidade** (textos provisórios em
  `/termos` e `/privacidade`); a data e a versão do aceite ficam registradas.
- O documento aparece **mascarado** na tela da conta (ex.: `***.456.789-**`).

## Carrinho e pedidos

- O carrinho fica guardado no servidor: quem não fez login mantém os itens e, ao entrar, eles são
  somados ao carrinho da conta.
- Quantidades seguem a unidade: areia e brita de 0,5 em 0,5 m³; sacos, milheiros e peças só inteiros.
- A faixa de atacado é aplicada automaticamente, com a economia mostrada em cada item. Perto da próxima
  faixa aparece o incentivo "Adicione mais X e pague R$ Y" (ajustável em `src/config/carrinho.ts`).
- Se a loja mudar o preço depois que o item entrou no carrinho, o cliente é avisado e só confirma
  depois de aceitar os novos valores.
- Cada pedido guarda uma "foto" dos preços: mudanças futuras na loja não alteram pedidos antigos.
- Frete: "a combinar com a loja" (campo já reservado no banco para o cálculo futuro).
- Não há pagamento real: o pedido é registrado, dividido por loja, com a comissão de cada uma calculada.

## Calculadora de obra

- Serviços: muro de alvenaria, contrapiso, laje simples, reboco e assentamento de piso.
- Mostra o cálculo passo a passo (ex.: "20 m² × 25 tijolos/m² = 500 + 10% de perda = 550 tijolos").
- Arredonda sempre para cima no formato vendido e escolhe, para cada material, a oferta de menor
  custo total (ex.: 550 tijolos avulsos podem sair mais baratos que 1 milheiro).
- Dois planos lado a lado: **menor preço por item** (várias lojas) ou **tudo numa loja só** (a mais
  completa e, entre essas, a mais barata), com o número de fretes a combinar de cada um.
- O cliente ajusta ou remove itens antes de montar o carrinho; materiais sem loja geram um aviso.
- **Todos os coeficientes ficam em `src/config/calculadora.ts`**, com a fonte de cada número e a
  referência SINAPI/TCPO a conferir. Os valores atuais são de prática de mercado e **aguardam revisão
  de um engenheiro civil** (há um bloco `REVISAO` no topo do arquivo para registrar quem revisou).

## Painel do lojista (`/loja`)

- Aviso de **pedidos novos** com contador (no painel e no menu), pedidos com o valor da **comissão**
  e quanto a loja recebe; botão grande para avançar o status (Novo → Recebido → Separado → Entregue).
- Produtos: cadastrar, editar, remover; **edição rápida de preço** na lista; **Disponível / Sem
  estoque** (sem estoque some da busca, mas não é apagado); **reajuste em massa** em % (com
  confirmação, aplicado também às faixas de atacado); campo para procurar na lista.
- Segurança: toda página e ação do painel usa a loja de quem está logado (`src/lib/loja.ts`); um
  lojista nunca vê nem altera produtos ou pedidos de outra loja.
- Loja pendente acessa o painel e cadastra produtos, com o aviso "Sua loja ainda não aparece na busca.
  Aguardando aprovação."
- **Sugerir material**: o lojista sugere um material que não está no catálogo; o administrador aprova
  (corrigindo nome/categoria se preciso) ou recusa com motivo.
- Os dados de teste incluem 6 pedidos de exemplo (2 novos na loja de `lojista@teste.com`) e uma
  sugestão de material aguardando análise.

## Cancelamento de pedidos

- Cliente e loja podem cancelar enquanto o pedido **não estiver "Separado"**; o administrador pode
  cancelar a qualquer momento. Sempre com **motivo** (lista de motivos + "Outro", que exige explicação).
- Pedido cancelado **não gera comissão** e não entra em vendas nem relatórios de comissão.

## Painel do administrador (`/admin`, entre com `admin@teste.com`)

- **Indicadores**: total vendido, total de comissões, número de pedidos (e cancelados), lojas ativas e
  pendentes, sugestões de material.
- **Lojas**: aprovar ou **recusar com motivo** as pendentes; **suspender com motivo** uma loja ativa (some da
  busca, mas mantém produtos, pedidos e histórico) e reativar; editar a **comissão** (vale só para pedidos
  novos: cada pedido guarda a própria %); ligar/desligar a **Oferta destaque**.
- **Pedidos e comissões**: relatório filtrável por período, loja e situação, com **download em planilha
  (CSV)** que abre direto no Excel.
- **Materiais**: aprovar/recusar sugestões dos lojistas e incluir materiais novos no catálogo.
- **Registro (auditoria)**: toda ação do administrador fica registrada — quem fez, o quê e quando —
  inclusive o download de planilhas. O site não tem opção de apagar o registro.

## Testes automáticos

- **98 testes de regras** (`src/domain/*.test.ts`): busca, preço por unidade, faixas de atacado, carrinho,
  calculadora, comissão, cancelamento, relatório/CSV, validação de CPF/CNPJ, limite de login.
- **27 testes de ponta a ponta** (`e2e/`), num celular de 360 px: busca, cadastro e login, carrinho e
  pedido, calculadora, painel do lojista, painel do administrador e **segurança** (cada tipo de usuário
  tentando abrir pelo endereço o que não é seu). Também conferem que nenhuma tela "vaza" para os lados.

## Onde fica cada coisa

| Pasta | O que tem |
|---|---|
| `src/app/` | As páginas do site (cada pasta é um endereço, ex.: `busca/` = `/busca`) |
| `src/components/` | Peças visuais reaproveitadas (menu, logo…) |
| `src/config/` | Listas e configurações (regiões, categorias; depois, a calculadora) |
| `src/domain/` | Regras de negócio (cálculos de preço, comissão, calculadora) |
| `src/lib/` | Utilitários (banco de dados, formatação de dinheiro) |
| `prisma/` | Estrutura do banco de dados e dados de teste |
