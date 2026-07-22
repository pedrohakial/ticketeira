import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, formatBRL, formatDate, formatTime } from '../data/store';
import { useReveal } from '../hooks/useReveal';
import './MyTickets.css';

const FALLBACK_GRADIENT = 'linear-gradient(135deg,#8b5cf6,#ec4899)';

const STATUS_LABELS = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
};

const STATUS_ICONS = {
  confirmado: '✓',
  pendente: '⏳',
  cancelado: '✕',
};

// Pedido individual renderizado como ingresso premium (ticket + canhoto).
function TicketCard({ order, index }) {
  const event = order.event;
  const gradient = event?.gradient || FALLBACK_GRADIENT;
  const emoji = event?.emoji || '🎫';
  const title = event?.title || order.eventTitle || 'Evento indisponível';
  const status = STATUS_LABELS[order.status] ? order.status : 'confirmado';

  return (
    <article
      className="mt-ticket fade-up"
      style={{ transitionDelay: `${Math.min(index, 8) * 90}ms`, animationDelay: `${Math.min(index, 8) * 90}ms` }}
    >
      {/* faixa lateral: identidade do evento + rótulo vertical */}
      <div className="mt-ticket-strip" style={{ background: gradient }}>
        <span className="mt-ticket-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="mt-ticket-ribbon" aria-hidden="true">
          TICKETEIRA · ACESSO
        </span>
      </div>

      {/* parte principal */}
      <div className="mt-ticket-main">
        <div className="mt-ticket-head">
          <h3 className="mt-ticket-title">{title}</h3>
          <span className={`mt-ticket-status is-${status}`}>
            <span className="mt-ticket-status-icon" aria-hidden="true">
              {STATUS_ICONS[status] || '•'}
            </span>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {order.status === 'pendente' && (
          <p className="mt-ticket-pending">⏳ Aguardando confirmação do pagamento</p>
        )}

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

      {/* separador serrilhado com furos */}
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
  const headerReveal = useReveal();
  const emptyReveal = useReveal();

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
      <header className="mt-header reveal" ref={headerReveal}>
        <span className="mt-eyebrow">Sua carteira de rolês</span>
        <div className="mt-header-row">
          <h1 className="mt-title">
            Meus <span className="text-gradient">ingressos</span>
          </h1>
          {orders.length > 0 && (
            <span className="mt-count badge">
              {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} · {totalTickets}{' '}
              {totalTickets === 1 ? 'ingresso' : 'ingressos'}
            </span>
          )}
        </div>
        {orders.length > 0 && (
          <p className="mt-subtitle muted">
            Seus acessos garantidos. Apresente o código na entrada e curta o show.
          </p>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="mt-empty reveal" ref={emptyReveal}>
          <div className="mt-empty-glow" aria-hidden="true" />
          <span className="mt-empty-emoji" aria-hidden="true">
            🎫
          </span>
          <h2 className="mt-empty-title">
            Nenhum ingresso <span className="text-gradient">por aqui ainda</span>
          </h2>
          <p className="mt-empty-text muted">
            Quando você comprar um ingresso, ele aparece aqui com o código de acesso. Bora achar um
            rolê?
          </p>
          <Link to="/" className="btn btn-primary btn-lg">
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="mt-list">
          {orders.map((order, i) => (
            <TicketCard key={order.id} order={order} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
