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

## Onde fica cada coisa

| Pasta | O que tem |
|---|---|
| `src/app/` | As páginas do site (cada pasta é um endereço, ex.: `busca/` = `/busca`) |
| `src/components/` | Peças visuais reaproveitadas (menu, logo…) |
| `src/config/` | Listas e configurações (regiões, categorias; depois, a calculadora) |
| `src/domain/` | Regras de negócio (cálculos de preço, comissão, calculadora) |
| `src/lib/` | Utilitários (banco de dados, formatação de dinheiro) |
| `prisma/` | Estrutura do banco de dados e dados de teste |
