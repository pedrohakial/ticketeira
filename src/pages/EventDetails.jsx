import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EventCover } from '../components/EventCard';
import { formatBRL, formatDate, formatTime, getEvent } from '../data/store';
import './EventDetails.css';

const MAX_QTY = 10;

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = getEvent(id);

  const availableTiers = useMemo(
    () => (event ? event.tiers.filter((t) => t.sold < t.total) : []),
    [event],
  );

  const [tierId, setTierId] = useState(() => availableTiers[0]?.id || null);
  const [quantity, setQuantity] = useState(1);

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

  function handleBuy() {
    if (!selectedTier) return;
    navigate(`/checkout/${event.id}?tier=${selectedTier.id}&qty=${qty}`);
  }

  return (
    <div className="ed-page fade-up">
      {/* Hero */}
      <div className="ed-hero">
        <EventCover event={event} className="ed-hero-cover" />
        <div className="container ed-hero-content">
          <span className="badge">{event.category}</span>
          <h1 className="ed-title">{event.title}</h1>
          {event.rating && (
            <p className="ed-rating">
              ★ {event.rating.toFixed(1)}{' '}
              <span className="muted">({event.reviews} avaliações)</span>
            </p>
          )}
        </div>
      </div>

      <div className="container ed-grid">
        {/* Coluna esquerda: informações */}
        <div className="ed-info">
          <h2 className="ed-section-heading">Sobre o evento</h2>
          <p className="ed-description">{event.description}</p>

          <ul className="ed-facts card">
            <li className="ed-fact">
              <span className="ed-fact-icon">📅</span>
              <div>
                <strong>Data</strong>
                <span className="muted">
                  {formatDate(event.date)} · {formatTime(event.date)}
                </span>
              </div>
            </li>
            <li className="ed-fact">
              <span className="ed-fact-icon">📍</span>
              <div>
                <strong>Local</strong>
                <span className="muted">{event.venue}</span>
              </div>
            </li>
            <li className="ed-fact">
              <span className="ed-fact-icon">🏙️</span>
              <div>
                <strong>Cidade</strong>
                <span className="muted">{event.city}</span>
              </div>
            </li>
            <li className="ed-fact">
              <span className="ed-fact-icon">🎤</span>
              <div>
                <strong>Organizador</strong>
                <span className="muted">{event.organizer}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Coluna direita: ingressos */}
        <aside className="card ed-tickets">
          <h2 className="ed-section-heading">Ingressos</h2>

          <div className="ed-tiers">
            {event.tiers.map((tier) => {
              const remaining = tier.total - tier.sold;
              const soldOut = remaining <= 0;
              const pctSold = Math.min(100, Math.round((tier.sold / tier.total) * 100));
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
                      <span className="ed-tier-price">{formatBRL(tier.price)}</span>
                    </span>
                    {soldOut ? (
                      <span className="ed-tier-soldout-tag">Esgotado</span>
                    ) : (
                      <span className="ed-tier-remaining muted">
                        {remaining} disponíve{remaining === 1 ? 'l' : 'is'}
                      </span>
                    )}
                  </button>

                  <div className="ed-tier-bar" aria-hidden="true">
                    <span style={{ width: `${pctSold}%` }} />
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
                        <span className="ed-qty-value">{qty}</span>
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
                </div>
              );
            })}
          </div>

          <div className="ed-summary">
            <div className="ed-summary-row">
              <span className="muted">Subtotal</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleBuy}
              disabled={!selectedTier}
            >
              Comprar ingressos 🎟️
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
