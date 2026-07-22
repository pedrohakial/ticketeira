import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getOrder, formatBRL } from '../data/store';
import { useReveal } from '../hooks/useReveal';
import './OrderConfirmation.css';

// Rótulos amigáveis para os métodos de pagamento.
const PAYMENT_LABELS = {
  mercadopago: '💳 Mercado Pago',
  pix: '⚡ Pix',
  credit: '💳 Cartão de crédito',
  debit: '💳 Cartão de débito',
  boleto: '🧾 Boleto bancário',
};

// Mensagens que rodam enquanto o Mercado Pago confirma o pagamento.
const PROCESSING_MESSAGES = [
  'Confirmando pagamento…',
  'Falando com o Mercado Pago…',
  'Quase lá, garantindo seus ingressos…',
  'Preparando a experiência…',
];

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 40000;
const CONFETTI_DURATION_MS = 4200;
const CONFETTI_COUNT = 60;

// Cores do confete alinhadas ao neon roxo/magenta + verde de sucesso.
const CONFETTI_COLORS = ['#8b5cf6', '#d946ef', '#22d3ee', '#f472b6', '#a78bfa', '#34d399'];

// Padrão fixo do QR-code decorativo (5x5): 1 = célula preenchida.
const QR_PATTERN = [
  1, 1, 1, 0, 1,
  1, 0, 1, 1, 0,
  1, 1, 1, 0, 1,
  0, 1, 0, 1, 0,
  1, 0, 1, 1, 1,
];

// Chuva de confetes celebratória (~4s), sem libs.
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: 2.4 + Math.random() * 1.6,
        delay: Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 220,
        round: Math.random() > 0.7,
      })),
    []
  );

  return (
    <div className="confirmation-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--confetti-drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Refs de reveal para os blocos principais (entrada animada no scroll).
  const heroRef = useReveal();
  const summaryRef = useReveal();
  const ticketsRef = useReveal();
  const actionsRef = useReveal();

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

  // Celebração: confetes por ~4s quando o pedido está confirmado.
  useEffect(() => {
    if (order?.status !== 'confirmado') return undefined;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => clearTimeout(timer);
  }, [order?.status]);

  // Mensagens rotativas enquanto o pagamento está sendo processado.
  useEffect(() => {
    if (!order || order.status !== 'pendente' || failedParam) return undefined;
    const timer = setInterval(
      () => setMsgIndex((i) => (i + 1) % PROCESSING_MESSAGES.length),
      2400
    );
    return () => clearInterval(timer);
  }, [order, failedParam]);

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
        <section className="confirmation-hero reveal" ref={heroRef}>
          <div className="confirmation-icon-wrap confirmation-icon-wrap--fail" aria-hidden="true">
            <span className="confirmation-icon confirmation-icon--fail">❌</span>
          </div>
          <h1 className="confirmation-title">
            Pagamento <span className="confirmation-title-gradient confirmation-title-gradient--fail">não aprovado</span>
          </h1>
          <p className="confirmation-order-id">
            Pedido <strong>{order.id}</strong>
          </p>
          <p className="confirmation-sub muted">
            Não se preocupe: nenhum valor foi cobrado. O show continua — tente de novo quando
            quiser. 🎸
          </p>
        </section>
        <div className="confirmation-actions reveal" ref={actionsRef}>
          <Link to={`/evento/${order.eventId}`} className="btn btn-primary btn-lg">
            Tentar novamente
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
        <section className="confirmation-hero reveal" ref={heroRef}>
          <div className="confirmation-processing" aria-hidden="true">
            <span className="confirmation-processing-ring" />
            <span className="confirmation-processing-core">🎫</span>
          </div>
          <h1 className="confirmation-title">
            Processando <span className="confirmation-title-gradient">pagamento…</span>
          </h1>
          <p className="confirmation-order-id">
            Pedido <strong>{order.id}</strong>
          </p>
          <p className="confirmation-processing-msg muted" role="status" key={msgIndex}>
            {PROCESSING_MESSAGES[msgIndex]}
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
      {showConfetti && <Confetti />}

      <section className="confirmation-hero reveal" ref={heroRef}>
        <div className="confirmation-icon-wrap" aria-hidden="true">
          <span className="confirmation-icon">✅</span>
        </div>
        <h1 className="confirmation-title">
          Compra <span className="confirmation-title-gradient">confirmada!</span>
        </h1>
        <p className="confirmation-order-id">
          Pedido <strong>{order.id}</strong>
        </p>
        <p className="confirmation-sub muted">
          Boa! Seus ingressos estão garantidos. Nos vemos na grade! 🎉
        </p>
      </section>

      <section className="confirmation-summary glass reveal" ref={summaryRef}>
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

      <section className="confirmation-tickets reveal" ref={ticketsRef}>
        <h2 className="confirmation-section-title">🎟️ Seus ingressos</h2>
        <div className="confirmation-tickets-grid">
          {order.tickets.map((ticket, i) => (
            <div
              className="ticket"
              key={ticket.code}
              style={{ animationDelay: `${i * 140}ms` }}
            >
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
              <div className="ticket-qr" aria-hidden="true">
                {QR_PATTERN.map((filled, j) => (
                  <span key={j} className={filled ? 'ticket-qr-cell' : 'ticket-qr-cell is-empty'} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="confirmation-email-note muted">
          📧 Enviamos uma cópia dos ingressos para{' '}
          <strong>{order.buyer?.email || 'seu e-mail'}</strong>.
        </p>
      </section>

      <div className="confirmation-actions reveal" ref={actionsRef}>
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
