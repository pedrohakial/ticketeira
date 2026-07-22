import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { getEvent, purchaseTickets, formatBRL, formatDate, formatTime } from '../data/store';
import { EventCover } from '../components/EventCard';
import './Checkout.css';

// Máscaras simples de entrada (apenas formatação visual).
function maskCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function randomPixKey() {
  const hex = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0');
  return `${hex()}-${hex().slice(0, 4)}-${hex().slice(0, 4)}-${hex().slice(0, 4)}-${hex()}${hex().slice(0, 4)}`;
}

export default function Checkout() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const event = getEvent(eventId);
  const tierId = searchParams.get('tier');
  const quantity = Math.max(1, parseInt(searchParams.get('qty'), 10) || 1);
  const tier = event?.tiers.find((t) => t.id === tierId);

  // Chave PIX aleatória gerada uma vez por sessão de checkout.
  const pixKey = useMemo(() => randomPixKey(), []);

  const [buyer, setBuyer] = useState({ name: '', email: '', cpf: '' });
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!event || !tier) {
    return <Navigate to="/" replace />;
  }

  const subtotal = tier.price * quantity;
  const fee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + fee;

  function updateBuyer(field, value) {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  }

  function updateCard(field, value) {
    setCard((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!buyer.name.trim() || !buyer.email.trim() || buyer.cpf.length < 14) {
      setError('Preencha nome, e-mail e CPF completos para continuar.');
      return;
    }
    if (paymentMethod === 'cartao') {
      const numberOk = card.number.replace(/\D/g, '').length === 16;
      const expiryOk = /^\d{2}\/\d{2}$/.test(card.expiry);
      const cvvOk = card.cvv.length >= 3;
      if (!numberOk || !expiryOk || !cvvOk || !card.holder.trim()) {
        setError('Confira os dados do cartão: número, validade, CVV e nome impresso.');
        return;
      }
    }

    setLoading(true);
    // Simula o processamento do pagamento antes de efetivar a compra.
    setTimeout(() => {
      try {
        const order = purchaseTickets({
          eventId,
          tierId,
          quantity,
          buyer: { name: buyer.name.trim(), email: buyer.email.trim(), cpf: buyer.cpf },
          paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'Cartão',
        });
        navigate(`/confirmacao/${order.id}`);
      } catch (err) {
        setLoading(false);
        setError(err.message || 'Não foi possível concluir o pagamento. Tente novamente.');
      }
    }, 1200);
  }

  return (
    <main className="checkout container fade-up">
      <header className="checkout-header">
        <span className="badge">🔒 Compra segura</span>
        <h1 className="section-title">
          Finalizar <span className="text-gradient">pagamento</span>
        </h1>
        <p className="muted">Falta pouco para garantir seu lugar no rolê.</p>
      </header>

      <div className="checkout-grid">
        <form className="checkout-form card" onSubmit={handleSubmit}>
          <h2 className="checkout-section-title">👤 Dados do comprador</h2>
          <div className="field">
            <label htmlFor="ck-name">Nome completo</label>
            <input
              id="ck-name"
              type="text"
              placeholder="Como no seu documento"
              value={buyer.name}
              onChange={(e) => updateBuyer('name', e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="ck-email">E-mail</label>
              <input
                id="ck-email"
                type="email"
                placeholder="voce@email.com"
                value={buyer.email}
                onChange={(e) => updateBuyer('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="ck-cpf">CPF</label>
              <input
                id="ck-cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={buyer.cpf}
                onChange={(e) => updateBuyer('cpf', maskCPF(e.target.value))}
              />
            </div>
          </div>

          <h2 className="checkout-section-title">💳 Pagamento</h2>
          <div className="checkout-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={paymentMethod === 'pix'}
              className={`checkout-tab ${paymentMethod === 'pix' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('pix')}
            >
              ⚡ PIX
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={paymentMethod === 'cartao'}
              className={`checkout-tab ${paymentMethod === 'cartao' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cartao')}
            >
              💳 Cartão
            </button>
          </div>

          {paymentMethod === 'pix' ? (
            <div className="checkout-pix">
              <div className="checkout-qr" aria-hidden="true">
                <span>◼️◻️◼️</span>
                <span>◻️🔳◻️</span>
                <span>◼️◻️◼️</span>
              </div>
              <p className="checkout-pix-hint">
                Pague com PIX para aprovação instantânea. Escaneie o QR code ou use a chave
                aleatória:
              </p>
              <code className="checkout-pix-key">{pixKey}</code>
            </div>
          ) : (
            <div className="checkout-card-fields">
              <div className="field">
                <label htmlFor="ck-card-number">Número do cartão</label>
                <input
                  id="ck-card-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => updateCard('number', maskCardNumber(e.target.value))}
                  autoComplete="cc-number"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="ck-card-expiry">Validade</label>
                  <input
                    id="ck-card-expiry"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={card.expiry}
                    onChange={(e) => updateCard('expiry', maskExpiry(e.target.value))}
                    autoComplete="cc-exp"
                  />
                </div>
                <div className="field">
                  <label htmlFor="ck-card-cvv">CVV</label>
                  <input
                    id="ck-card-cvv"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvv}
                    onChange={(e) =>
                      updateCard('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ck-card-holder">Nome no cartão</label>
                <input
                  id="ck-card-holder"
                  type="text"
                  placeholder="Como impresso no cartão"
                  value={card.holder}
                  onChange={(e) => updateCard('holder', e.target.value)}
                  autoComplete="cc-name"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="checkout-error" role="alert">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Processando pagamento…' : `Confirmar pagamento · ${formatBRL(total)}`}
          </button>
          <p className="checkout-secure-note muted">
            🔒 Seus dados são criptografados e nunca são compartilhados.
          </p>
        </form>

        <aside className="checkout-summary card">
          <h2 className="checkout-section-title">🎟️ Resumo do pedido</h2>
          <div className="checkout-event">
            <EventCover event={event} className="checkout-cover" />
            <div className="checkout-event-info">
              <h3 className="checkout-event-title">{event.title}</h3>
              <p className="muted">
                📅 {formatDate(event.date)} · {formatTime(event.date)}
              </p>
              <p className="muted">
                📍 {event.venue} — {event.city}
              </p>
            </div>
          </div>

          <div className="checkout-lines">
            <div className="checkout-line">
              <span>
                {tier.name} × {quantity}
              </span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="checkout-line muted">
              <span>Taxa de serviço (10%)</span>
              <span>{formatBRL(fee)}</span>
            </div>
            <div className="checkout-line checkout-total">
              <span>Total</span>
              <span className="text-gradient">{formatBRL(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
