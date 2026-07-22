import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EventCard, { EventCover } from '../components/EventCard';
import { formatBRL, formatDate, formatTime, getEvent, getEvents } from '../data/store';
import { useReveal } from '../hooks/useReveal';
import './EventDetails.css';

const MAX_QTY = 10;

function pad(value) {
  return String(value).padStart(2, '0');
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tierId, setTierId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  const infoReveal = useReveal();
  const ticketsReveal = useReveal();
  const relatedReveal = useReveal();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getEvent(id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
        // pré-seleciona o primeiro lote disponível
        const firstAvailable = data?.tiers.find((t) => t.sold < t.total);
        setTierId(firstAvailable?.id || null);
      })
      .catch((err) => active && setError(err.message || 'Não foi possível carregar o evento.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  // contagem regressiva ao vivo até a data do evento
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // "Você pode gostar": outros eventos da mesma categoria
  useEffect(() => {
    if (!event) return undefined;
    let active = true;
    getEvents()
      .then((all) => {
        if (!active) return;
        setRelated(
          all.filter((e) => e.id !== event.id && e.category === event.category).slice(0, 3)
        );
      })
      .catch(() => active && setRelated([]));
    return () => {
      active = false;
    };
  }, [event]);

  if (loading) {
    return (
      <div className="container page-state">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Carregando evento…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page-state">
        <p className="page-state-error" role="alert">
          ⚠️ {error}
        </p>
        <Link to="/" className="btn btn-ghost">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container ed-not-found fade-up">
        <span className="ed-not-found-emoji">🎫</span>
        <h1 className="section-title">Evento não encontrado</h1>
        <p className="muted">O evento que você procura não existe ou foi removido.</p>
        <Link to="/" className="btn btn-primary">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const selectedTier = event.tiers.find((t) => t.id === tierId) || null;
  const maxQty = selectedTier ? Math.min(MAX_QTY, selectedTier.total - selectedTier.sold) : 1;
  const qty = Math.min(quantity, maxQty);
  const subtotal = selectedTier ? selectedTier.price * qty : 0;

  const diffMs = new Date(event.date).getTime() - now;
  const started = diffMs <= 0;
  const cdTotalSec = Math.max(0, Math.floor(diffMs / 1000));
  const cdDays = Math.floor(cdTotalSec / 86400);
  const cdHours = Math.floor((cdTotalSec % 86400) / 3600);
  const cdMinutes = Math.floor((cdTotalSec % 3600) / 60);
  const cdSeconds = cdTotalSec % 60;

  function handleBuy() {
    if (!selectedTier) return;
    navigate(`/checkout/${event.id}?tier=${encodeURIComponent(selectedTier.id)}&qty=${qty}`);
  }

  return (
    <div className="ed-page">
      {/* ---------- hero imersivo ---------- */}
      <section className="ed-hero">
        <div
          className="ed-hero-bg"
          style={{ background: event.gradient }}
          aria-hidden="true"
        />
        <div className="ed-hero-vignette" aria-hidden="true" />

        <div className="container ed-hero-inner">
          <Link to="/" className="ed-back">
            ← Todos os eventos
          </Link>

          <div className="ed-hero-body fade-up">
            <EventCover event={event} className="ed-hero-cover" />

            <div className="ed-hero-text">
              <div className="ed-hero-topline">
                <span className="badge">{event.category}</span>
                {event.rating && (
                  <span className="ed-rating glass">
                    ★ {event.rating.toFixed(1)}{' '}
                    <span className="muted">({event.reviews} avaliações)</span>
                  </span>
                )}
              </div>

              <h1 className="ed-title">{event.title}</h1>

              {started ? (
                <p className="ed-live glass">🔥 Acontecendo agora ou já encerrado</p>
              ) : (
                <div className="ed-countdown" role="timer" aria-label="Contagem regressiva para o evento">
                  <span className="ed-countdown-label">⏳ Faltam</span>
                  <div className="ed-countdown-units">
                    <span className="ed-countdown-unit glass">
                      <strong>{pad(cdDays)}</strong>
                      <small>dias</small>
                    </span>
                    <span className="ed-countdown-sep" aria-hidden="true">:</span>
                    <span className="ed-countdown-unit glass">
                      <strong>{pad(cdHours)}</strong>
                      <small>horas</small>
                    </span>
                    <span className="ed-countdown-sep" aria-hidden="true">:</span>
                    <span className="ed-countdown-unit glass">
                      <strong>{pad(cdMinutes)}</strong>
                      <small>min</small>
                    </span>
                    <span className="ed-countdown-sep" aria-hidden="true">:</span>
                    <span className="ed-countdown-unit glass">
                      <strong>{pad(cdSeconds)}</strong>
                      <small>seg</small>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* faixa de meta-info em pills glass */}
          <ul className="ed-meta fade-up">
            <li className="ed-meta-pill glass">
              <span className="ed-meta-icon" aria-hidden="true">📅</span>
              <span className="ed-meta-text">
                <small>Data</small>
                <strong>{formatDate(event.date)}</strong>
              </span>
            </li>
            <li className="ed-meta-pill glass">
              <span className="ed-meta-icon" aria-hidden="true">⏰</span>
              <span className="ed-meta-text">
                <small>Hora</small>
                <strong>{formatTime(event.date)}</strong>
              </span>
            </li>
            <li className="ed-meta-pill glass">
              <span className="ed-meta-icon" aria-hidden="true">📍</span>
              <span className="ed-meta-text">
                <small>Local</small>
                <strong>{event.venue}</strong>
              </span>
            </li>
            <li className="ed-meta-pill glass">
              <span className="ed-meta-icon" aria-hidden="true">🏙️</span>
              <span className="ed-meta-text">
                <small>Cidade</small>
                <strong>{event.city}</strong>
              </span>
            </li>
            <li className="ed-meta-pill glass">
              <span className="ed-meta-icon" aria-hidden="true">🎤</span>
              <span className="ed-meta-text">
                <small>Organizador</small>
                <strong>{event.organizer}</strong>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <div className="container ed-grid">
        {/* Coluna esquerda: informações */}
        <div className="ed-info reveal" ref={infoReveal}>
          <h2 className="ed-section-heading">
            <span className="text-gradient">Sobre o evento</span>
          </h2>
          <p className="ed-description">{event.description}</p>
        </div>

        {/* Coluna direita: ingressos */}
        <aside className="card ed-tickets reveal" ref={ticketsReveal}>
          <h2 className="ed-section-heading">
            <span className="text-gradient">Ingressos</span>
          </h2>

          <div className="ed-tiers">
            {event.tiers.map((tier) => {
              const remaining = tier.total - tier.sold;
              const soldOut = remaining <= 0;
              const pctRemaining = Math.max(0, Math.round((remaining / tier.total) * 100));
              const almostGone = !soldOut && remaining / tier.total < 0.15;
              const isSelected = tier.id === tierId;
              const tierMax = Math.min(MAX_QTY, remaining);

              return (
                <div
                  key={tier.id}
                  className={`ed-tier${isSelected ? ' ed-tier-selected' : ''}${
                    soldOut ? ' ed-tier-soldout' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="ed-tier-main"
                    onClick={() => !soldOut && setTierId(tier.id)}
                    disabled={soldOut}
                    aria-pressed={isSelected}
                  >
                    <span className="ed-tier-radio" aria-hidden="true" />
                    <span className="ed-tier-info">
                      <span className="ed-tier-name">{tier.name}</span>
                      {almostGone ? (
                        <span className="ed-tier-hot">🔥 POUCOS! Restam {remaining}</span>
                      ) : (
                        !soldOut && (
                          <span className="ed-tier-remaining muted">
                            {remaining} disponíve{remaining === 1 ? 'l' : 'is'}
                          </span>
                        )
                      )}
                    </span>
                    <span className="ed-tier-price">{formatBRL(tier.price)}</span>
                  </button>

                  <div
                    className="ed-tier-bar"
                    role="progressbar"
                    aria-valuenow={pctRemaining}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Disponibilidade de ${tier.name}`}
                  >
                    <span style={{ width: `${pctRemaining}%` }} />
                  </div>

                  {isSelected && !soldOut && (
                    <div className="ed-qty">
                      <span className="muted">Quantidade</span>
                      <div className="ed-qty-controls">
                        <button
                          type="button"
                          className="ed-qty-btn"
                          onClick={() => setQuantity(Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          aria-label="Diminuir quantidade"
                        >
                          −
                        </button>
                        <span className="ed-qty-value" key={qty}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          className="ed-qty-btn"
                          onClick={() => setQuantity(Math.min(tierMax, qty + 1))}
                          disabled={qty >= tierMax}
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {soldOut && (
                    <span className="ed-tier-soldout-tag" aria-hidden="true">
                      Esgotado
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ed-summary">
            <div className="ed-summary-row">
              <span className="muted">Subtotal</span>
              <strong className="ed-subtotal-value" key={subtotal}>
                {formatBRL(subtotal)}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg ed-buy-btn"
              onClick={handleBuy}
              disabled={!selectedTier}
            >
              Garantir meu lugar 🎟️
            </button>
            <p className="ed-summary-note muted">
              Compra segura · ingresso nominal com QR code
            </p>
          </div>
        </aside>
      </div>

      {/* ---------- você pode gostar ---------- */}
      {related.length > 0 && (
        <section className="container ed-related reveal" ref={relatedReveal}>
          <h2 className="ed-section-heading">
            <span className="text-gradient">Você pode gostar</span>
          </h2>
          <div className="ed-related-grid">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
