# Solid

Marketplace de materiais de construção para Brasília/DF: compare preços entre lojas e compre tudo em um só lugar.

> 🚧 Projeto em construção. O passo a passo completo para rodar no seu computador
> será escrito ao final (Etapa 10).

## Comandos principais (para quem já tem o Node.js instalado)

```bash
npm install            # baixa as dependências
npm run banco:resetar  # cria o banco de dados com os dados de teste
npm run dev            # liga o site em http://localhost:3000
npm test               # roda os testes automáticos
```

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
| Sobradinho Casa & Obra | Sobradinho | 4% | **Em destaque (Patrocinado)**, nunca é a mais barata |
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

## Onde fica cada coisa

| Pasta | O que tem |
|---|---|
| `src/app/` | As páginas do site (cada pasta é um endereço, ex.: `busca/` = `/busca`) |
| `src/components/` | Peças visuais reaproveitadas (menu, logo…) |
| `src/config/` | Listas e configurações (regiões, categorias; depois, a calculadora) |
| `src/domain/` | Regras de negócio (cálculos de preço, comissão, calculadora) |
| `src/lib/` | Utilitários (banco de dados, formatação de dinheiro) |
| `prisma/` | Estrutura do banco de dados e dados de teste |
