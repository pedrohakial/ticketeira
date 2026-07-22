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

export default function EventCard({ event }) {
  const minPrice = Math.min(...event.tiers.map((t) => t.price));
  const sold = event.tiers.reduce((a, t) => a + t.sold, 0);
  const capacity = event.tiers.reduce((a, t) => a + t.total, 0);
  const almostGone = capacity - sold <= capacity * 0.1;

  return (
    <Link to={`/evento/${event.id}`} className="event-card card">
      <EventCover event={event} />
      <div className="event-card-body">
        <div className="event-card-top">
          <span className="badge">{event.category}</span>
          {almostGone && <span className="event-card-hot">🔥 Últimos</span>}
        </div>
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-meta">
          📅 {formatDate(event.date)} · {formatTime(event.date)}
        </p>
        <p className="event-card-meta">
          📍 {event.venue} — {event.city}
        </p>
        <div className="event-card-footer">
          <span className="event-card-price">
            a partir de <strong>{formatBRL(minPrice)}</strong>
          </span>
          {event.rating && (
            <span className="event-card-rating">★ {event.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
