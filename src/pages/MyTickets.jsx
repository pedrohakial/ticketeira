import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, formatBRL, formatDate, formatTime } from '../data/store';
import './MyTickets.css';

const FALLBACK_GRADIENT = 'linear-gradient(135deg,#8b5cf6,#ec4899)';

const STATUS_LABELS = {
  confirmado: 'Confirmado',
  pendente: 'Pagamento pendente',
  cancelado: 'Cancelado',
};

// Pedido individual renderizado como ingresso grande (ticket + canhoto).
function TicketCard({ order }) {
  const event = order.event;
  const gradient = event?.gradient || FALLBACK_GRADIENT;
  const emoji = event?.emoji || '🎫';
  const title = event?.title || order.eventTitle || 'Evento indisponível';

  return (
    <article className="mt-ticket fade-up">
      {/* faixa de gradiente lateral (identidade do evento) */}
      <div className="mt-ticket-strip" style={{ background: gradient }}>
        <span className="mt-ticket-emoji">{emoji}</span>
      </div>

      {/* parte principal */}
      <div className="mt-ticket-main">
        <div className="mt-ticket-head">
          <h3 className="mt-ticket-title">{title}</h3>
          <span className="mt-ticket-status">{STATUS_LABELS[order.status] || order.status}</span>
        </div>

        <p className="mt-ticket-meta">
          📅 {event ? `${formatDate(event.date)} · ${formatTime(event.date)}` : 'Data a confirmar'}
        </p>
        {event && (
          <p className="mt-ticket-meta">
            📍 {event.venue} — {event.city}
          </p>
        )}

        <div className="mt-ticket-info">
          <div className="mt-ticket-field">
            <span className="mt-ticket-label">Tipo</span>
            <span className="mt-ticket-value">{order.tierName}</span>
          </div>
          <div className="mt-ticket-field">
            <span className="mt-ticket-label">Quantidade</span>
            <span className="mt-ticket-value">{order.quantity}×</span>
          </div>
          <div className="mt-ticket-field">
            <span className="mt-ticket-label">Pedido</span>
            <span className="mt-ticket-value mt-mono">{order.id}</span>
          </div>
        </div>
      </div>

      {/* separador serrilhado */}
      <div className="mt-ticket-divider" aria-hidden="true">
        <span className="mt-notch mt-notch-top" />
        <span className="mt-notch mt-notch-bottom" />
      </div>

      {/* canhoto com códigos e total */}
      <div className="mt-ticket-stub">
        <span className="mt-ticket-label">Códigos dos ingressos</span>
        {order.tickets.length > 0 ? (
          <ul className="mt-ticket-codes">
            {order.tickets.map((t) => (
              <li key={t.code} className="mt-mono">
                {t.code}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-ticket-meta muted">Os códigos aparecem após a confirmação do pagamento.</p>
        )}
        <div className="mt-ticket-total">
          <span>Total pago</span>
          <strong>{formatBRL(order.total)}</strong>
        </div>
      </div>
    </article>
  );
}

export default function MyTickets() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyOrders()
      .then((data) => active && setOrders(data))
      .catch((err) => active && setError(err.message || 'Não foi possível carregar seus pedidos.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="container page-state">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Carregando seus ingressos…</p>
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

  const totalTickets = orders.reduce((acc, o) => acc + o.tickets.length, 0);

  return (
    <div className="container mt-page">
      <header className="mt-header">
        <h1 className="section-title">Meus ingressos</h1>
        {orders.length > 0 && (
          <p className="muted">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} · {totalTickets}{' '}
            {totalTickets === 1 ? 'ingresso' : 'ingressos'}
          </p>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="mt-empty card fade-up">
          <span className="mt-empty-emoji">🎫</span>
          <h2 className="mt-empty-title">Nenhum ingresso por aqui ainda</h2>
          <p className="muted">
            Quando você comprar um ingresso, ele aparece aqui com o código de acesso. Bora achar um
            rolê?
          </p>
          <Link to="/" className="btn btn-primary btn-lg">
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="mt-list">
          {orders.map((order) => (
            <TicketCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
