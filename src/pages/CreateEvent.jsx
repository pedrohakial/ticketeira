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
import { useReveal } from '../hooks/useReveal';
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const headerRef = useReveal();
  const previewRef = useReveal();

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const novoEvento = await createEvent({
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
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err.message || 'Não foi possível publicar o evento. Tente novamente.');
    }
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

  // Bloco de data do preview (dia grande + mês).
  const previewDate = new Date(previewEvent.date);
  const previewDay = String(previewDate.getDate()).padStart(2, '0');
  const previewMonth = previewDate
    .toLocaleString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase();

  return (
    <div className="container ce">
      <header className="ce-header reveal" ref={headerRef}>
        <span className="badge">🎟️ Modo produtor</span>
        <h1 className="ce-title">
          Lance seu <span className="text-gradient">show</span>
        </h1>
        <p className="muted ce-subtitle">
          Do palco à pista em minutos: monte o evento, crie os lotes e abra as vendas.
        </p>
      </header>

      <div className="ce-layout">
        <form className="ce-form" onSubmit={handleSubmit} noValidate>
          {/* ---------- 01 · Identidade ---------- */}
          <section className="glass ce-section">
            <div className="ce-section-head">
              <span className="ce-section-num" aria-hidden="true">01</span>
              <div>
                <h2 className="ce-section-title">Identidade</h2>
                <p className="muted ce-section-sub">A cara do seu evento no lineup.</p>
              </div>
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
              {errors.title && <p className="ce-error">{errors.title}</p>}
            </div>

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
              <span className="ce-label" id="ce-emoji-label">Emoji da capa *</span>
              <div className="ce-emoji-grid" role="group" aria-labelledby="ce-emoji-label">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`ce-emoji${form.emoji === em ? ' is-active' : ''}`}
                    onClick={() => update('emoji', em)}
                    aria-pressed={form.emoji === em}
                    aria-label={`Usar emoji ${em} na capa`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="ce-label" id="ce-gradient-label">Cor da capa *</span>
              <div className="ce-swatches" role="group" aria-labelledby="ce-gradient-label">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`ce-swatch${form.gradient === g ? ' is-active' : ''}`}
                    style={{ background: g }}
                    onClick={() => update('gradient', g)}
                    aria-pressed={form.gradient === g}
                    aria-label="Escolher gradiente"
                  />
                ))}
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
              {errors.organizer && <p className="ce-error">{errors.organizer}</p>}
            </div>

            <div className="field">
              <label htmlFor="ce-description">Descrição *</label>
              <textarea
                id="ce-description"
                placeholder="Conte o que vai rolar, atrações, estrutura, regras..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              {errors.description && <p className="ce-error">{errors.description}</p>}
            </div>
          </section>

          {/* ---------- 02 · Quando & Onde ---------- */}
          <section className="glass ce-section">
            <div className="ce-section-head">
              <span className="ce-section-num" aria-hidden="true">02</span>
              <div>
                <h2 className="ce-section-title">Quando &amp; Onde</h2>
                <p className="muted ce-section-sub">Marque o ponto de encontro da galera.</p>
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
              {errors.date && <p className="ce-error">{errors.date}</p>}
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
                {errors.venue && <p className="ce-error">{errors.venue}</p>}
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
                {errors.city && <p className="ce-error">{errors.city}</p>}
              </div>
            </div>
          </section>

          {/* ---------- 03 · Lotes ---------- */}
          <section className="glass ce-section">
            <div className="ce-section-head">
              <span className="ce-section-num" aria-hidden="true">03</span>
              <div>
                <h2 className="ce-section-title">Lotes</h2>
                <p className="muted ce-section-sub">Pista, VIP, camarote — precifique cada experiência.</p>
              </div>
            </div>

            <div className="ce-tiers">
              {tiers.map((tier, index) => (
                <div className="ce-tier" key={index}>
                  <div className="ce-tier-head">
                    <span className="ce-tier-tag">Lote {index + 1}</span>
                    <button
                      type="button"
                      className="ce-tier-remove"
                      onClick={() => removeTier(index)}
                      disabled={tiers.length === 1}
                      aria-label="Remover lote"
                      title="Remover lote"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="ce-tier-grid">
                    <div className="field ce-tier-name">
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
                  </div>
                </div>
              ))}
            </div>

            {errors.tiers && <p className="ce-error">{errors.tiers}</p>}

            <button type="button" className="btn btn-ghost ce-add-tier" onClick={addTier}>
              ＋ Adicionar lote
            </button>
          </section>

          {/* ---------- 04 · Revisão ---------- */}
          <section className="glass ce-section">
            <div className="ce-section-head">
              <span className="ce-section-num" aria-hidden="true">04</span>
              <div>
                <h2 className="ce-section-title">Revisão</h2>
                <p className="muted ce-section-sub">Último soundcheck antes de subir no ar.</p>
              </div>
            </div>

            <ul className="ce-review">
              <li>
                <span className="ce-review-key">🎤 Evento</span>
                <span className="ce-review-val">{previewEvent.title}</span>
              </li>
              <li>
                <span className="ce-review-key">📅 Quando</span>
                <span className="ce-review-val">
                  {form.date
                    ? `${formatDate(previewEvent.date)} · ${formatTime(previewEvent.date)}`
                    : 'Defina na seção 02'}
                </span>
              </li>
              <li>
                <span className="ce-review-key">📍 Onde</span>
                <span className="ce-review-val">
                  {previewEvent.venue} — {previewEvent.city}
                </span>
              </li>
              <li>
                <span className="ce-review-key">🎟️ Lotes</span>
                <span className="ce-review-val">
                  {tiers.length} {tiers.length === 1 ? 'lote' : 'lotes'}
                  {capacity > 0 ? ` · ${capacity} ingressos` : ''}
                </span>
              </li>
              <li>
                <span className="ce-review-key">💸 A partir de</span>
                <span className="ce-review-val ce-review-price">{formatBRL(minPrice)}</span>
              </li>
            </ul>

            {submitError && <p className="ce-error">{submitError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block ce-submit"
              disabled={submitting}
            >
              {submitting ? '⏳ Publicando…' : '🚀 Publicar evento'}
            </button>
          </section>
        </form>

        <aside className="ce-preview reveal" ref={previewRef}>
          <p className="ce-preview-label">✨ Preview ao vivo</p>
          <div className="card ce-preview-card">
            <div className="ce-preview-cover-wrap">
              <EventCover event={previewEvent} />
              <div className="ce-preview-dateblock" aria-hidden="true">
                <span className="ce-preview-day">{previewDay}</span>
                <span className="ce-preview-month">{previewMonth}</span>
              </div>
            </div>
            <div className="ce-preview-body">
              <span className="badge">{previewEvent.category}</span>
              <h3 className="ce-preview-title">{previewEvent.title}</h3>
              <p className="muted">
                📅 {formatDate(previewEvent.date)} · {formatTime(previewEvent.date)}
              </p>
              <p className="muted">
                📍 {previewEvent.venue} — {previewEvent.city}
              </p>
              <div className="ce-preview-footer">
                <span>
                  a partir de <strong>{formatBRL(minPrice)}</strong>
                </span>
                {capacity > 0 && <span className="muted">{capacity} ingressos</span>}
              </div>
            </div>
          </div>
          <p className="muted ce-preview-hint">É assim que seu evento aparece no lineup.</p>
        </aside>
      </div>
    </div>
  );
}
