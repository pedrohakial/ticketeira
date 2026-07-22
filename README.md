# 🎟️ Ticketeira

Marketplace de ingressos para shows e eventos — organize, venda e compre ingressos em um só lugar.

![Stack](https://img.shields.io/badge/React_19-Vite-8b5cf6) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

## O que dá para fazer

- **Explorar eventos** — busca por nome/cidade e filtro por categoria
- **Comprar ingressos** — escolha de lote, quantidade e checkout com pagamento via Mercado Pago
- **Criar eventos** — formulário do organizador com lotes dinâmicos e preview ao vivo
- **Meus ingressos** — códigos dos ingressos em formato de ticket
- **Painel do organizador** — vendas, receita estimada e ocupação por evento

Os dados vivem no **Supabase** (Postgres) e o pagamento é processado pelo **Mercado Pago**
(checkout externo + webhook de confirmação).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

> Sem `.env.local` o app sobe, mas as páginas exibem erro ao carregar dados.
> Em `npm run dev` as rotas `/api/*` (Vercel Functions) não existem — o checkout
> entra automaticamente em **modo demonstração** (botão "Simular pagamento aprovado").

## Build

```bash
npm run build   # gera dist/
npm run preview # serve o build localmente
```

## Supabase

O banco é versionado em `supabase/migrations/`:

- `events`, `ticket_tiers` — catálogo público (leitura anônima, insert aberto para o MVP)
- `orders`, `tickets` — escritos **somente via RPCs** `security definer`:
  - `create_order(...)` — cria pedido `pendente` (sem baixar estoque)
  - `confirm_order(order_id, mp_payment_id)` — baixa estoque e emite os tickets
  - `cancel_order(order_id)` — cancela pedido pendente

Para aplicar o schema em um projeto novo: `supabase db push` (ou rode os SQLs no SQL Editor).

## Variáveis de ambiente

Ver `.env.example`. Resumo:

| Variável | Onde | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | frontend + functions | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | frontend | leitura pública + RPCs de compra |
| `SUPABASE_SERVICE_ROLE_KEY` | functions apenas | escrita no banco pelas APIs — **nunca expor** |
| `MP_ACCESS_TOKEN` | functions apenas | access token do Mercado Pago |
| `PUBLIC_URL` | functions apenas | URL pública do deploy (back_urls + webhook) |

Na Vercel, cadastre todas em *Project Settings → Environment Variables*.

## Fluxo de pagamento (Mercado Pago)

1. O checkout cria o pedido `pendente` via RPC `create_order`.
2. `POST /api/create-preference` (`api/create-preference.js`) cria a preferência no MP e
   devolve o `init_point`; o comprador é redirecionado ao checkout do Mercado Pago.
3. O MP notifica `POST /api/mp-webhook` (`api/mp-webhook.js`), que chama `confirm_order`
   (pagamento aprovado → baixa estoque + emite tickets) ou `cancel_order`.
4. A página `/confirmacao/:orderId` faz polling até o pedido sair de `pendente`.

**Em produção**, cadastre o webhook no painel do Mercado Pago apontando para
`https://<seu-dominio>/api/mp-webhook` (evento: `payment`).

Sem `MP_ACCESS_TOKEN` configurado, `/api/create-preference` responde 503 e o frontend
oferece o modo demonstração (confirma o pedido direto pela RPC `confirm_order`).

## Stack

- React 19 + Vite
- React Router 7
- Supabase (`@supabase/supabase-js`)
- Mercado Pago (Checkout Pro + webhook, via Vercel Functions)
- CSS puro (design system próprio em `src/index.css`)
- Deploy na Vercel (`vercel.json` com rewrite para SPA)
