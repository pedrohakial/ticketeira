import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CATEGORIES,
  GRADIENTS,
  createEvent,
  formatBRL,
  formatDate,
  formatTime,
} from '../data/store';
import { EventCover } from '../components/EventCard';
import './CreateEvent.css';

const EMOJI_OPTIONS = ['🎤', '🎸', '🎧', '🎷', '🎭', '🎪', '🎬', '🎮', '🌙', '⚡'];

const initialForm = {
  title: '',
  category: CATEGORIES[0],
  emoji: EMOJI_OPTIONS[0],
  date: '',
  venue: '',
  city: '',
  organizer: '',
  description: '',
  gradient: GRADIENTS[0],
};

const emptyTier = () => ({ name: '', price: '', total: '' });

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [tiers, setTiers] = useState([emptyTier()]);
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateTier(index, field, value) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    setErrors((prev) => ({ ...prev, tiers: undefined }));
  }

  function addTier() {
    setTiers((prev) => [...prev, emptyTier()]);
  }

  function removeTier(index) {
    setTiers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Dê um título ao seu evento.';
    if (!form.date) next.date = 'Escolha data e horário.';
    if (!form.venue.trim()) next.venue = 'Informe o local do evento.';
    if (!form.city.trim()) next.city = 'Informe a cidade.';
    if (!form.organizer.trim()) next.organizer = 'Quem está organizando?';
    if (!form.description.trim()) next.description = 'Conte um pouco sobre o evento.';

    const tierProblem = tiers.some(
      (t) => !t.name.trim() || !(Number(t.price) > 0) || !(Number(t.total) > 0),
    );
    if (tierProblem) next.tiers = 'Cada lote precisa de nome, preço e quantidade maiores que zero.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const novoEvento = createEvent({
      emoji: form.emoji,
      gradient: form.gradient,
      title: form.title.trim(),
      category: form.category,
      date: form.date,
      venue: form.venue.trim(),
      city: form.city.trim(),
      organizer: form.organizer.trim(),
      description: form.description.trim(),
      tiers: tiers.map((t) => ({
        name: t.name.trim(),
        price: Number(t.price),
        total: Number(t.total),
      })),
    });

    navigate(`/evento/${novoEvento.id}`);
  }

  // Evento provisório só para o preview ao vivo.
  const previewEvent = useMemo(() => {
    const parsedTiers = tiers
      .filter((t) => Number(t.price) > 0)
      .map((t, i) => ({
        id: `tier-${i}`,
        name: t.name || 'Lote',
        price: Number(t.price),
        total: Number(t.total) || 0,
        sold: 0,
      }));
    return {
      id: 'preview',
      title: form.title.trim() || 'Seu evento incrível',
      category: form.category,
      emoji: form.emoji,
      gradient: form.gradient,
      date: form.date || new Date().toISOString(),
      venue: form.venue.trim() || 'Local a definir',
      city: form.city.trim() || 'Sua cidade',
      organizer: form.organizer.trim(),
      description: form.description,
      tiers: parsedTiers.length ? parsedTiers : [{ id: 't0', name: 'Pista', price: 0, total: 0, sold: 0 }],
      rating: null,
      reviews: 0,
    };
  }, [form, tiers]);

  const minPrice = Math.min(...previewEvent.tiers.map((t) => t.price));
  const capacity = previewEvent.tiers.reduce((a, t) => a + t.total, 0);

  return (
    <div className="container create-event fade-up">
      <header className="create-event-header">
        <span className="badge">🎟️ Organizador</span>
        <h1 className="section-title">
          Crie seu <span className="text-gradient">evento</span>
        </h1>
        <p className="muted">Preencha os detalhes e comece a vender ingressos em minutos.</p>
      </header>

      <div className="create-event-layout">
        <form className="create-event-form card" onSubmit={handleSubmit} noValidate>
          <div className="create-event-cover-preview">
            <EventCover event={previewEvent} className="create-event-cover" />
            <p className="muted create-event-cover-hint">Capa gerada a partir do emoji + gradiente</p>
          </div>

          <div className="field">
            <label htmlFor="ce-title">Título do evento *</label>
            <input
              id="ce-title"
              type="text"
              placeholder="Ex: Noite Neon — Edição Verão"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            {errors.title && <p className="create-event-error">{errors.title}</p>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="ce-category">Categoria *</label>
              <select
                id="ce-category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="ce-emoji">Emoji da capa *</label>
              <select
                id="ce-emoji"
                value={form.emoji}
                onChange={(e) => update('emoji', e.target.value)}
              >
                {EMOJI_OPTIONS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="ce-date">Data e horário *</label>
            <input
              id="ce-date"
              type="datetime-local"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
            {errors.date && <p className="create-event-error">{errors.date}</p>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="ce-venue">Local *</label>
              <input
                id="ce-venue"
                type="text"
                placeholder="Ex: Espaço Unimed"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
              />
              {errors.venue && <p className="create-event-error">{errors.venue}</p>}
            </div>

            <div className="field">
              <label htmlFor="ce-city">Cidade *</label>
              <input
                id="ce-city"
                type="text"
                placeholder="Ex: São Paulo, SP"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
              {errors.city && <p className="create-event-error">{errors.city}</p>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="ce-organizer">Nome do organizador *</label>
            <input
              id="ce-organizer"
              type="text"
              placeholder="Ex: Sua Produtora"
              value={form.organizer}
              onChange={(e) => update('organizer', e.target.value)}
            />
            {errors.organizer && <p className="create-event-error">{errors.organizer}</p>}
          </div>

          <div className="field">
            <label htmlFor="ce-description">Descrição *</label>
            <textarea
              id="ce-description"
              placeholder="Conte o que vai rolar, atrações, estrutura, regras..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
            {errors.description && <p className="create-event-error">{errors.description}</p>}
          </div>

          <div className="field">
            <label>Cor da capa *</label>
            <div className="create-event-swatches">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`create-event-swatch${form.gradient === g ? ' is-active' : ''}`}
                  style={{ background: g }}
                  onClick={() => update('gradient', g)}
                  aria-label="Escolher gradiente"
                />
              ))}
            </div>
          </div>

          <section className="create-event-tiers">
            <div className="create-event-tiers-head">
              <h2 className="create-event-tiers-title">Lotes de ingressos</h2>
              <button type="button" className="btn btn-ghost create-event-add-tier" onClick={addTier}>
                + Adicionar lote
              </button>
            </div>

            {tiers.map((tier, index) => (
              <div className="create-event-tier" key={index}>
                <div className="field create-event-tier-name">
                  <label htmlFor={`ce-tier-name-${index}`}>Nome do lote *</label>
                  <input
                    id={`ce-tier-name-${index}`}
                    type="text"
                    placeholder="Ex: Pista, VIP, 1º lote"
                    value={tier.name}
                    onChange={(e) => updateTier(index, 'name', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`ce-tier-price-${index}`}>Preço (R$) *</label>
                  <input
                    id={`ce-tier-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={tier.price}
                    onChange={(e) => updateTier(index, 'price', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`ce-tier-total-${index}`}>Quantidade *</label>
                  <input
                    id={`ce-tier-total-${index}`}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100"
                    value={tier.total}
                    onChange={(e) => updateTier(index, 'total', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="create-event-remove-tier"
                  onClick={() => removeTier(index)}
                  disabled={tiers.length === 1}
                  aria-label="Remover lote"
                  title="Remover lote"
                >
                  ✕
                </button>
              </div>
            ))}
            {errors.tiers && <p className="create-event-error">{errors.tiers}</p>}
          </section>

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            🚀 Publicar evento
          </button>
        </form>

        <aside className="create-event-preview">
          <p className="create-event-preview-label muted">Preview ao vivo</p>
          <div className="card create-event-preview-card">
            <EventCover event={previewEvent} />
            <div className="create-event-preview-body">
              <span className="badge">{previewEvent.category}</span>
              <h3 className="create-event-preview-title">{previewEvent.title}</h3>
              <p className="muted">
                📅 {formatDate(previewEvent.date)} · {formatTime(previewEvent.date)}
              </p>
              <p className="muted">
                📍 {previewEvent.venue} — {previewEvent.city}
              </p>
              <div className="create-event-preview-footer">
                <span>
                  a partir de <strong>{formatBRL(minPrice)}</strong>
                </span>
                {capacity > 0 && <span className="muted">{capacity} ingressos</span>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
