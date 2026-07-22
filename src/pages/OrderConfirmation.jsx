import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOrder, formatBRL } from '../data/store';
import './OrderConfirmation.css';

// Rótulos amigáveis para os métodos de pagamento simulados.
const PAYMENT_LABELS = {
  pix: '⚡ Pix',
  credit: '💳 Cartão de crédito',
  debit: '💳 Cartão de débito',
  boleto: '🧾 Boleto bancário',
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = getOrder(orderId);

  // Pedido inexistente (URL inválida ou storage limpo): volta para a home.
  useEffect(() => {
    if (!order) navigate('/', { replace: true });
  }, [order, navigate]);

  if (!order) return null;

  const paymentLabel =
    PAYMENT_LABELS[order.paymentMethod] || `💳 ${order.paymentMethod}`;

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
              <div className="ticket-stub">
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
          <strong>{order.buyer?.email || 'seu e-mail'}</strong> (simulação — nada
          foi enviado de verdade).
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
