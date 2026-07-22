import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getOrder, formatBRL } from '../data/store';
import './OrderConfirmation.css';

// Rótulos amigáveis para os métodos de pagamento.
const PAYMENT_LABELS = {
  mercadopago: '💳 Mercado Pago',
  pix: '⚡ Pix',
  credit: '💳 Cartão de crédito',
  debit: '💳 Cartão de débito',
  boleto: '🧾 Boleto bancário',
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 40000;

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const failedParam = searchParams.get('status') === 'falhou';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Busca o pedido e, enquanto estiver pendente, refaz a consulta a cada 3s
  // (o webhook do Mercado Pago confirma de forma assíncrona).
  useEffect(() => {
    let active = true;
    let timer = null;
    let elapsed = 0;

    async function fetchOrder() {
      try {
        const data = await getOrder(orderId);
        if (!active) return;
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setOrder(data);
        setLoading(false);

        if (data.status === 'pendente' && !failedParam) {
          elapsed += POLL_INTERVAL_MS;
          if (elapsed >= POLL_TIMEOUT_MS) {
            setTimedOut(true);
            return;
          }
          timer = setTimeout(fetchOrder, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Não foi possível carregar o pedido.');
        setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [orderId, failedParam]);

  // Pedido inexistente (URL inválida): volta para a home.
  useEffect(() => {
    if (notFound) navigate('/', { replace: true });
  }, [notFound, navigate]);

  if (loading) {
    return (
      <div className="container page-state">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Carregando pedido…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page-state">
        <p className="page-state-error" role="alert">
          ⚠️ {error}
        </p>
        <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!order) return null;

  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || `💳 ${order.paymentMethod}`;
  const failed = failedParam || order.status === 'cancelado';

  // ---------- pagamento não aprovado ----------
  if (failed) {
    return (
      <main className="confirmation container">
        <section className="confirmation-hero fade-up">
          <div className="confirmation-icon confirmation-icon--fail" aria-hidden="true">
            ❌
          </div>
          <h1 className="confirmation-title">
            Pagamento <span className="text-gradient">não aprovado</span>
          </h1>
          <p className="confirmation-order-id">
            Pedido <strong>{order.id}</strong>
          </p>
          <p className="confirmation-sub muted">
            Não se preocupe: nenhum valor foi cobrado. Você pode tentar de novo quando quiser.
          </p>
        </section>
        <div className="confirmation-actions fade-up">
          <Link to={`/evento/${order.eventId}`} className="btn btn-primary btn-lg">
            Voltar ao evento
          </Link>
          <Link to="/" className="btn btn-ghost btn-lg">
            Explorar eventos
          </Link>
        </div>
      </main>
    );
  }

  // ---------- aguardando confirmação do Mercado Pago ----------
  if (order.status === 'pendente') {
    return (
      <main className="confirmation container">
        <section className="confirmation-hero fade-up">
          <span className="spinner confirmation-spinner" aria-hidden="true" />
          <h1 className="confirmation-title">
            Processando <span className="text-gradient">pagamento…</span>
          </h1>
          <p className="confirmation-order-id">
            Pedido <strong>{order.id}</strong>
          </p>
          <p className="confirmation-sub muted">
            Assim que o Mercado Pago confirmar, seus ingressos aparecem aqui automaticamente.
          </p>
          {timedOut && (
            <div className="confirmation-warning" role="status">
              <p>
                ⏳ Ainda não recebemos a confirmação. Verifique seu e-mail ou atualize a página
                em alguns instantes.
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => window.location.reload()}
              >
                Atualizar página
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  // ---------- compra confirmada ----------
  return (
    <main className="confirmation container">
      <section className="confirmation-hero fade-up">
        <div className="confirmation-icon" aria-hidden="true">
          ✅
        </div>
        <h1 className="confirmation-title">
          Compra <span className="text-gradient">confirmada!</span>
        </h1>
        <p className="confirmation-order-id">
          Pedido <strong>{order.id}</strong>
        </p>
        <p className="confirmation-sub muted">
          Boa! Seus ingressos estão garantidos. 🎉
        </p>
      </section>

      <section className="confirmation-summary card fade-up">
        <h2 className="confirmation-section-title">Resumo do pedido</h2>
        <dl className="confirmation-details">
          <div className="confirmation-row">
            <dt>Evento</dt>
            <dd>{order.eventTitle}</dd>
          </div>
          <div className="confirmation-row">
            <dt>Ingresso</dt>
            <dd>{order.tierName}</dd>
          </div>
          <div className="confirmation-row">
            <dt>Quantidade</dt>
            <dd>
              {order.quantity} {order.quantity === 1 ? 'ingresso' : 'ingressos'}
            </dd>
          </div>
          <div className="confirmation-row">
            <dt>Pagamento</dt>
            <dd>{paymentLabel}</dd>
          </div>
          <div className="confirmation-row">
            <dt>E-mail</dt>
            <dd>{order.buyer?.email || '—'}</dd>
          </div>
          <div className="confirmation-row confirmation-row-total">
            <dt>Total pago</dt>
            <dd>{formatBRL(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="confirmation-tickets fade-up">
        <h2 className="confirmation-section-title">🎟️ Seus ingressos</h2>
        <div className="confirmation-tickets-grid">
          {order.tickets.map((ticket, i) => (
            <div className="ticket" key={ticket.code}>
              <div
                className="ticket-stub"
                style={order.event ? { background: order.event.gradient } : undefined}
              >
                <span className="ticket-stub-label">Ticketeira</span>
                <span className="ticket-stub-num">
                  {String(i + 1).padStart(2, '0')}/{String(order.tickets.length).padStart(2, '0')}
                </span>
              </div>
              <div className="ticket-body">
                <span className="ticket-event">{order.eventTitle}</span>
                <span className="ticket-tier">{order.tierName}</span>
                <span className="ticket-code">{ticket.code}</span>
                <span className="ticket-hint">Apresente este código na entrada</span>
              </div>
            </div>
          ))}
        </div>
        <p className="confirmation-email-note muted">
          📧 Enviamos uma cópia dos ingressos para{' '}
          <strong>{order.buyer?.email || 'seu e-mail'}</strong>.
        </p>
      </section>

      <div className="confirmation-actions fade-up">
        <Link to="/meus-ingressos" className="btn btn-primary btn-lg">
          Ver meus ingressos
        </Link>
        <Link to="/" className="btn btn-ghost btn-lg">
          Explorar mais eventos
        </Link>
      </div>
    </main>
  );
}
