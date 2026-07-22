import { Link } from 'react-router-dom';
import { getOrganizerStats, formatBRL, formatDate } from '../data/store';
import { EventCover } from '../components/EventCard';
import './Dashboard.css';

// Cor da barra de progresso conforme a lotação do evento.
function occupancyClass(pct) {
  if (pct >= 85) return 'dash-bar-fill--high';
  if (pct >= 60) return 'dash-bar-fill--mid';
  return 'dash-bar-fill--low';
}

export default function Dashboard() {
  const stats = getOrganizerStats();

  const totalEvents = stats.length;
  const totalSold = stats.reduce((acc, s) => acc + s.sold, 0);
  const totalRevenue = stats.reduce((acc, s) => acc + s.revenue, 0);
  const totalCapacity = stats.reduce((acc, s) => acc + s.capacity, 0);
  const occupancy = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <main className="dash-page">
      <div className="container">
        <header className="dash-header fade-up">
          <div>
            <h1 className="section-title">Painel do organizador</h1>
            <p className="muted">Acompanhe vendas e ocupação dos seus eventos.</p>
          </div>
          <Link to="/criar" className="btn btn-primary">
            ➕ Criar evento
          </Link>
        </header>

        {totalEvents === 0 ? (
          <section className="dash-empty card fade-up">
            <span className="dash-empty-emoji">🎫</span>
            <h2>Nenhum evento por aqui ainda</h2>
            <p className="muted">
              Crie seu primeiro evento e comece a vender ingressos em minutos.
            </p>
            <Link to="/criar" className="btn btn-primary btn-lg">
              🚀 Criar meu primeiro evento
            </Link>
          </section>
        ) : (
          <>
            <section className="dash-metrics fade-up" aria-label="Métricas gerais">
              <div className="dash-metric card">
                <span className="dash-metric-icon">🎪</span>
                <div>
                  <strong className="dash-metric-value">{totalEvents}</strong>
                  <span className="dash-metric-label">
                    {totalEvents === 1 ? 'evento ativo' : 'eventos ativos'}
                  </span>
                </div>
              </div>
              <div className="dash-metric card">
                <span className="dash-metric-icon">🎟️</span>
                <div>
                  <strong className="dash-metric-value">{totalSold.toLocaleString('pt-BR')}</strong>
                  <span className="dash-metric-label">ingressos vendidos</span>
                </div>
              </div>
              <div className="dash-metric card">
                <span className="dash-metric-icon">💰</span>
                <div>
                  <strong className="dash-metric-value text-gradient">
                    {formatBRL(totalRevenue)}
                  </strong>
                  <span className="dash-metric-label">receita estimada</span>
                </div>
              </div>
              <div className="dash-metric card">
                <span className="dash-metric-icon">📊</span>
                <div>
                  <strong className="dash-metric-value">{occupancy}%</strong>
                  <span className="dash-metric-label">ocupação média</span>
                </div>
              </div>
            </section>

            <section className="dash-events fade-up" aria-label="Seus eventos">
              <div className="dash-table-head" aria-hidden="true">
                <span>Evento</span>
                <span>Data</span>
                <span>Vendas</span>
                <span>Receita</span>
                <span />
              </div>

              {stats.map(({ event, sold, capacity, revenue }) => {
                const pct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
                return (
                  <article key={event.id} className="dash-row card">
                    <div className="dash-cell dash-cell-event">
                      <EventCover event={event} className="dash-cover" />
                      <div className="dash-event-info">
                        <h3 className="dash-event-title">{event.title}</h3>
                        <span className="dash-event-meta">
                          {event.category} · {event.city}
                        </span>
                      </div>
                    </div>

                    <div className="dash-cell dash-cell-date">
                      <span className="dash-cell-label">Data</span>
                      <span>📅 {formatDate(event.date)}</span>
                    </div>

                    <div className="dash-cell dash-cell-sales">
                      <span className="dash-cell-label">Vendas</span>
                      <span className="dash-sales-count">
                        {sold.toLocaleString('pt-BR')}/{capacity.toLocaleString('pt-BR')}
                        <em className="dash-sales-pct">{pct}%</em>
                      </span>
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
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="dash-cell dash-cell-revenue">
                      <span className="dash-cell-label">Receita</span>
                      <strong>{formatBRL(revenue)}</strong>
                    </div>

                    <div className="dash-cell dash-cell-action">
                      <Link to={`/evento/${event.id}`} className="btn btn-ghost dash-view-link">
                        Ver página →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
