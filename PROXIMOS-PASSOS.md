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
3. [Integração de estoque por API](#3-integração-de-estoque-por-api)
4. [Estimativa de custos mensais](#4-estimativa-de-custos-mensais)
5. [Ordem sugerida](#5-ordem-sugerida)

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

### 1.2 O que já está pronto: o ambiente de TESTE

O projeto **já sabe** rodar na Vercel com PostgreSQL (Neon). O guia passo a passo (computador ou iPad) está em
[PUBLICAR-TESTE.md](PUBLICAR-TESTE.md). Resumo do que foi feito no código:

- `prisma/postgres/` tem a versão PostgreSQL do banco e suas migrações (gerada a partir de
  `prisma/schema.prisma`; no computador continua o SQLite).
- `vercel.json` + `scripts/build-vercel.mjs`: cria as tabelas, grava os dados de teste (só se
  `SOLID_AMBIENTE=teste` e o banco estiver vazio) e monta o site.
- O endereço do banco **nunca** está no código: a Vercel o cria sozinha ao conectar o Neon.
- Faixa "Versão de teste — dados fictícios" e senha de acesso ao site (`SENHA_ACESSO_TESTE`).

### 1.3 O que falta para a PRODUÇÃO (feito por um programador, cerca de 1 dia)

1. **Outro projeto na Vercel e outro banco no Neon**, separados do teste (nunca reaproveitar o banco de
   teste). **Não** criar `SOLID_AMBIENTE` nem `SENHA_ACESSO_TESTE` nele: assim não há faixa de teste,
   nem senha de acesso, e os dados fictícios **não** são gravados (o comando se recusa).
2. **Criar o primeiro administrador.** Hoje o administrador só existe nos dados de teste. O programador
   cria um pequeno comando para cadastrar o administrador real com uma senha forte.
3. **Plano Vercel Pro** (uso comercial) e plano pago do Neon com cópias de segurança (*backups*).
4. **Domínio**: registrar o nome no **registro.br** (ex.: `solid.com.br`) e apontá-lo para a Vercel
   (a Vercel mostra o que configurar). O cadeado HTTPS é automático e gratuito.
5. **Conferir depois de publicar**: entrar como cliente, lojista e administrador; rodar os testes de
   ponta a ponta apontando para o ambiente de teste (nunca para o banco de produção).

> O que **já está pronto** para a internet: o cookie de login passa a exigir HTTPS sozinho; o limite de
> tentativas de login usa o endereço do visitante informado pela Vercel; os cabeçalhos de segurança
> já são enviados em todas as páginas.

### 1.4 Ter dois ambientes

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
  - regras de publicidade (os anúncios já aparecem como "Patrocinado");
  - uso das **fotos de bancos gratuitos** (Unsplash/Pexels), das **marcas** e das **fotos de produtos**
    (kits de fabricantes e fotos enviadas pelas lojas: o site já registra a origem e a autorização de
    cada foto, e a loja declara ter o direito de uso ao enviar);
  - comparação de produtos de marca: só dados objetivos e conferíveis (o site nunca avalia marcas).
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
- ✅ **"Esqueci minha senha"** já existe. Falta só ligar o serviço de e-mail (item abaixo): hoje o link
  aparece no registro do servidor. O lugar para ligar o Resend está pronto em `src/lib/email.ts`
  (basta criar `RESEND_API_KEY` e `EMAIL_REMETENTE` na Vercel).
- 🔴 **E-mails automáticos**: confirmação de cadastro e de pedido para o cliente, aviso de **pedido
  novo para a loja** (hoje ela só vê ao abrir o painel), aviso de aprovação/suspensão de loja.
  Serviços: Resend, Brevo, Amazon SES.
- 🟡 **Exclusão da conta pelo próprio cliente** (direito previsto na LGPD), com cuidado para manter o
  que a lei obriga a guardar (ex.: registros de pedidos).
- 🟡 **Verificar se o CNPJ do lojista está ativo** na Receita Federal antes de aprovar a loja (hoje o
  sistema confere só se o número é válido).
- 🟡 **Fotos dos produtos** e descrição mais completa. As **fotos das categorias** da página inicial
  já podem ser trocadas (README, seção 8); registre a origem em `CREDITOS-IMAGENS.md`.
- 🔴 **Conferir as características dos produtos de marca reais** quando o catálogo de verdade for
  cadastrado: os dados de teste são fictícios. Cada característica deve vir do fabricante (embalagem,
  ficha técnica ou catálogo oficial).
- 🔴 **Engenheiro revisar as explicações dos materiais** e os guias "Qual escolher?"
  (`src/config/explicacoes-materiais.ts`): cada texto tem a fonte e o campo `revisao` para registrar
  quem conferiu.
- 🟡 **Avaliações de clientes** como complemento da comparação lado a lado: nota e comentário de quem
  **comprou de verdade** pelo Solid (só depois do pedido entregue), separados das características
  técnicas. Cuidados: moderação (ofensas, dados pessoais, propaganda), regra para responder e para
  denunciar, nunca apagar avaliação negativa só por ser negativa, e deixar claro que a nota é dos
  clientes e não do Solid. Vale também a "nota da loja" (entrega, atendimento), à parte da nota do
  produto.
- 🟡 **Parcerias com fabricantes** para receber os **catálogos de produtos** (marca, modelo, código de
  barras, características) e os **kits oficiais de imagens**, já com a autorização de uso por escrito.
  O caminho técnico já existe: o fabricante manda a planilha no modelo do Solid (aba **Marcas →
  Importar planilha**) e as fotos entram com origem "Kit oficial do fabricante". Próximos passos: um
  modelo de termo de autorização (com o advogado), um contato por fabricante e, depois, receber os
  catálogos automaticamente (ver a seção 3, integração por API).
- 🟢 **Guardar as fotos fora do banco de dados** quando o catálogo crescer (milhares de fotos): hoje
  elas ficam no PostgreSQL, o que é simples e suficiente no começo. O passo seguinte é um serviço de
  arquivos com CDN (ex.: Vercel Blob, Amazon S3 + CloudFront), mudando só `src/lib/fotos.ts` e
  `src/app/fotos/`.
- 🟢 **Nota fiscal**: em geral emitida pela loja; o Solid pode guardar o número/arquivo no pedido.
- 🟢 **Avisos por WhatsApp** para o lojista (pedido novo) e para o cliente (pedido separado/entregue).
- 🟢 Opção "comprar tudo numa loja só" também no carrinho comum (hoje existe na calculadora).

### 2.3 Infraestrutura e segurança

- 🔴 **Registro de auditoria fora do site.** Hoje o registro das ações do administrador fica no próprio
  banco: o site não deixa apagar, mas alguém com acesso direto ao banco poderia alterá-lo. Na internet,
  cada registro deve ser **copiado também para um serviço externo que não permite alteração** (ex.:
  Better Stack, Axiom, Datadog ou armazenamento com bloqueio de escrita, como Amazon S3 Object Lock).
- ✅ **Contagem do rodízio de anúncios no banco de dados** — feito (tabela `AdRotation`): todas as
  cópias do site na Vercel usam a mesma contagem. 🟡 Falta **registrar quantas vezes cada anúncio
  apareceu**, para prestar contas às lojas que pagam.
- 🔴 **Backup automático do banco** (diário, com teste de restauração). Neon e Supabase oferecem nos
  planos pagos.
- 🟡 **Monitoramento de erros** (ex.: Sentry): avisa a equipe quando algo quebra para um cliente.
- 🟡 **Limite de cadastros por endereço de internet**, contra cadastros falsos em massa (o limite de
  tentativas de login já existe e fica no banco, então funciona com várias cópias do site).
- 🟢 **Busca para catálogos grandes**: hoje a busca carrega todas as ofertas e filtra na memória (ótimo
  para centenas de produtos). Com milhares de produtos, usar a busca de texto do PostgreSQL.

---

## 3. Integração de estoque por API

Hoje cada loja mantém os preços e a disponibilidade **à mão** (no painel) ou **por planilha** (Excel/CSV,
em *Produtos → Importar planilha*). O próximo passo é a loja não precisar fazer nada: o **sistema de
gestão da loja (ERP)** — o programa do caixa, do estoque e das notas fiscais — avisa o Solid sozinho
quando um preço muda ou um produto acaba.

> **API** é uma "porta" para dois sistemas conversarem sem pessoas no meio. Em vez de um funcionário
> digitar o preço novo no Solid, o sistema da loja envia: "cimento CP II, saco 50 kg, R$ 39,90,
> 120 em estoque".

### 3.1 Dois caminhos (que podem existir juntos)

| | **A) API própria do Solid** | **B) Integração com o ERP da loja** |
|---|---|---|
| Como funciona | O Solid publica um endereço seguro; o sistema da loja **envia** os preços e o estoque para ele. | O Solid **busca** os dados no sistema da loja (ou num "conector" que fala com ele), em horários definidos. |
| Quem faz o trabalho na loja | O fornecedor do ERP ou um técnico da loja (uma vez) | O Solid faz a integração uma vez por ERP; cada loja só autoriza o acesso |
| Bom para | Lojas grandes, redes, lojas com equipe de TI | Lojas pequenas e médias, que usam ERPs prontos |
| Custo para o Solid | Menor (uma API serve para todos) | Maior (uma integração por ERP), mas vende mais fácil |

**Recomendação:** começar pela **API própria** (A), que é uma só, e fazer integrações prontas (B) com os
**2 ou 3 ERPs mais usados pelas lojas parceiras** — perguntando a elas antes de escolher.

### 3.2 A) Como seria a API própria do Solid

1. No painel, a loja gera uma **chave de acesso** (como uma senha só para o sistema dela), com permissão
   apenas para **mexer nos produtos dela**. Pode apagar a chave e gerar outra a qualquer hora.
2. O sistema da loja envia os dados no **mesmo formato da planilha** que já existe (código do material,
   embalagem, preço, disponível, faixas de atacado). Assim, todas as regras atuais valem também para a
   API: validação, erros linha por linha e o histórico de importações.
3. Dois jeitos de enviar: **tudo de uma vez** (ex.: toda madrugada) ou **só o que mudou** (na hora em
   que o preço muda no caixa).
4. O Solid responde com o resumo ("12 preços alterados, 2 erros") e guarda o registro, como na planilha.
5. Opcional: o Solid **avisa o sistema da loja** quando entra um pedido novo ("webhook"), para a loja
   não precisar abrir o painel.

Cuidados que já entram no projeto: conexão só por HTTPS; chave guardada só como "impressão digital"
(hash), como as senhas; limite de envios por minuto; cada chave só enxerga a própria loja; registro de
tudo o que foi alterado e por qual chave; documentação pública com exemplos.

**Esforço estimado:** 2 a 4 semanas de um programador para a primeira versão (a importação por planilha
já resolve a parte mais difícil: as regras de validação e o resumo).

### 3.3 B) Integração com os ERPs das lojas

Não encontramos um levantamento público confiável de **quais ERPs são os mais usados** pelas lojas de
material de construção. Exemplos que aparecem com frequência no setor (a confirmar com as lojas
parceiras):

- **Redes médias e grandes:** TOTVS (linha para varejo de home center), WinThor, SAP.
- **Lojas pequenas e médias:** sistemas próprios do segmento (ex.: Una, CIGAM, entre muitos regionais)
  e ERPs genéricos para pequenas empresas, como Bling, Tiny (Olist) e Omie.

Como fazer:

1. **Perguntar às lojas parceiras** qual sistema usam (incluir no cadastro da loja um campo "sistema de
   gestão"). Priorizar os que somam mais lojas.
2. Ver se o ERP tem **API aberta** (Bling, Tiny e Omie, por exemplo, publicam documentação) ou se a
   integração precisa passar pelo **fornecedor/parceiro** (comum em TOTVS, WinThor e SAP).
3. Fazer um **conector** por ERP: ele lê preço e estoque no ERP e envia para a API própria do Solid
   (caminho A). Assim, o Solid tem uma porta só, e cada ERP novo é só mais um conector.
4. **Relacionar os produtos:** o código do produto no ERP da loja é diferente do código do material no
   Solid. Na primeira vez, a loja faz esse "de-para" (uma tela simples: "o seu produto 00123 é o nosso
   *Cimento CP II-E 32, saco 50 kg*"). Depois, é automático.
5. **Começar com uma loja piloto** por ERP, comparando por algumas semanas os preços do Solid com os do
   caixa da loja antes de liberar para todas.

**Esforço estimado:** 1 a 3 semanas por ERP com API aberta; com ERPs fechados, depende do fornecedor
(pode haver custo de licença ou de parceiro de integração).

### 3.4 Ordem sugerida para a integração

1. Planilha (✅ já existe) → 2. API própria com chave por loja → 3. aviso de pedido novo para o
sistema da loja → 4. conectores para os ERPs das lojas parceiras, um de cada vez.

---

## 4. Estimativa de custos mensais

> ⚠️ **Valores de referência, sujeitos a mudança.** Não foi possível consultar os sites dos fornecedores
> ao escrever este documento: confira os preços atuais antes de contratar. Conversão usada:
> **US$ 1 ≈ R$ 5,50**. Muitos serviços cobram em dólar; o valor em reais varia com o câmbio e com
> impostos sobre serviços do exterior (IOF no cartão).

### 4.1 Fase de testes (antes de abrir ao público)

Usando os planos gratuitos, só com pessoas de confiança e dados fictícios:

| Item | Serviço (exemplo) | Custo aproximado |
|---|---|---|
| Hospedagem do site | Vercel — plano Hobby (gratuito, **só para uso não comercial**) | R$ 0 |
| Banco de dados | Neon ou Supabase — plano gratuito | R$ 0 |
| Domínio `.com.br` | registro.br (cerca de R$ 40 por **ano**) | ~R$ 4/mês |
| **Total** | | **~R$ 0 a 10 por mês** |

### 4.2 Lançamento (primeiros meses, até alguns milhares de visitas por dia)

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

### 4.3 Quando o custo sobe

Os custos de hospedagem e banco crescem com o **uso** (visitas, pedidos, tamanho do banco). Um sinal
para revisar o plano: muitas lojas, milhares de produtos ou dezenas de milhares de visitas por mês.
Mesmo assim, para esse porte, o custo de infraestrutura costuma continuar bem abaixo do faturamento
com comissões e planos de anúncio.

---

## 5. Ordem sugerida

1. Publicar o **ambiente de teste** ([PUBLICAR-TESTE.md](PUBLICAR-TESTE.md)) e mostrar a lojistas parceiros e possíveis clientes.
2. Em paralelo: **engenheiro** (coeficientes) e **advogado** (Termos, Privacidade, contrato com lojistas),
   e os primeiros contatos com **fabricantes** (catálogos e kits de imagens).
3. Desenvolver: **e-mails automáticos** (e ligar o "esqueci minha senha" ao Resend), **frete por
   região**, **auditoria externa** e **backup**.
4. Integrar o **pagamento** (com divisão automática para as lojas).
5. **API de estoque e preços** para as lojas (seção 3), começando pelas parceiras.
6. **Teste de invasão profissional** na versão final, no ambiente de teste. Corrigir o que aparecer.
7. Publicar a **produção**, cadastrar o administrador real e as primeiras lojas, e abrir para clientes
   — de preferência começando por uma ou duas regiões do DF.
