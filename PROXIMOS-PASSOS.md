# Solid — Próximos passos

Este documento explica, em linguagem simples, o que fazer para o Solid sair do seu computador e virar
um site de verdade: **como publicar**, **o que falta antes do lançamento** e **quanto deve custar por mês**.

> **Resumo em uma frase:** o MVP está pronto para demonstração e testes com pessoas de confiança;
> para receber clientes reais faltam a revisão técnica (engenheiro), a revisão jurídica (advogado),
> pagamento, frete, alguns ajustes de infraestrutura e um teste de segurança profissional.

---

## Sumário

1. [Colocar o site na internet](#1-colocar-o-site-na-internet)
2. [O que falta antes do lançamento real](#2-o-que-falta-antes-do-lançamento-real)
3. [Estimativa de custos mensais](#3-estimativa-de-custos-mensais)
4. [Ordem sugerida](#4-ordem-sugerida)

---

## 1. Colocar o site na internet

### 1.1 Como funciona hoje e o que muda

Hoje o Solid roda no seu computador e guarda os dados num **arquivo** (`prisma/dev.db`, banco SQLite).
Na internet isso não funciona bem: serviços como a Vercel ligam e desligam cópias do site o tempo todo
e **não guardam arquivos** entre uma execução e outra. Por isso, para publicar, é preciso:

| Peça | Hoje (no seu computador) | Na internet |
|---|---|---|
| Onde o site roda | Seu computador (`npm run dev`) | **Vercel** (feita pelos criadores do Next.js) |
| Onde ficam os dados | Arquivo SQLite | **PostgreSQL** num serviço especializado (ex.: Neon ou Supabase) |
| Endereço | `localhost:3000` | Seu domínio, ex.: `solid.com.br` (com cadeado HTTPS automático) |

### 1.2 Passo a passo (feito por um programador, cerca de 1 dia de trabalho)

1. **Criar o banco PostgreSQL** num serviço como **Neon** (neon.tech) ou **Supabase** (supabase.com).
   Eles entregam um "endereço de conexão" (começa com `postgresql://…`). Guarde-o em segredo: ele dá
   acesso total aos dados.
2. **Trocar o SQLite pelo PostgreSQL no projeto**, em `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")   // o endereço fica fora do código, como "segredo"
   }
   ```
3. **Recriar as migrações** (o "histórico" de mudanças do banco): as atuais foram escritas para SQLite.
   O programador apaga a pasta `prisma/migrations`, aponta `DATABASE_URL` para um banco PostgreSQL de
   teste e roda `npx prisma migrate dev --name inicial`. Nada do código das telas precisa mudar.
4. **Criar uma conta na Vercel** (vercel.com) usando o seu login do GitHub e clicar em
   **Add New → Project → Import** no repositório do Solid.
5. **Configurar na Vercel** (em *Settings → Environment Variables*): `DATABASE_URL` com o endereço do
   passo 1. Em *Build Command*, usar: `prisma migrate deploy && next build`.
6. **Criar o primeiro administrador.** Hoje o administrador só existe nos dados de teste. Na internet
   **não** se usam os dados de teste (`npm run banco:resetar` apaga tudo!). O programador cria um pequeno
   comando para cadastrar o administrador real com uma senha forte.
7. **Domínio**: registrar o nome no **registro.br** (ex.: `solid.com.br`) e apontá-lo para a Vercel
   (a Vercel mostra o que configurar). O cadeado HTTPS é automático e gratuito.
8. **Conferir depois de publicar**: entrar como cliente, lojista e administrador; rodar os testes de
   ponta a ponta apontando para um ambiente de teste (nunca para o banco de produção).

> O que **já está pronto** para a internet: o cookie de login passa a exigir HTTPS sozinho; o limite de
> tentativas de login usa o endereço do visitante informado pela Vercel; os cabeçalhos de segurança
> já são enviados em todas as páginas.

### 1.3 Ter dois ambientes

Recomendado: um site de **teste** (ex.: `teste.solid.com.br`, com banco próprio e dados fictícios) e o de
**produção** (clientes reais). Toda mudança passa primeiro pelo de teste. A Vercel faz isso quase
automaticamente ("Preview Deployments").

---

## 2. O que falta antes do lançamento real

Itens marcados com 🔴 são **obrigatórios** antes de receber clientes reais; 🟡 são **muito
recomendados** para o começo; 🟢 podem vir depois.

### 2.1 Revisões profissionais

- 🔴 **Engenheiro civil revisar os coeficientes da calculadora** (`src/config/calculadora.ts`). Os
  números atuais são de prática de mercado e **não foram conferidos com a tabela SINAPI**. Cada número
  tem a fonte e a referência a conferir; há um bloco `REVISAO` para registrar nome, CREA e data.
- 🔴 **Advogado revisar os Termos de Uso e a Política de Privacidade** (hoje são textos de exemplo, em
  `/termos` e `/privacidade`). Pontos para a conversa:
  - LGPD: indicar o **encarregado de dados** (DPO), como o cliente pede acesso, correção e exclusão dos
    dados, por quanto tempo os dados ficam guardados, aviso de cookies;
  - Código de Defesa do Consumidor: papel do Solid como intermediário, **política de troca e
    devolução**, prazo de arrependimento, canal de atendimento;
  - **contrato com os lojistas** (comissão, planos Destaque/Premium, responsabilidades, suspensão);
  - regras de publicidade (os anúncios já aparecem como "Patrocinado").
- 🔴 **Teste de invasão (pentest) por profissional de segurança.** A revisão feita no MVP e os testes
  automáticos cobrem os acessos indevidos mais comuns, mas **não substituem** um especialista tentando
  invadir o site de verdade. Fazer no ambiente de teste, já com a versão que vai ao ar, e corrigir o que
  for encontrado antes do lançamento. Repetir pelo menos uma vez por ano e após grandes mudanças.

### 2.2 Funcionalidades que faltam

- 🔴 **Pagamento.** Para um marketplace, o ideal é um intermediador com **divisão automática do
  pagamento** ("split"): o cliente paga uma vez e o sistema já separa a parte de cada loja e a comissão
  do Solid. Exemplos: Mercado Pago, Pagar.me, Asaas, Stripe. O código já tem a comissão calculada por
  pedido; falta ligar ao intermediador.
- 🔴 **Frete e entrega.** Hoje aparece "Frete: a combinar com a loja" e o banco já tem o campo reservado
  (`Order.freightCents`). Opções: cada loja cadastra a taxa por região do DF (mais simples para
  começar) ou integrar com transportadoras/apps de entrega depois.
- 🔴 **"Esqueci minha senha".** Ainda não existe. Precisa de envio de e-mail (item abaixo).
- 🔴 **E-mails automáticos**: confirmação de cadastro e de pedido para o cliente, aviso de **pedido
  novo para a loja** (hoje ela só vê ao abrir o painel), aviso de aprovação/suspensão de loja.
  Serviços: Resend, Brevo, Amazon SES.
- 🟡 **Exclusão da conta pelo próprio cliente** (direito previsto na LGPD), com cuidado para manter o
  que a lei obriga a guardar (ex.: registros de pedidos).
- 🟡 **Verificar se o CNPJ do lojista está ativo** na Receita Federal antes de aprovar a loja (hoje o
  sistema confere só se o número é válido).
- 🟡 **Fotos dos produtos** e descrição mais completa.
- 🟢 **Nota fiscal**: em geral emitida pela loja; o Solid pode guardar o número/arquivo no pedido.
- 🟢 **Avisos por WhatsApp** para o lojista (pedido novo) e para o cliente (pedido separado/entregue).
- 🟢 Opção "comprar tudo numa loja só" também no carrinho comum (hoje existe na calculadora).

### 2.3 Infraestrutura e segurança

- 🔴 **Registro de auditoria fora do site.** Hoje o registro das ações do administrador fica no próprio
  banco: o site não deixa apagar, mas alguém com acesso direto ao banco poderia alterá-lo. Na internet,
  cada registro deve ser **copiado também para um serviço externo que não permite alteração** (ex.:
  Better Stack, Axiom, Datadog ou armazenamento com bloqueio de escrita, como Amazon S3 Object Lock).
- 🔴 **Guardar a contagem do rodízio de anúncios no banco de dados.** Hoje a contagem que garante o
  rodízio justo entre lojas Destaque/Premium fica na memória do servidor. Na Vercel existem várias
  cópias do site rodando ao mesmo tempo, cada uma com a sua contagem, e elas reiniciam com frequência: a
  divisão das vagas deixaria de ser exatamente igual entre as lojas que pagam. A correção é pequena:
  uma tabela com a contagem por produto e plano, aumentada a cada busca (só o arquivo
  `src/lib/anuncios.ts` muda). Também vale **registrar quantas vezes cada anúncio apareceu**, para
  prestar contas às lojas.
- 🔴 **Backup automático do banco** (diário, com teste de restauração). Neon e Supabase oferecem nos
  planos pagos.
- 🟡 **Monitoramento de erros** (ex.: Sentry): avisa a equipe quando algo quebra para um cliente.
- 🟡 **Limite de cadastros por endereço de internet**, contra cadastros falsos em massa (o limite de
  tentativas de login já existe e fica no banco, então funciona com várias cópias do site).
- 🟢 **Busca para catálogos grandes**: hoje a busca carrega todas as ofertas e filtra na memória (ótimo
  para centenas de produtos). Com milhares de produtos, usar a busca de texto do PostgreSQL.

---

## 3. Estimativa de custos mensais

> ⚠️ **Valores de referência, sujeitos a mudança.** Não foi possível consultar os sites dos fornecedores
> ao escrever este documento: confira os preços atuais antes de contratar. Conversão usada:
> **US$ 1 ≈ R$ 5,50**. Muitos serviços cobram em dólar; o valor em reais varia com o câmbio e com
> impostos sobre serviços do exterior (IOF no cartão).

### 3.1 Fase de testes (antes de abrir ao público)

Usando os planos gratuitos, só com pessoas de confiança e dados fictícios:

| Item | Serviço (exemplo) | Custo aproximado |
|---|---|---|
| Hospedagem do site | Vercel — plano Hobby (gratuito, **só para uso não comercial**) | R$ 0 |
| Banco de dados | Neon ou Supabase — plano gratuito | R$ 0 |
| Domínio `.com.br` | registro.br (cerca de R$ 40 por **ano**) | ~R$ 4/mês |
| **Total** | | **~R$ 0 a 10 por mês** |

### 3.2 Lançamento (primeiros meses, até alguns milhares de visitas por dia)

| Item | Serviço (exemplo) | Referência | Em reais/mês |
|---|---|---|---|
| Hospedagem do site | Vercel Pro (exigido para uso comercial) | ~US$ 20 por pessoa da equipe com acesso | ~R$ 110 |
| Banco de dados PostgreSQL com backup | Neon (plano pago) ou Supabase Pro | ~US$ 20–25 | ~R$ 110–140 |
| E-mails automáticos | Resend / Brevo (plano gratuito cobre alguns milhares por mês) | US$ 0–20 | R$ 0–110 |
| Monitoramento de erros | Sentry (plano gratuito no começo) | US$ 0 | R$ 0 |
| Registro externo de auditoria e logs | Better Stack / Axiom (plano gratuito ou básico) | US$ 0–25 | R$ 0–140 |
| Domínio | registro.br | ~R$ 40/ano | ~R$ 4 |
| **Total estimado** | | | **~R$ 225 a 500 por mês** |

**Fora da mensalidade:**
- **Intermediador de pagamento**: não costuma ter mensalidade, mas cobra **por venda** (em geral algo
  entre ~1% no Pix e ~3% a 5% no cartão, mais o prazo de recebimento). Isso entra no cálculo da
  comissão do Solid.
- **Serviços profissionais (uma vez, antes do lançamento)** — faixas muito aproximadas, peça orçamentos:
  revisão dos coeficientes por engenheiro civil (R$ 1 mil a 3 mil), Termos/Privacidade/contrato com
  lojistas por advogado (R$ 3 mil a 10 mil), teste de invasão profissional (R$ 5 mil a 20 mil,
  conforme o escopo).
- **Manutenção do código** por um programador (correções, novas funções): depende de contratação.

### 3.3 Quando o custo sobe

Os custos de hospedagem e banco crescem com o **uso** (visitas, pedidos, tamanho do banco). Um sinal
para revisar o plano: muitas lojas, milhares de produtos ou dezenas de milhares de visitas por mês.
Mesmo assim, para esse porte, o custo de infraestrutura costuma continuar bem abaixo do faturamento
com comissões e planos de anúncio.

---

## 4. Ordem sugerida

1. Publicar o **ambiente de teste** (seção 1) e mostrar a lojistas parceiros e possíveis clientes.
2. Em paralelo: **engenheiro** (coeficientes) e **advogado** (Termos, Privacidade, contrato com lojistas).
3. Desenvolver: **"esqueci minha senha"**, **e-mails automáticos**, **frete por região**,
   **contagem do rodízio no banco**, **auditoria externa** e **backup**.
4. Integrar o **pagamento** (com divisão automática para as lojas).
5. **Teste de invasão profissional** na versão final, no ambiente de teste. Corrigir o que aparecer.
6. Publicar a **produção**, cadastrar o administrador real e as primeiras lojas, e abrir para clientes
   — de preferência começando por uma ou duas regiões do DF.
