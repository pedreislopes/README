# Solid

**Marketplace de materiais de construção para Brasília/DF.** O cliente compara o preço de cimento,
areia, tijolo e outros materiais em várias lojas da sua região e compra tudo em um só lugar.

Esta é a primeira versão (MVP): funciona no seu computador, com lojas, produtos e usuários **fictícios**.
Não há pagamento real nem entrega.

- **Quer testar pela internet, sem instalar nada (no computador ou no iPad)?** Siga o
  [PUBLICAR-TESTE.md](PUBLICAR-TESTE.md): publica um ambiente de **teste** na Vercel, com banco Neon.
- Para o lançamento real, veja o [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md).

---

## Sumário

1. [Como rodar no seu computador (passo a passo)](#1-como-rodar-no-seu-computador-passo-a-passo)
2. [Usuários de teste](#2-usuários-de-teste)
3. [Roteiro para testar o site](#3-roteiro-para-testar-o-site)
4. [Problemas comuns](#4-problemas-comuns)
5. [O que o Solid faz](#5-o-que-o-solid-faz)
6. [Testes automáticos](#6-testes-automáticos)
7. [Para quem for programar](#7-para-quem-for-programar)
8. [Fotos das categorias (trocar as ilustrações)](#8-fotos-das-categorias-trocar-as-ilustrações)

---

## 1. Como rodar no seu computador (passo a passo)

Você vai fazer os passos **1.1 a 1.6 só na primeira vez**. Nas próximas vezes, basta o passo 1.7.

### 1.1 Instale o Node.js (o "motor" que roda o site)

1. Abra o site **https://nodejs.org**.
2. Clique no botão da versão **LTS** (é a versão estável, recomendada).
3. Abra o arquivo baixado e clique em **Avançar/Continuar** até o fim, sem mudar nada.
4. **Reinicie o computador** depois de instalar.

> O Solid precisa do Node.js **20.9 ou mais novo**. A versão LTS do site oficial já atende.

### 1.2 Baixe o projeto

1. Abra a página do projeto no GitHub: **https://github.com/pedreislopes/README**
2. Clique no botão verde **`<> Code`** e depois em **Download ZIP**.
3. Encontre o arquivo baixado (geralmente na pasta **Downloads**) e **descompacte**:
   - **Windows:** clique com o botão direito no arquivo → **Extrair tudo…** → **Extrair**.
   - **Mac:** dê dois cliques no arquivo.
4. Vai aparecer uma pasta (algo como `README-claude-solid-mvp`). Se quiser, mova-a para um lugar fácil,
   como a **Área de Trabalho** ou **Documentos**.

### 1.3 Abra o terminal dentro da pasta do projeto

O terminal é uma janela onde você digita comandos. Não se preocupe: você só vai copiar e colar.

- **Windows:**
  1. Abra a pasta do projeto no Explorador de Arquivos (a pasta que tem o arquivo `package.json`).
  2. Clique na **barra de endereço** lá em cima, apague o que estiver escrito, digite `cmd` e aperte **Enter**.
  3. Abre uma janela preta: esse é o terminal, já dentro da pasta certa.
- **Mac:**
  1. Abra o aplicativo **Terminal** (aperte `Cmd + Espaço`, digite `Terminal` e aperte **Enter**).
  2. Digite `cd ` (com um espaço no final), **arraste a pasta do projeto** para dentro da janela do
     Terminal e aperte **Enter**.

Para conferir se deu certo, digite o comando abaixo e aperte **Enter**:

```
node -v
```

Deve aparecer um número como `v22.12.0` ou maior. Se aparecer "não é reconhecido", veja
[Problemas comuns](#4-problemas-comuns).

> **Como digitar os comandos:** copie a linha (sem o `#` e o que vem depois dele), cole no terminal
> (no Windows, clique com o botão direito para colar) e aperte **Enter**. Espere terminar antes do próximo.

### 1.4 Instale as peças do projeto

```
npm install
```

Demora de 1 a 5 minutos e baixa da internet tudo o que o projeto usa. Mensagens em amarelo
("warn", "deprecated", "vulnerabilities") são normais; o importante é não aparecer **ERR!** no final.

### 1.5 Crie o banco de dados com os dados de teste

```
npm run banco:resetar
```

No final deve aparecer uma lista com ✔, como `✔ 9 lojas, 44 materiais…` e
`Usuários de teste criados. Senha de todos: solid123`.

> Este comando também serve para **voltar os dados ao início** sempre que você quiser
> (ele apaga pedidos, cadastros e alterações feitas nos testes).

### 1.6 (Opcional) Confira se está tudo certo

```
npm test
```

Deve terminar com algo como `Tests  135 passed`.

### 1.7 Ligue o site

```
npm run dev
```

Espere aparecer `Ready` e abra no navegador: **http://localhost:3000**

- Enquanto o terminal estiver aberto, o site funciona. **Não feche a janela.**
- Para **desligar**, clique no terminal e aperte `Ctrl + C` (no Mac também é `Ctrl`, não `Cmd`).
- Nas próximas vezes: abra o terminal na pasta (passo 1.3) e rode só `npm run dev`.

#### Ver no celular (opcional)

Com o computador e o celular **no mesmo Wi-Fi**, abra no celular o endereço que o terminal mostra na
linha **Network** (algo como `http://192.168.0.10:3000`). Se não abrir, o firewall/antivírus do
computador pode estar bloqueando; nesse caso, use o navegador do computador no modo celular
(tecla `F12` → ícone de celular).

---

## 2. Usuários de teste

A senha de **todos** é **`solid123`**.

| Tipo | E-mail | O que dá para fazer |
|---|---|---|
| Cliente pessoa física | `cpf@teste.com` | Comprar com preço normal |
| Cliente empresa | `cnpj@teste.com` | Comprar com preço de atacado (Construtora Planalto) |
| Lojista | `lojista@teste.com` | Painel da Casa do Construtor Taguatinga (com 2 pedidos novos) |
| Lojista pendente | `pendente@teste.com` | Painel de uma loja que ainda aguarda aprovação |
| Administrador | `admin@teste.com` | Painel do administrador (aprovar lojas, comissões, relatórios) |

As outras lojas também têm login (senha `solid123`): `ceilandia@`, `aguasclaras@`, `asanorte@`,
`samambaia@`, `gama@`, `sobradinho@`, `guara@`, `lagosul@` e `valparaiso@teste.com`.

### Lojas de teste

| Loja | Região | Comissão | Observação |
|---|---|---|---|
| Casa do Construtor Taguatinga | Taguatinga | 3% | Loja do `lojista@teste.com` |
| Depósito Ceilândia Forte | Ceilândia | 0% | |
| Materiais Águas Claras | Águas Claras | 5% | |
| Asa Norte Materiais de Construção | Plano Piloto | 3% | Vende cimento em saco de 25 kg e tijolo avulso |
| Samambaia Depósito Popular | Samambaia | 0% | |
| Gama Construções e Materiais | Gama | 5% | |
| Sobradinho Casa & Obra | Sobradinho | 4% | Plano **Destaque** (anúncio "Patrocinado") |
| Guará Material de Construção | Guará | 3% | Plano **Premium** (anúncio "Patrocinado", prioridade no topo) |
| Lago Sul Acabamentos e Construção | Lago Sul | 4% | |
| Valparaíso Materiais de Construção | Valparaíso de Goiás (Entorno) | 3% | Loja do Entorno, para testar o filtro "Todo o Entorno" |
| Depósito Nova Era Vicente Pires | Vicente Pires | 5% | **Aguardando aprovação**: não aparece na busca |

- Regiões: as **35 regiões administrativas oficiais do DF** e as principais cidades do **Entorno**,
  separadas em "DF" e "Entorno" no filtro da busca (com as opções "Todo o DF" e "Todo o Entorno").
  A lista fica em `src/config/constantes.ts`.
- 60 materiais em 11 categorias, com diferença de 8% a 20% entre a loja mais barata e a mais cara.
  As lojas com anúncio (Destaque/Premium) nunca são as mais baratas, para os selos aparecerem juntos.
- Faixas de atacado só para CNPJ, **exceto** em *Argamassa colante AC-I* e *Bloco de concreto
  14x19x39*, que valem também para CPF.
- **Ferragens, ferramentas e EPI**: pregos, parafusos, arames, discos, fita isolante, luvas, óculos,
  capacete e ferramentas de marca (martelo, trena, nível, colher de pedreiro, desempenadeira), em que
  cada oferta mostra a **marca** em destaque.
- 6 pedidos de exemplo e 1 sugestão de material aguardando o administrador.
- Tudo isso fica em `prisma/dados-teste.ts`, em listas fáceis de ler e editar.

---

## 3. Roteiro para testar o site

Sugestão de 15 minutos para ver tudo funcionando. Use o navegador no **modo celular** (tecla `F12` →
ícone de celular) para ver como o cliente vai usar.

1. **Busca** — sem entrar na conta, busque `cimento cp2`, `areia media`, `tijolo 8 furo` e `pedra`.
   Veja o selo **Melhor preço**, as **Ofertas premium/destaque** no topo com "Patrocinado ⓘ" e o
   preço por kg. Busque `areia rosa` para ver as sugestões. Toque no **?** ao lado de *Areia fina*
   para ver a explicação do material. Em **Filtros → Região**, escolha **Todo o Entorno** ou **Lago Sul**.
   Na página inicial, toque em **Areia e pedra** para ver o guia **Qual escolher?**. Busque `martelo`
   para comparar preço e marca.
2. **Carrinho** — adicione 42 sacos de cimento da Casa do Construtor Taguatinga e 2,5 m³ de areia.
   Vá ao carrinho e entre com `cnpj@teste.com`: os itens continuam lá, aparece
   "Adicione mais 8 sacos e pague…". Toque em **Levar 50 sacos** e depois em **Confirmar pedido**.
3. **Calculadora** — em **Calcular**, escolha *Muro de alvenaria*, 10 m × 2 m. Veja o cálculo passo a
   passo, compare **Menor preço por item** com **Tudo numa loja só** e monte o carrinho.
4. **Lojista** — saia da conta e entre com `lojista@teste.com`. Veja o aviso de pedidos novos, a
   comissão de cada pedido, avance o status e cancele um pedido com motivo. Em **Produtos**, mude um
   preço direto na lista, marque um item como **Sem estoque** e faça um reajuste de +5%. Toque em
   **Importar planilha**, baixe o modelo em Excel, mude alguns preços, envie e confira o resumo antes
   de confirmar.
5. **Administrador** — entre com `admin@teste.com`. Aprove o *Depósito Nova Era*, mude a comissão e o
   plano de anúncio de uma loja, baixe a planilha de pedidos e confira tudo em **Registro**.
6. **Esqueci minha senha** — saia da conta, toque em **Entrar → Esqueci minha senha** e informe
   `cpf@teste.com`. Como ainda não há serviço de e-mail, o link aparece no **terminal** onde o site está
   rodando (`npm run dev`). Abra o link, crie uma senha nova e entre com ela.
7. Quando terminar, rode `npm run banco:resetar` para voltar os dados ao início (inclusive as senhas).

---

## 4. Problemas comuns

| O que aparece | O que fazer |
|---|---|
| `'node' não é reconhecido` / `command not found: node` | O Node.js não foi instalado ou o computador não foi reiniciado. Refaça o passo 1.1 e reinicie. |
| `npm ERR!` durante o `npm install` | Confira a internet e rode `npm install` de novo. Se continuar, apague a pasta `node_modules` e tente outra vez. |
| `Could not find a package.json` / `ENOENT` | O terminal não está dentro da pasta do projeto. Refaça o passo 1.3 (a pasta certa tem o arquivo `package.json`). |
| `Port 3000 is in use` | Outro programa (ou outro terminal com o site) está usando a porta. Feche o outro terminal ou rode `npm run dev -- -p 3001` e abra `http://localhost:3001`. |
| O site abre, mas sem lojas/produtos | Rode `npm run banco:resetar` (passo 1.5). |
| "Muitas tentativas seguidas" ao entrar | É a proteção contra senhas erradas (5 erros = 15 minutos). Espere ou rode `npm run banco:resetar`. |
| Quero começar do zero | Rode `npm run banco:resetar`. |
| Troquei a foto de uma categoria, mas aparece a antiga | Recarregue a página com `Ctrl + Shift + R` (no Mac, `Cmd + Shift + R`). No computador, se continuar, pare o site, apague a pasta `.next` e rode `npm run dev` de novo. |
| "Esqueci minha senha" não chega no e-mail | Normal por enquanto: ainda não há serviço de e-mail. O link aparece no terminal (no computador) ou nos **Logs** da Vercel (ambiente de teste). |

---

## 5. O que o Solid faz

### Para o cliente
- **Busca tolerante**: ignora acentos, maiúsculas e pequenos erros; entende sinônimos de obra
  ("pedra" = brita, "massa" = argamassa, "bloco" = tijolo de concreto). Lista em `src/config/sinonimos.ts`.
- **Comparação justa**: preço por kg, m³, metro ou unidade, para comparar embalagens diferentes. O
  selo **Melhor preço** vai para a oferta realmente mais barata.
- **Filtros** por região (as **35 regiões administrativas** do DF e as principais cidades do
  **Entorno**, separadas em "DF" e "Entorno", com "Todo o DF" e "Todo o Entorno"), categoria e preço.
- **Explicação dos materiais**: ícone **?** ao lado do nome (busca, página do produto e calculadora) com
  *o que é, para que serve e quando usar*; e o guia **Qual escolher?** na página de cada categoria.
  **Textos em `src/config/explicacoes-materiais.ts`, com fonte e campo de revisão para o engenheiro.**
- **Ferramentas de marca** (martelo, trena…): um material genérico com a **marca em destaque** em cada
  oferta, para comparar preço e marca lado a lado.
- **Anúncios identificados**: até 3 no topo (ajustável em `src/config/anuncios.ts`). Lojas **Premium**
  vêm primeiro, depois **Destaque**, cada plano ordenado por preço e com rodízio justo quando há mais
  lojas que vagas. A palavra **"Patrocinado"** fica sempre visível (Código de Defesa do Consumidor).
- **Cadastro** como pessoa física (CPF) ou empresa (CNPJ). Empresas veem **preço de atacado**.
- **Esqueci minha senha**: link por e-mail que vale 30 minutos e uma única vez; a tela nunca revela se
  o e-mail tem cadastro. Sem serviço de e-mail configurado, o link aparece no registro do servidor
  (para testes). Para ligar o envio de verdade (Resend), veja o começo de `src/lib/email.ts`.
- **Carrinho** com itens de várias lojas, que não some ao entrar na conta; quantidades no formato vendido
  (sacos inteiros, areia de 0,5 em 0,5 m³); faixa de atacado automática; incentivo "adicione mais X";
  aviso se a loja mudar o preço antes da confirmação.
- **Pedido** dividido por loja, com "foto" dos preços (mudanças futuras não alteram pedidos feitos),
  frete "a combinar com a loja" e cancelamento com motivo enquanto o pedido não foi separado.
- **Calculadora de obra** (muro, contrapiso, laje, reboco e piso): cálculo passo a passo, 10% de perda,
  arredondamento para cima e dois planos de compra (menor preço por item × tudo numa loja só).
  **Coeficientes em `src/config/calculadora.ts`, aguardando revisão de engenheiro civil.**

### Para o lojista (`/loja`)
- Aviso de **pedidos novos** com contador; comissão de cada pedido e quanto a loja recebe.
- Status do pedido: Novo → Recebido → Separado → Entregue; cancelamento com motivo antes de separar.
- Produtos: cadastrar, editar, remover, **edição rápida de preço**, **Disponível / Sem estoque**,
  **reajuste em massa** em %, faixas de atacado (só CNPJ ou também CPF), busca na própria lista.
- **Importar planilha** (Excel .xlsx ou CSV): baixa o modelo já preenchido com os produtos da loja,
  altera preços, faixas de atacado e disponibilidade, envia e vê o resumo antes de gravar ("12 preços
  alterados, 3 produtos novos, 2 erros"), com os erros apontados **linha por linha**. Cada importação
  fica no **histórico** da loja.
- Nas **ferramentas de marca**, a marca é obrigatória no cadastro.
- **Sugerir material** que não está no catálogo; ver o **plano de anúncio** da loja.
- Loja pendente usa o painel normalmente, com o aviso de que ainda não aparece na busca.

### Para o administrador (`/admin`)
- **Indicadores**: total vendido, comissões, pedidos, lojas ativas e pendentes.
- **Lojas**: aprovar, recusar (com motivo), suspender (com motivo) e reativar; comissão (vale só para
  pedidos novos); **plano de anúncio** (Nenhum, Destaque ou Premium).
- **Relatório** de pedidos e comissões por período, loja e situação, com **planilha CSV**.
- **Catálogo**: incluir materiais (com a opção "ferramenta de marca") e aprovar/recusar sugestões dos lojistas.
- **Registro (auditoria)** de todas as ações do administrador: quem fez, o quê e quando.

### Segurança
- Senhas com criptografia forte (bcrypt); login com mensagem única e o mesmo tempo de resposta, para não
  revelar quem tem cadastro; bloqueio após 5 erros seguidos. Redefinir a senha desconecta a conta de
  todos os aparelhos.
- CPF/CNPJ validados e sem repetição; documento **mascarado** na tela; aceite de Termos e Privacidade
  registrado (LGPD). Textos provisórios em `/termos` e `/privacidade`.
- Cada página e cada ação confere quem está pedindo: cliente, lojista e administrador só acessam o que é
  seu (verificado nos testes automáticos de segurança).

---

## 6. Testes automáticos

| Comando | O que testa |
|---|---|
| `npm test` | **135 testes das regras**: busca (com sinônimos e plurais), preço por unidade, faixas de atacado, carrinho, calculadora, comissão, cancelamento, relatório/CSV, anúncios Premium/Destaque e rodízio (contador no banco), CPF/CNPJ, limite de login, regiões do DF/Entorno, explicações dos materiais, importação por planilha, "esqueci minha senha", imagens das categorias, configuração do banco PostgreSQL da Vercel. |
| `npm run test:e2e` | **43 testes de ponta a ponta**: um navegador de verdade, do tamanho de um **celular de 360 px**, clica pelo site inteiro (página inicial, busca e filtros de região, explicação dos materiais, cadastro, "esqueci minha senha", carrinho, pedido, calculadora, lojista, importação por planilha, administrador e segurança). |

Para os testes de ponta a ponta, na primeira vez rode também `npx playwright install chromium`
(baixa o navegador de teste). **Atenção:** eles apagam e recriam os dados de teste do banco.

---

## 7. Para quem for programar

### Tecnologia
- **Next.js 16 + TypeScript** (site e servidor juntos), **Tailwind CSS** (visual), **Prisma + SQLite**
  (banco de dados em um arquivo, `prisma/dev.db`), **Vitest** e **Playwright** (testes).
- Escolha feita por ser popular, fácil de manter e de publicar (ex.: Vercel). Para a internet, o SQLite
  deve ser trocado por PostgreSQL: veja [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md).

### Comandos

```
npm install            # instala as dependências
npm run banco:resetar  # cria/atualiza o banco e recria os dados de teste
npm run banco:gerar-postgres  # após mudar prisma/schema.prisma: regera a cópia PostgreSQL (Vercel)
npm run dev            # site em modo de desenvolvimento: http://localhost:3000
npm run build          # gera a versão de produção
npm start              # roda a versão de produção (depois do build)
npm test               # testes das regras
npm run test:e2e       # testes de ponta a ponta (celular 360 px)
npm run lint           # verificador de código
```

### Onde fica cada coisa

| Pasta / arquivo | O que tem |
|---|---|
| `src/app/` | Páginas do site (cada pasta é um endereço: `busca/` = `/busca`, `loja/` = painel do lojista, `admin/` = painel do administrador) |
| `src/components/` | Peças visuais reaproveitadas (menu, cartão de oferta, selos, formulários) |
| `src/config/` | **Configurações editáveis**: regiões, categorias, sinônimos, coeficientes da calculadora, anúncios, carrinho, segurança |
| `src/domain/` | **Regras de negócio** (preços, faixas, carrinho, calculadora, comissão, busca), cada uma com seus testes `*.test.ts` |
| `src/lib/` | Banco de dados, login/sessão, ações do servidor (carrinho, loja, administrador), auditoria |
| `prisma/schema.prisma` | Estrutura do banco de dados (comentada) |
| `prisma/dados-teste.ts` / `prisma/seed.ts` | Dados de teste e o programa que os grava |
| `e2e/` | Testes de ponta a ponta |
| `src/config/explicacoes-materiais.ts` | Explicações dos materiais e guias "Qual escolher?" (para o engenheiro revisar) |
| `public/categorias/` | Imagens das categorias da página inicial (veja a seção 8) |
| `scripts/` | Publicação na Vercel, cópia PostgreSQL do banco, ilustrações das categorias |
| `PROXIMOS-PASSOS.md` | Como publicar, o que falta antes do lançamento, integração de estoque por API e custos |
| `CREDITOS-IMAGENS.md` | Origem e licença de cada imagem usada no site |

### Regras de ouro do código
- Dinheiro sempre em **centavos** (números inteiros).
- Regras de negócio ficam em `src/domain/` (sem banco de dados), para poderem ser testadas.
- Toda página e ação restrita começa verificando quem está pedindo (`exigirLoja()`, `exigirAdmin()`,
  `usuarioAtual()`), **inclusive dentro dos painéis** (a "moldura" da página não basta).
- Toda ação do administrador grava o registro de auditoria na mesma transação (`registrarAcao`).

---

## 8. Fotos das categorias (trocar as ilustrações)

A página inicial mostra uma imagem para cada categoria. Por enquanto são **ilustrações** feitas para o
Solid. Para trocar por **fotos reais**:

1. **Escolha a foto** num banco gratuito com uso comercial liberado: [Unsplash](https://unsplash.com) ou
   [Pexels](https://www.pexels.com). Prefira fotos do material "na hora" (pilha de areia, tijolos,
   sacos de cimento **sem marca aparecendo**), com fundo simples.
2. **Formato e tamanho ideais**:
   - **JPG**, na horizontal, proporção **4:3** — o ideal é **1200 × 900 pixels** (no mínimo 800 × 600).
   - Até **500 KB** (os sites de fotos oferecem baixar em tamanho "Médio"/"Medium", que já serve).
   - Se a foto não for 4:3, tudo bem: o site corta as bordas para caber. Deixe o material no **centro**.
3. **Dê ao arquivo o MESMO nome** da imagem que vai substituir (tudo minúsculo, sem acentos):

   | Categoria | Nome do arquivo |
   |---|---|
   | Cimento e argamassa | `cimento-e-argamassa.jpg` |
   | Areia e pedra | `areia-e-pedra.jpg` |
   | Tijolos e blocos | `tijolos-e-blocos.jpg` |
   | Aço para estrutura | `aco-para-estrutura.jpg` |
   | Ferragens, ferramentas e EPI | `ferragens-ferramentas-e-epi.jpg` |
   | Hidráulica | `hidraulica.jpg` |
   | Elétrica | `eletrica.jpg` |
   | Pisos e revestimentos | `pisos-e-revestimentos.jpg` |
   | Tintas | `tintas.jpg` |
   | Madeiras | `madeiras.jpg` |
   | Telhas e coberturas | `telhas-e-coberturas.jpg` |

4. **Coloque o arquivo na pasta `public/categorias/`**, substituindo o antigo.
   - **Pelo GitHub (navegador, até no iPad):** abra o repositório → pasta `public` → `categorias` →
     **Add file → Upload files** → arraste a foto (com o nome certo) → **Commit changes**. A Vercel
     publica sozinha em poucos minutos.
   - **No computador:** copie a foto para a pasta e rode o site normalmente.
5. **Registre a origem** da foto no arquivo [CREDITOS-IMAGENS.md](CREDITOS-IMAGENS.md) (autor, site e
   endereço da foto). Não é obrigatório pelas licenças do Unsplash/Pexels, mas é a boa prática e ajuda
   se alguém perguntar de onde veio a imagem.

**Você não precisa redimensionar nem converter nada:** o site (componente de imagem do Next.js) gera
sozinho versões menores e mais leves (WebP/AVIF) para cada tela, e o celular baixa só o tamanho de que
precisa. Para refazer as ilustrações originais de uma categoria:
`node scripts/ilustracoes-categorias.mjs areia-e-pedra` (sem o nome, refaz **todas** e apaga as fotos).

