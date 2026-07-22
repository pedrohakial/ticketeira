import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrganizerStats, formatBRL, formatDate } from '../data/store';
import { useReveal } from '../hooks/useReveal';
import './Dashboard.css';

// Cor da barra de progresso conforme a lotação do evento.
function occupancyClass(pct) {
  if (pct >= 85) return 'dash-bar-fill--high';
  if (pct >= 60) return 'dash-bar-fill--mid';
  return 'dash-bar-fill--low';
}

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Liga as barras depois da montagem para animar o width via transition.
  const [barsOn, setBarsOn] = useState(false);

  const metricsRef = useReveal();
  const chartRef = useReveal();
  const eventsRef = useReveal();

  useEffect(() => {
    let active = true;
    getOrganizerStats()
      .then((data) => active && setStats(data))
      .catch((err) =>
        active && setError(err.message || 'Não foi possível carregar o painel.'),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || stats.length === 0) return undefined;
    const raf = requestAnimationFrame(() => setBarsOn(true));
    return () => cancelAnimationFrame(raf);
  }, [loading, stats.length]);

  if (loading) {
    return (
      <div className="container page-state">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Carregando painel…</p>
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

  const totalEvents = stats.length;
  const totalSold = stats.reduce((acc, s) => acc + s.sold, 0);
  const totalRevenue = stats.reduce((acc, s) => acc + s.revenue, 0);
  const totalCapacity = stats.reduce((acc, s) => acc + s.capacity, 0);
  const occupancy = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const metrics = [
    {
      icon: '🎪',
      value: totalEvents.toLocaleString('pt-BR'),
      label: totalEvents === 1 ? 'evento ativo' : 'eventos ativos',
    },
    {
      icon: '🎟️',
      value: totalSold.toLocaleString('pt-BR'),
      label: 'ingressos vendidos',
    },
    {
      icon: '💰',
      value: formatBRL(totalRevenue),
      label: 'receita estimada',
      highlight: true,
    },
    {
      icon: '📈',
      value: `${occupancy}%`,
      label: 'ocupação média',
    },
  ];

  // Ranking de ocupação para o gráfico de barras (maior primeiro).
  const chartRows = [...stats]
    .map((s) => ({
      id: s.event.id,
      title: s.event.title,
      emoji: s.event.emoji,
      pct: s.capacity > 0 ? Math.round((s.sold / s.capacity) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <main className="dash-page">
      <div className="container">
        <header className="dash-header fade-up">
          <div>
            <p className="dash-kicker">🎛️ Mission control</p>
            <h1 className="dash-title">Painel do organizador</h1>
            <p className="muted">Vendas, ocupação e receita dos seus shows em tempo real.</p>
          </div>
          <Link to="/criar" className="btn btn-primary dash-cta">
            ✨ Criar evento
          </Link>
        </header>

        {totalEvents === 0 ? (
          <section className="dash-empty glass fade-up">
            <span className="dash-empty-emoji" aria-hidden="true">
              🎫
            </span>
            <h2>Nenhum evento por aqui ainda</h2>
            <p className="muted">
              O palco está montado e as luzes acesas — só falta o seu show. Crie o primeiro evento e
              comece a vender ingressos em minutos.
            </p>
            <Link to="/criar" className="btn btn-primary btn-lg">
              🚀 Criar meu primeiro evento
            </Link>
          </section>
        ) : (
          <>
            <section
              ref={metricsRef}
              className="dash-metrics reveal"
              aria-label="Métricas gerais"
            >
              {metrics.map((metric, i) => (
                <div
                  key={metric.label}
                  className="dash-metric glass"
                  style={{ '--dash-stagger': `${i * 90}ms` }}
                >
                  <span className="dash-metric-icon" aria-hidden="true">
                    {metric.icon}
                  </span>
                  <div className="dash-metric-body">
                    <strong
                      className={`dash-metric-value${metric.highlight ? ' text-gradient' : ''}`}
                    >
                      {metric.value}
                    </strong>
                    <span className="dash-metric-label">{metric.label}</span>
                  </div>
                </div>
              ))}
            </section>

            <section
              ref={chartRef}
              className="dash-chart glass reveal"
              aria-label="Ocupação por evento"
            >
              <div className="dash-chart-head">
                <h2 className="dash-chart-title">🔥 Ocupação por evento</h2>
                <span className="dash-chart-hint muted">% da capacidade vendida</span>
              </div>
              <ul className="dash-chart-list">
                {chartRows.map((row, i) => (
                  <li key={row.id} className="dash-chart-row">
                    <span className="dash-chart-name">
                      <span aria-hidden="true">{row.emoji}</span> {row.title}
                    </span>
                    <div
                      className="dash-chart-track"
                      role="img"
                      aria-label={`${row.title}: ${row.pct}% de ocupação`}
                    >
                      <div
                        className={`dash-chart-fill ${occupancyClass(row.pct)}`}
                        style={{
                          width: barsOn ? `${row.pct}%` : '0%',
                          transitionDelay: `${i * 110}ms`,
                        }}
                      />
                    </div>
                    <span className="dash-chart-pct">{row.pct}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              ref={eventsRef}
              className="dash-events reveal"
              aria-label="Seus eventos"
            >
              <h2 className="dash-events-title">🎤 Seus eventos</h2>
              <div className="dash-events-grid">
                {stats.map(({ event, sold, capacity, revenue }) => {
                  const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
                  return (
                    <article key={event.id} className="dash-event glass">
                      <div className="dash-event-top">
                        <span
                          className="dash-event-swatch"
                          style={{ background: event.gradient }}
                          aria-hidden="true"
                        >
                          {event.emoji}
                        </span>
                        <div className="dash-event-info">
                          <h3 className="dash-event-title">{event.title}</h3>
                          <span className="dash-event-meta">
                            {event.category} · {event.city} · 📅 {formatDate(event.date)}
                          </span>
                        </div>
                        <span className={`dash-event-pct ${occupancyClass(pct)}`}>{pct}%</span>
                      </div>

                      <div className="dash-event-sales">
                        <span className="dash-event-count">
                          <strong>{sold.toLocaleString('pt-BR')}</strong>
                          <span className="muted"> / {capacity.toLocaleString('pt-BR')} vendidos</span>
                        </span>
                        <strong className="dash-event-revenue">{formatBRL(revenue)}</strong>
                      </div>

                      <div
                        className="dash-bar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Ocupação de ${event.title}: ${pct}%`}
                      >
                        <div
                          className={`dash-bar-fill ${occupancyClass(pct)}`}
                          style={{ width: barsOn ? `${pct}%` : '0%' }}
                        />
                      </div>

                      <Link to={`/evento/${event.id}`} className="dash-event-link">
                        Ver página <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
