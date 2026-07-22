import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../data/store';
import EventCard from '../components/EventCard';
import { useReveal } from '../hooks/useReveal';
import './Home.css';

const MARQUEE_ITEMS = [
  '🎸 Rock',
  '🎧 Eletrônica',
  '🎤 Sertanejo',
  '🪩 Pop',
  '🥁 Funk',
  '🎷 Jazz',
  '🎹 MPB',
  '🎶 Forró',
  '🔊 Reggae',
  '🎻 Clássica',
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statsRef = useReveal();
  const featuredRef = useReveal();
  const gridRef = useReveal();
  const ctaRef = useReveal();

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

  const stats = useMemo(() => {
    const sold = events.reduce(
      (acc, e) => acc + e.tiers.reduce((a, t) => a + t.sold, 0),
      0,
    );
    return {
      events: events.length,
      sold,
      cities: new Set(events.map((e) => e.city)).size,
    };
  }, [events]);

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
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden="true">
          <span className="home-blob home-blob-1" />
          <span className="home-blob home-blob-2" />
          <span className="home-blob home-blob-3" />
          <span className="home-hero-beams" />
        </div>

        <div className="container home-hero-inner fade-up">
          <span className="badge">🎫 Ingressos sem complicação</span>
          <h1 className="home-hero-title">
            Sinta o show.
            <br />
            <span className="text-gradient home-hero-gradient">Viva a noite.</span>
          </h1>
          <p className="home-hero-sub">
            Descubra shows, festivais e experiências ao vivo perto de você. Compre em
            segundos ou coloque o seu próprio evento no palco.
          </p>

          <div className="home-search glass">
            <span className="home-search-icon" aria-hidden="true">
              🔎
            </span>
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
            <a href="#eventos" className="btn btn-primary btn-lg">
              🎟️ Explorar eventos
            </a>
            <Link to="/criar" className="btn btn-ghost btn-lg">
              🎤 Criar evento
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- marquee ---------- */}
      <div className="home-marquee" aria-hidden="true">
        <div className="home-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="home-marquee-item">
              {item} <span className="home-marquee-dot">•</span>
            </span>
          ))}
        </div>
      </div>

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
          {/* ---------- stats ---------- */}
          <section className="container home-stats reveal" ref={statsRef}>
            <div className="home-stat">
              <span className="home-stat-number text-gradient">{stats.events}</span>
              <span className="home-stat-label">eventos no palco</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-number text-gradient">
                {stats.sold.toLocaleString('pt-BR')}
              </span>
              <span className="home-stat-label">ingressos vendidos</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-number text-gradient">{stats.cities}</span>
              <span className="home-stat-label">cidades vibrando</span>
            </div>
          </section>

          {/* ---------- destaques ---------- */}
          {featured.length > 0 && category === 'Todas' && !search.trim() && (
            <section className="container home-featured reveal" ref={featuredRef}>
              <h2 className="section-title">Em destaque ✨</h2>
              <div className="home-featured-grid">
                {featured.map((event, i) => (
                  <div
                    key={event.id}
                    className={`home-featured-item${i === 0 ? ' home-featured-item-lead' : ''}`}
                  >
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------- grid ---------- */}
          <section className="container home-grid-section reveal" ref={gridRef} id="eventos">
            <h2 className="section-title">
              {category === 'Todas' ? 'Todos os eventos' : category}{' '}
              <span className="home-count">{filtered.length}</span>
            </h2>

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

      {/* ---------- CTA final ---------- */}
      <section className="container home-cta reveal" ref={ctaRef}>
        <div className="home-cta-panel glass">
          <span className="home-cta-emoji" aria-hidden="true">
            🎤
          </span>
          <h2 className="home-cta-title">
            Tem um show? <span className="text-gradient">Venda com a Ticketeira.</span>
          </h2>
          <p className="muted">
            Crie seu evento em minutos, venda ingressos online e receba via Mercado Pago.
            Sem burocracia, só palco.
          </p>
          <Link to="/criar" className="btn btn-primary btn-lg">
            🚀 Criar meu evento
          </Link>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="home-footer">
        <div className="container home-footer-inner">
          <div className="home-footer-brand">
            <span className="home-footer-logo">
              🎫 <strong>Ticketeira</strong>
            </span>
            <span className="muted">Feito para quem vive de música ao vivo.</span>
          </div>
          <nav className="home-footer-links" aria-label="Links do rodapé">
            <a href="#eventos">Explorar eventos</a>
            <Link to="/criar">Criar evento</Link>
            <Link to="/meus-ingressos">Meus ingressos</Link>
          </nav>
          <span className="home-footer-tech muted">
            Feito com React + Supabase + Mercado Pago
          </span>
        </div>
      </footer>
    </div>
  );
}
