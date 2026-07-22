import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../data/store';
import EventCard from '../components/EventCard';
import './Home.css';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getEvents()
      .then((data) => active && setEvents(data))
      .catch((err) => active && setError(err.message || 'Não foi possível carregar os eventos.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ['Todas', ...new Set(events.map((e) => e.category))],
    [events],
  );

  const featured = useMemo(() => events.filter((e) => e.featured), [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchesCategory = category === 'Todas' || e.category === category;
      const matchesSearch =
        !term ||
        e.title.toLowerCase().includes(term) ||
        e.city.toLowerCase().includes(term) ||
        e.venue.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [events, search, category]);

  return (
    <div className="home">
      {/* ---------- hero ---------- */}
      <section className="home-hero fade-up">
        <div className="container home-hero-inner">
          <span className="badge">🎫 Ingressos sem complicação</span>
          <h1 className="home-hero-title">
            Seu próximo show <span className="text-gradient">começa aqui</span>
          </h1>
          <p className="home-hero-sub">
            Descubra shows, festivais e experiências ao vivo perto de você. Compre em
            segundos ou crie o seu próprio evento.
          </p>

          <div className="home-search">
            <span className="home-search-icon">🔎</span>
            <input
              type="search"
              className="home-search-input"
              placeholder="Busque por evento, cidade ou local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar eventos"
            />
          </div>

          <div className="home-hero-actions">
            <Link to="/criar" className="btn btn-primary btn-lg">
              🎤 Criar evento
            </Link>
            <a href="#eventos" className="btn btn-ghost btn-lg">
              Explorar eventos
            </a>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container page-state">
          <span className="spinner" aria-hidden="true" />
          <p className="muted">Carregando eventos…</p>
        </div>
      ) : error ? (
        <div className="container page-state">
          <span className="home-empty-emoji" aria-hidden="true">
            😵
          </span>
          <p className="page-state-error" role="alert">
            ⚠️ {error}
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* ---------- filtros ---------- */}
      <section className="container fade-up" id="eventos">
        <div className="home-pills" role="group" aria-label="Filtrar por categoria">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`home-pill${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ---------- destaques ---------- */}
      {featured.length > 0 && category === 'Todas' && !search.trim() && (
        <section className="container home-featured fade-up">
          <h2 className="section-title">Em destaque ✨</h2>
          <div className="home-featured-row">
            {featured.map((event) => (
              <div key={event.id} className="home-featured-item">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- grid ---------- */}
      <section className="container home-grid-section fade-up">
        <h2 className="section-title">
          {category === 'Todas' ? 'Todos os eventos' : category}{' '}
          <span className="home-count">{filtered.length}</span>
        </h2>

        {filtered.length > 0 ? (
          <div className="home-grid">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="home-empty card">
            <span className="home-empty-emoji">🫠</span>
            <h3>Nada por aqui...</h3>
            <p className="muted">
              Não encontramos eventos para essa busca. Tente outro termo ou categoria.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                setCategory('Todas');
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
        </>
      )}

      {/* ---------- footer ---------- */}
      <footer className="home-footer">
        <div className="container home-footer-inner">
          <span className="home-footer-logo">
            🎫 <strong>Ticketeira</strong>
          </span>
          <span className="muted">Feito para quem vive de música ao vivo.</span>
        </div>
      </footer>
    </div>
  );
}
