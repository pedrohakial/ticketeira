// POST /api/create-preference { orderId }
// Cria uma preferência de pagamento no Mercado Pago para um pedido pendente
// e devolve a URL de checkout (init_point) para redirecionar o comprador.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  if (!MP_TOKEN || MP_TOKEN.startsWith('COLE_')) {
    return res.status(503).json({ error: 'Mercado Pago não configurado (MP_ACCESS_TOKEN ausente)' });
  }

  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório' });

    const rows = await sb(`/orders?id=eq.${encodeURIComponent(orderId)}&select=*`);
    const order = rows?.[0];
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.status !== 'pendente') return res.status(409).json({ error: 'Pedido já processado' });

    const events = await sb(`/events?id=eq.${encodeURIComponent(order.event_id)}&select=title`);
    const title = events?.[0]?.title || 'Ingresso';

    const preference = {
      items: [
        {
          id: order.tier_id,
          title: `${title} — ingresso`,
          quantity: order.quantity,
          unit_price: Number(order.unit_price),
          currency_id: 'BRL',
        },
        {
          id: 'taxa-servico',
          title: 'Taxa de serviço Ticketeira',
          quantity: 1,
          unit_price: Number(order.fee),
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: order.buyer_name,
        email: order.buyer_email,
      },
      external_reference: order.id,
      back_urls: {
        success: `${PUBLIC_URL}/confirmacao/${order.id}`,
        failure: `${PUBLIC_URL}/confirmacao/${order.id}?status=falhou`,
        pending: `${PUBLIC_URL}/confirmacao/${order.id}?status=pendente`,
      },
      auto_return: 'approved',
      notification_url: `${PUBLIC_URL}/api/mp-webhook`,
      statement_descriptor: 'TICKETEIRA',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      return res.status(502).json({ error: 'Erro no Mercado Pago', details: mpData });
    }

    await sb(`/orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ mp_preference_id: mpData.id }),
    });

    return res.status(200).json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
