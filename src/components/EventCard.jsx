import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatBRL, formatDate, formatTime } from '../data/store';
import './EventCard.css';

// Capa do evento: gradiente + emoji, identidade visual sem assets externos.
export function EventCover({ event, className = '' }) {
  return (
    <div className={`event-cover ${className}`} style={{ background: event.gradient }}>
      <span className="event-cover-emoji">{event.emoji}</span>
    </div>
  );
}

const TILT_MAX = 6; // graus

export default function EventCard({ event }) {
  const tiltRef = useRef(null);
  const canTilt = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches
  );

  const minPrice = Math.min(...event.tiers.map((t) => t.price));
  const sold = event.tiers.reduce((a, t) => a + t.sold, 0);
  const capacity = event.tiers.reduce((a, t) => a + t.total, 0);
  const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
  const almostGone = capacity - sold <= capacity * 0.1;

  const date = new Date(event.date);
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000);
  const countdown =
    daysLeft > 1 ? `faltam ${daysLeft} dias` : daysLeft === 1 ? 'é amanhã!' : daysLeft === 0 ? 'é hoje!' : 'encerrado';

  function handleMouseMove(e) {
    const el = tiltRef.current;
    if (!el || !canTilt.current) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * TILT_MAX).toFixed(2)}deg) rotateY(${(px * TILT_MAX).toFixed(2)}deg)`;
  }

  function handleMouseLeave() {
    const el = tiltRef.current;
    if (el) el.style.transform = '';
  }

  return (
    <Link
      to={`/evento/${event.id}`}
      className="event-card card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="event-card-tilt" ref={tiltRef}>
        <div className="event-card-cover-wrap">
          <EventCover event={event} />
          <span className="badge glass event-card-cat">{event.category}</span>
          <div className="event-card-date glass" aria-hidden="true">
            <span className="event-card-date-day">{day}</span>
            <span className="event-card-date-month">{month}</span>
          </div>
        </div>
        <div className="event-card-body">
          <div className="event-card-top">
            <span className="event-card-countdown">⏳ {countdown}</span>
            {almostGone && <span className="event-card-hot">🔥 Últimos</span>}
          </div>
          <h3 className="event-card-title">{event.title}</h3>
          <p className="event-card-meta">
            📅 {formatDate(event.date)} · {formatTime(event.date)}
          </p>
          <p className="event-card-meta">
            📍 {event.venue} — {event.city}
          </p>
          <div className="event-card-occ" role="img" aria-label={`${pct}% dos ingressos vendidos`}>
            <div className="event-card-occ-track">
              <div
                className={`event-card-occ-fill ${pct >= 85 ? 'is-high' : pct >= 60 ? 'is-mid' : 'is-low'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="event-card-occ-label">{pct}% vendido</span>
          </div>
          <div className="event-card-footer">
            <span className="event-card-price">
              a partir de <strong className="text-gradient">{formatBRL(minPrice)}</strong>
            </span>
            {event.rating && (
              <span className="event-card-rating">★ {event.rating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
