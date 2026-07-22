# 🎟️ Ticketeira

Marketplace de ingressos para shows e eventos — organize, venda e compre ingressos em um só lugar.

![Stack](https://img.shields.io/badge/React_19-Vite-8b5cf6) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

## O que dá para fazer

- **Explorar eventos** — busca por nome/cidade e filtro por categoria
- **Comprar ingressos** — escolha de lote, quantidade e checkout com PIX ou cartão (simulado)
- **Criar eventos** — formulário do organizador com lotes dinâmicos e preview ao vivo
- **Meus ingressos** — códigos dos ingressos em formato de ticket
- **Painel do organizador** — vendas, receita estimada e ocupação por evento

> MVP front-end: os dados ficam em `localStorage` (com seed de eventos demo) e o pagamento é simulado.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # gera dist/
npm run preview # serve o build localmente
```

## Stack

- React 19 + Vite
- React Router 7
- CSS puro (design system próprio em `src/index.css`)
- Deploy na Vercel (`vercel.json` com rewrite para SPA)
