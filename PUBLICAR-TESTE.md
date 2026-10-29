# Solid — Publicar o ambiente de TESTE (pelo navegador: computador ou iPad)

Este guia coloca o Solid na internet **para testes**, com os mesmos dados fictícios de sempre.
Tudo é feito **pelo navegador** (Chrome, Edge, Safari ou Firefox), no computador ou no iPad, sem instalar
nada e sem copiar nenhuma senha de banco de dados. No computador, "tocar" = **clicar**.

- **Vercel** (vercel.com): é quem "liga" o site na internet. Plano gratuito (*Hobby*).
- **Neon** (neon.tech): é o banco de dados PostgreSQL, onde ficam lojas, produtos e pedidos. Plano gratuito.
  Você **não precisa** entrar no site do Neon: a conta é criada por dentro da Vercel.

Tempo estimado: **20 a 30 minutos**.

> ⚠️ Eu (Claude) não consigo abrir a Vercel nem o Neon daqui. Os nomes dos botões abaixo são os que essas
> empresas usam hoje, mas podem mudar um pouco. Se algo estiver diferente, procure a palavra mais
> parecida — e me mande uma foto da tela se ficar em dúvida.
> O processo de publicação foi testado aqui com um PostgreSQL de verdade, simulando a Vercel.

---

## Sumário

