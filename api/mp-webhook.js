// POST /api/mp-webhook
// Recebe notificações do Mercado Pago. Quando o pagamento é aprovado,
// confirma o pedido no Supabase (baixa estoque + emite tickets).

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

async function sbRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`RPC ${fn} ${res.status}: ${await res.text()}`);
  return res.json();
}

export default async function handler(req, res) {
  // MP espera 200 rápido mesmo em tentativas inválidas
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const { type, data } = req.body || {};
    const topic = type || req.query?.topic || req.query?.type;
    const paymentId = data?.id || req.query?.id || req.query?.['data.id'];

    if (topic !== 'payment' || !paymentId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    if (!mpRes.ok) return res.status(200).json({ ok: true, mpError: mpRes.status });
    const payment = await mpRes.json();

    const orderId = payment.external_reference;
    if (!orderId) return res.status(200).json({ ok: true, noReference: true });

    if (payment.status === 'approved') {
      await sbRpc('confirm_order', {
        p_order_id: orderId,
        p_mp_payment_id: String(payment.id),
      });
    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
      await sbRpc('cancel_order', { p_order_id: orderId });
    }

    return res.status(200).json({ ok: true, status: payment.status });
  } catch (err) {
    // 200 para o MP não re-tentar em loop; o erro fica no log da Vercel
    return res.status(200).json({ ok: false, error: err.message });
  }
}
