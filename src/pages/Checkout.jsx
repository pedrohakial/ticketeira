import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate, Link } from 'react-router-dom';
import {
  getEvent,
  createOrder,
  confirmOrderDemo,
  formatBRL,
  formatDate,
  formatTime,
} from '../data/store';
import { EventCover } from '../components/EventCard';
import './Checkout.css';

// Máscara simples de entrada (apenas formatação visual).
function maskCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function Checkout() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tierId = searchParams.get('tier');
  const quantity = Math.max(1, parseInt(searchParams.get('qty'), 10) || 1);

  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [buyer, setBuyer] = useState({ name: '', email: '', cpf: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Pedido pendente criado, aguardando pagamento (modo demonstração).
  const [pendingOrder, setPendingOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    getEvent(eventId)
      .then((data) => active && setEvent(data))
      .catch((err) => active && setLoadError(err.message || 'Não foi possível carregar o evento.'))
      .finally(() => active && setLoadingEvent(false));
    return () => {
      active = false;
    };
  }, [eventId]);

  function updateBuyer(field, value) {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!buyer.name.trim() || !buyer.email.trim() || buyer.cpf.length < 14) {
      setError('Preencha nome, e-mail e CPF completos para continuar.');
      return;
    }

    setLoading(true);
    try {
      // 1) Cria o pedido pendente no Supabase (estoque baixa só na confirmação).
      const order = await createOrder({
        eventId,
        tierId,
        quantity,
        buyer: { name: buyer.name.trim(), email: buyer.email.trim(), cpf: buyer.cpf },
        paymentMethod: 'mercadopago',
      });

      // 2) Tenta criar a preferência de pagamento no Mercado Pago e redirecionar.
      //    Sem MP configurado (503) ou sem as rotas /api (dev local), cai no
      //    modo demonstração abaixo.
      try {
        const res = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        if (res.ok) {
          const pref = await res.json();
          if (pref?.init_point) {
            window.location.href = pref.init_point;
            return;
          }
        }
      } catch {
        // rota /api indisponível (dev local) ou resposta inválida — segue para o demo
      }

      setPendingOrder(order);
    } catch (err) {
      setError(err.message || 'Não foi possível concluir o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoConfirm() {
    if (!pendingOrder) return;
    setConfirming(true);
    setError('');
    try {
      await confirmOrderDemo(pendingOrder.id);
      navigate(`/confirmacao/${pendingOrder.id}`);
    } catch (err) {
      setConfirming(false);
      setError(err.message || 'Não foi possível confirmar o pagamento. Tente novamente.');
    }
  }

  if (loadingEvent) {
    return (
      <div className="container page-state">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Carregando checkout…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container page-state">
        <p className="page-state-error" role="alert">
          ⚠️ {loadError}
        </p>
        <Link to="/" className="btn btn-ghost">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const tier = event?.tiers.find((t) => t.id === tierId);
  if (!event || !tier) {
    return <Navigate to="/" replace />;
  }

  const subtotal = tier.price * quantity;
  const fee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + fee;

  return (
    <main className="checkout container fade-up">
      <header className="checkout-header">
        <span className="badge">🔒 Compra segura</span>
        <h1 className="section-title">
          Finalizar <span className="text-gradient">pagamento</span>
        </h1>
        <p className="muted">Falta pouco para garantir seu lugar no rolê.</p>
      </header>

      <div className="checkout-grid">
        <form className="checkout-form card" onSubmit={handleSubmit}>
          <h2 className="checkout-section-title">👤 Dados do comprador</h2>
          <div className="field">
            <label htmlFor="ck-name">Nome completo</label>
            <input
              id="ck-name"
              type="text"
              placeholder="Como no seu documento"
              value={buyer.name}
              onChange={(e) => updateBuyer('name', e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="ck-email">E-mail</label>
              <input
                id="ck-email"
                type="email"
                placeholder="voce@email.com"
                value={buyer.email}
                onChange={(e) => updateBuyer('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="ck-cpf">CPF</label>
              <input
                id="ck-cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={buyer.cpf}
                onChange={(e) => updateBuyer('cpf', maskCPF(e.target.value))}
              />
            </div>
          </div>

          <h2 className="checkout-section-title">💳 Pagamento</h2>
          <div className="checkout-mp">
            <span className="checkout-mp-logo" aria-hidden="true">
              💳
            </span>
            <div className="checkout-mp-info">
              <strong>Pagamento processado pelo Mercado Pago</strong>
              <p className="muted">
                Pix, cartão de crédito ou boleto — você escolhe na próxima tela, em ambiente
                seguro. Nenhum dado de pagamento passa pelos nossos servidores.
              </p>
            </div>
          </div>

          {error && (
            <p className="checkout-error" role="alert">
              ⚠️ {error}
            </p>
          )}

          {pendingOrder ? (
            <div className="checkout-demo" role="status">
              <p>
                <strong>⚠️ Mercado Pago não configurado — modo demonstração</strong>
              </p>
              <p className="muted">
                Pedido <strong>{pendingOrder.id}</strong> criado. Em produção você seria
                redirecionado ao checkout do Mercado Pago; aqui você pode simular a aprovação do
                pagamento.
              </p>
              <button
                type="button"
                className="btn btn-success btn-block"
                onClick={handleDemoConfirm}
                disabled={confirming}
              >
                {confirming ? '⏳ Confirmando…' : '✅ Simular pagamento aprovado'}
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? '⏳ Criando pedido…' : `Ir para o pagamento · ${formatBRL(total)}`}
            </button>
          )}
          <p className="checkout-secure-note muted">
            🔒 Pagamento com segurança pelo Mercado Pago.
          </p>
        </form>

        <aside className="checkout-summary card">
          <h2 className="checkout-section-title">🎟️ Resumo do pedido</h2>
          <div className="checkout-event">
            <EventCover event={event} className="checkout-cover" />
            <div className="checkout-event-info">
              <h3 className="checkout-event-title">{event.title}</h3>
              <p className="muted">
                📅 {formatDate(event.date)} · {formatTime(event.date)}
              </p>
              <p className="muted">
                📍 {event.venue} — {event.city}
              </p>
            </div>
          </div>

          <div className="checkout-lines">
            <div className="checkout-line">
              <span>
                {tier.name} × {quantity}
              </span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="checkout-line muted">
              <span>Taxa de serviço (10%)</span>
              <span>{formatBRL(fee)}</span>
            </div>
            <div className="checkout-line checkout-total">
              <span>Total</span>
              <span className="text-gradient">{formatBRL(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