1. [Antes de começar](#1-antes-de-começar)
2. [Criar a conta na Vercel](#2-criar-a-conta-na-vercel)
3. [Importar o projeto do GitHub](#3-importar-o-projeto-do-github)
4. [Configurar as duas "variáveis" (antes de publicar)](#4-configurar-as-duas-variáveis-antes-de-publicar)
5. [Primeira publicação (vai dar erro — é de propósito)](#5-primeira-publicação-vai-dar-erro--é-de-propósito)
6. [Criar o banco no Neon e ligar ao projeto](#6-criar-o-banco-no-neon-e-ligar-ao-projeto)
7. [Publicar de novo (Redeploy)](#7-publicar-de-novo-redeploy)
8. [Abrir o site](#8-abrir-o-site)
9. [Tarefas do dia a dia](#9-tarefas-do-dia-a-dia)
10. [Problemas comuns](#10-problemas-comuns)
11. [Segurança: o que fica onde](#11-segurança-o-que-fica-onde)

---

## 1. Antes de começar

Você vai precisar de:

- Um computador (ou iPad) com navegador e internet.
- Seu login do **GitHub** (o mesmo onde está o repositório `README` do Solid).
- Uma **senha de acesso ao site de teste**, inventada por você agora. Ela impede que estranhos abram o
  site. Dicas:
  - Pelo menos **12 caracteres**, misturando letras e números (ex.: três palavras + um número).
  - **Não** use `solid123` nem nenhuma senha que você já usa em outro lugar.
  - Guarde-a num lugar seguro: o gerenciador de senhas do navegador, o app **Senhas**/**Notas** com
    cadeado, ou um papel guardado. **Não** salve num arquivo de texto solto na área de trabalho.

> 💡 Dica: no computador, deixe este guia numa janela e a Vercel em outra, lado a lado. No iPad, use a
> **Split View**
> (os três pontinhos no topo do app) para ver os dois lado a lado.

---

## 2. Criar a conta na Vercel

1. No navegador, abra **vercel.com** e toque em **Sign Up** (Cadastrar).
2. Escolha o plano **Hobby** (gratuito, para projetos pessoais e testes) e digite seu nome.
3. Toque em **Continue with GitHub**.
4. O GitHub pede para você entrar (se ainda não estiver) e depois mostra **Authorize Vercel**.
   Toque em **Authorize**.
5. Pronto: você está no painel (*Dashboard*) da Vercel.

---

## 3. Importar o projeto do GitHub

1. No painel da Vercel, toque em **Add New…** → **Project**.
2. Aparece a lista **Import Git Repository**. Procure o repositório **README** e toque em **Import**.
   - **Não aparece na lista?** Toque em **Adjust GitHub App Permissions** (ou *Install*), escolha sua
     conta, marque **Only select repositories**, selecione **README** e toque em **Save/Install**.
     Volte para a Vercel; o repositório aparece.
3. Na tela **Configure Project**, confira:
   - **Project Name**: pode trocar para `solid-teste` (esse nome vira o endereço do site).
   - **Framework Preset**: **Next.js** (a Vercel detecta sozinha).
   - **Root Directory**: deixe como está (`./`).
   - **Build Command**: **não mexa**. O projeto já traz o comando certo no arquivo `vercel.json`.
4. **Ainda não toque em Deploy.** Primeiro faça o passo 4, nesta mesma tela.

---

## 4. Configurar as duas "variáveis" (antes de publicar)

"Variáveis de ambiente" são anotações secretas que ficam **guardadas na Vercel**, e não no código.
Ainda na tela **Configure Project**, abra a seção **Environment Variables** e adicione duas:

| Key (nome) — digite exatamente assim | Value (valor) | Para que serve |
|---|---|---|
| `SOLID_AMBIENTE` | `teste` | Mostra a faixa "Versão de teste — dados fictícios" e permite gravar os dados de teste. |
| `SENHA_ACESSO_TESTE` | *a senha que você inventou no passo 1* | Pede senha para abrir o site. |

Para cada uma: digite o nome em **Key**, o valor em **Value** e toque em **Add**.

> ⚠️ Cuidado com espaços sobrando no começo ou no fim, e com letras maiúsculas: os nomes têm que ser
> idênticos aos da tabela. No iPad, o teclado às vezes coloca a primeira letra em maiúscula sozinho —
> confira se o valor ficou `teste` (tudo minúsculo).

Agora toque em **Deploy**.

---

## 5. Primeira publicação (vai dar erro — é de propósito)

A Vercel vai trabalhar por 1 ou 2 minutos e mostrar um **erro**. Isso é **esperado**: o site ainda não
tem banco de dados. Se você tocar no registro (*Build Logs*), verá esta mensagem, escrita por nós:

> ✖ Falta conectar o banco de dados. Na Vercel, abra o projeto → aba Storage → crie/conecte o banco
> Neon e depois faça Redeploy. (Isto é esperado na primeira publicação.)

Toque em **Continue to Dashboard** (ou no nome do projeto, no topo) e siga para o passo 6.

---

## 6. Criar o banco no Neon e ligar ao projeto

1. Dentro do projeto na Vercel, toque na aba **Storage**.
   (As abas ficam numa barra no topo do projeto. No iPad, se não couber, deslize a barra para o lado
   ou toque no menu ☰.)
2. Toque em **Create Database** (ou **Connect Database** → **Create New**).
3. Na lista de provedores, escolha **Neon** (*Serverless Postgres*) e toque em **Continue**.
4. Se pedir, aceite os termos do Neon (**Accept and Create**). É assim que a conta gratuita do Neon é
   criada — sem você precisar visitar o site deles.
5. Escolha:
   - **Region** (região): **Washington, D.C., USA (East)** — `iad1`/`us-east-1`. É onde a Vercel roda o
     site por padrão; banco e site perto um do outro = site mais rápido.
   - **Plan**: **Free**.
   - **Database name**: pode deixar o sugerido ou escrever `solid-teste`.
6. Toque em **Create** / **Continue**.
7. Na tela seguinte (**Connect Project** / *Connect to project*):
   - Escolha o projeto **solid-teste** (ou o nome que você deu).
   - Marque os ambientes **Production**, **Preview** e **Development** (todos).
   - Se aparecer um campo **Custom Prefix** / *Environment variables prefix*, **deixe como veio**
     (o Solid entende os nomes padrão e também os com prefixo, como `STORAGE_…`).
   - Toque em **Connect**.

Pronto: a Vercel guardou, sozinha, o endereço secreto do banco nas variáveis do projeto.
**Você não precisa copiar nem ver esse endereço.**

---

## 7. Publicar de novo (Redeploy)

1. Toque na aba **Deployments**.
2. No primeiro item da lista (o que deu erro), toque nos **três pontinhos ⋯** → **Redeploy**.
3. Na janelinha, toque em **Redeploy** de novo.
4. Espere de 2 a 4 minutos. Desta vez, o registro mostra, entre outras coisas:
   - `Banco vazio: gravando os dados de teste…`
   - `✔ 11 lojas, 60 materiais, 586 ofertas`
   - e termina com **Ready** (pronto) ✅.

O que aconteceu por baixo dos panos: o Solid criou as tabelas no banco, gravou as lojas, produtos e
usuários de teste (só porque `SOLID_AMBIENTE` é `teste` **e** o banco estava vazio) e montou o site.

---

## 8. Abrir o site

1. Toque em **Visit** (ou no endereço que termina em **`.vercel.app`**, por exemplo
   `solid-teste.vercel.app`).
2. O navegador abre uma janelinha (**"Fazer login"** / **"Entrar"**) pedindo usuário e senha:
   - **Usuário**: `solid`
   - **Senha**: a senha de acesso que você criou no passo 1.
   - Se o navegador oferecer, escolha **Salvar senha** — assim ele não pergunta toda vez.
3. No topo do site deve aparecer a faixa escura:
   **🧪 Versão de teste — dados fictícios. Nenhuma compra é real.**
4. Na tela **Entrar** do Solid aparece a caixa **"Contas de teste"** com os e-mails para testar.
   A senha de todas essas contas fictícias é `solid123`:

   | Quem | E-mail |
   |---|---|
   | Cliente pessoa física (CPF) | `cpf@teste.com` |
   | Cliente empresa (CNPJ) | `cnpj@teste.com` |
   | Lojista | `lojista@teste.com` |
   | Administrador | `admin@teste.com` |

5. Siga o roteiro da seção 3 do [README.md](README.md#3-roteiro-para-testar-o-site) para testar.

> 💡 **Atalho:** no computador, adicione aos **Favoritos** (Ctrl+D; no Mac, ⌘+D). No iPad, no Safari, toque em **Compartilhar** (quadrado com seta) →
> **Adicionar à Tela de Início**. O Solid vira um ícone, como um app.

> 🐢 **O primeiro acesso do dia pode demorar uns 5 a 10 segundos.** O banco gratuito do Neon "dorme"
> quando ninguém usa e acorda no primeiro pedido. Depois fica rápido.

---

## 9. Tarefas do dia a dia

### Voltar os dados de teste ao início

Depois de muitos testes (pedidos, cadastros, preços alterados), para recomeçar do zero:

1. **Settings** → **Environment Variables** → adicione `RESETAR_DADOS_TESTE` com valor `sim` → **Save**.
2. **Deployments** → ⋯ no primeiro item → **Redeploy**.
3. Quando ficar **Ready**, **apague** a variável `RESETAR_DADOS_TESTE` (ícone ⋯ → **Remove**).
   Se esquecer, os dados voltam ao início **a cada** publicação nova.

### Trocar a senha de acesso ao site

**Settings** → **Environment Variables** → `SENHA_ACESSO_TESTE` → ⋯ → **Edit** → nova senha → **Save**.
Depois faça um **Redeploy** (a senha nova só vale após publicar de novo).

### Mostrar o site para outra pessoa

Mande o **endereço** por um canal (ex.: WhatsApp) e a **senha de acesso** por outro (ex.: falando ou
SMS). Assim, se uma mensagem vazar, a outra metade continua protegida. O usuário é sempre `solid`.

### Atualizações do código

Toda vez que uma mudança for enviada ao GitHub (como as que eu faço), a Vercel publica sozinha
em 2 a 4 minutos. Hoje o repositório tem um só ramo (*branch*), o `claude/solid-mvp`, e é ele que a
Vercel publica no endereço principal `….vercel.app`. Se no futuro surgirem outros ramos, cada um ganha
um endereço de **prévia** separado (*Preview*), usando o **mesmo banco de teste**.

Os dados **não** são apagados nessas publicações, com duas exceções:
- quando você usa `RESETAR_DADOS_TESTE=sim` (veja acima);
- quando **os próprios dados de teste mudam** numa atualização (ex.: lojas ou materiais novos). Aí o
  registro da publicação mostra, por exemplo, `Dados de teste mudaram (versão 2 → 3): recriando os dados de teste…`
  e tudo volta ao início, já com os dados novos. Pedidos e alterações feitos nos testes se perdem.

### Ver o link de "Esqueci minha senha"

Ainda não há serviço de e-mail. No ambiente de teste, o e-mail com o link aparece no **registro do
servidor**:

1. Peça o link no site (**Entrar → Esqueci minha senha**).
2. Na Vercel, abra o projeto → **Logs** (barra da esquerda).
3. Procure a linha `E-MAIL (não enviado: serviço de e-mail não configurado)` e copie o endereço que
   começa com `https://…/redefinir-senha?token=`. Ele vale 30 minutos e uma vez só.

Para enviar e-mails de verdade (Resend), veja o começo do arquivo `src/lib/email.ts`: basta criar as
variáveis `RESEND_API_KEY` e `EMAIL_REMETENTE` e fazer Redeploy.

> ℹ️ Para conferir qual ramo é o principal: **Settings** → **Git** → **Production Branch**.

### Custos

- **Vercel Hobby**: grátis. Atenção: as regras da Vercel dizem que o Hobby é para uso **não comercial**.
  Para testes, tudo bem; para abrir ao público com vendas reais, é preciso o plano **Pro** (veja
  [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md)).
- **Neon Free**: grátis, com limites de espaço e de horas de uso por mês, muito acima do que um ambiente
  de teste usa. Nenhum dos dois pede cartão de crédito no plano gratuito (se pedir, confira se escolheu
  **Hobby** e **Free**).

---

## 10. Problemas comuns

| O que aparece | O que fazer |
|---|---|
| Erro "**Falta conectar o banco de dados**" | Normal na 1ª vez. Faça o passo 6 e depois o 7 (*Redeploy*). Se já fez o 6, confira em **Storage** se o banco aparece ligado ao projeto, em todos os ambientes. |
| O repositório **README** não aparece para importar | Passo 3, item "Não aparece na lista?" (*Adjust GitHub App Permissions*). |
| O site não pede senha | A variável `SENHA_ACESSO_TESTE` não foi salva ou o *Redeploy* não foi feito depois de criá-la. Confira em **Settings → Environment Variables** e faça *Redeploy*. |
| O navegador pede a senha sem parar | Usuário errado (é `solid`) ou senha diferente da salva na Vercel. Cuidado com a primeira letra maiúscula automática do teclado. |
| Não aparece a faixa "Versão de teste" | `SOLID_AMBIENTE` está faltando ou não está exatamente `teste` (minúsculo). Corrija e faça *Redeploy*. |
| Site abre, mas **sem lojas nem produtos** | Os dados não foram gravados porque faltava `SOLID_AMBIENTE=teste` quando o banco foi criado. Corrija a variável e faça o "Voltar os dados de teste ao início" (seção 9). |
| "**Muitas tentativas seguidas**" ao entrar | É a proteção contra senha errada (5 erros = 15 minutos). Espere 15 minutos ou volte os dados ao início (seção 9). |
| Erro **500** / "Application error" | Abra **Deployments** → o último item → **Logs** (ou *Runtime Logs*), tire um print e me mande. |
| O site demora no primeiro acesso | O banco gratuito estava "dormindo". Espere uns segundos e recarregue. |

---

## 11. Segurança: o que fica onde

| Informação | Onde fica | Está no código (GitHub)? |
|---|---|---|
| Endereço e senha do banco Neon | Variáveis da Vercel, criadas automaticamente no passo 6 | **Não.** O código só diz "leia a variável `DATABASE_URL`". |
| Senha de acesso ao site de teste | Variável `SENHA_ACESSO_TESTE` na Vercel (e nas suas Notas/Senhas) | **Não.** |
| Senhas dos usuários que se cadastrarem | No banco, **embaralhadas** (bcrypt) — nem o administrador consegue ler | **Não.** |
| Senha `solid123` das contas fictícias | Nos dados de teste | **Sim, de propósito**: são contas de mentira, e o site inteiro fica atrás da senha de acesso. |

Proteções que o próprio código garante:

- Os dados fictícios **só** são gravados quando `SOLID_AMBIENTE=teste`. Num banco sem essa marcação
  (por exemplo, um futuro banco de produção), o comando que grava os dados de teste **se recusa a rodar**.
- A senha de acesso é comparada de forma segura (sem dar pistas de "quase acertou").
- Arquivos `.env` (onde programadores costumam guardar segredos no computador) são ignorados pelo Git
  e nunca vão para o GitHub.

> 🔒 **Nunca** cole o endereço do banco (o texto que começa com `postgresql://`) em mensagens, e-mails ou
> no código. Se ele vazar, abra **Storage** → o banco → **Settings**/**Open in Neon** → *Reset password*
> e faça um *Redeploy*.

---

### Para quem for programar (detalhes técnicos)

- `vercel.json` manda a Vercel usar `node scripts/build-vercel.mjs`, que:
  1. encontra o endereço do banco (`DATABASE_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL` ou
     `<PREFIXO>_DATABASE_URL`; para migrações, `DATABASE_URL_UNPOOLED` e equivalentes) — ver
     `scripts/url-banco.mjs`;
  2. gera o Prisma Client com `prisma/postgres/schema.prisma` e roda `prisma migrate deploy`
     com as migrações de `prisma/postgres/migrations`;
  3. se `SOLID_AMBIENTE=teste` **e** (banco vazio **ou** `RESETAR_DADOS_TESTE=sim` **ou** versão dos
     dados de teste diferente da gravada no banco — `scripts/versao-dados-teste.mjs`), roda o seed;
  4. roda `next build`.
- `prisma/postgres/schema.prisma` é **gerado** a partir de `prisma/schema.prisma`
  (`npm run banco:gerar-postgres`). Um teste automático falha se os dois ficarem diferentes. Ao mudar o
  schema, gere também a migração PostgreSQL correspondente (`prisma migrate diff`).
- `src/proxy.ts` aplica o *HTTP Basic Auth* quando `SENHA_ACESSO_TESTE` existe.
- `src/config/ambiente.ts` controla a faixa "Versão de teste" e a caixa de contas de teste em `/entrar`.
- Localmente nada muda: sem essas variáveis, o projeto continua usando SQLite (`prisma/dev.db`).
