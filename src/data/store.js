// Camada de dados da Ticketeira.
// MVP front-end: eventos e pedidos persistem em localStorage,
// com seed de eventos de demonstração na primeira carga.

const EVENTS_KEY = 'ticketeira:events';
const ORDERS_KEY = 'ticketeira:orders';

const seedEvents = [
  {
    id: 'evt-aurora',
    title: 'Aurora Synthwave Live',
    category: 'Eletrônica',
    emoji: '🎛️',
    gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    date: '2026-08-14T22:00:00',
    venue: 'Audio Club',
    city: 'São Paulo, SP',
    organizer: 'Neon Nights Produções',
    description:
      'Uma noite imersiva de synthwave com projeções 360°, lasers e os maiores nomes da cena retrô-futurista. Traga seus óculos neon.',
    tiers: [
      { id: 'pista', name: 'Pista', price: 120, total: 500, sold: 312 },
      { id: 'vip', name: 'VIP (open bar)', price: 320, total: 120, sold: 74 },
      { id: 'camarote', name: 'Camarote', price: 580, total: 40, sold: 21 },
    ],
    featured: true,
    rating: 4.8,
    reviews: 231,
    createdAt: '2026-06-01T12:00:00',
  },
  {
    id: 'evt-maré',
    title: 'Maré Alta — Festival de Verão',
    category: 'Festival',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
    date: '2026-08-29T16:00:00',
    venue: 'Praia do Forte',
    city: 'Salvador, BA',
    organizer: 'Onda Certa Eventos',
    description:
      'Três palcos à beira-mar com axé, pop e eletrônica. Pôr do sol, food trucks e after party inclusos no ingresso.',
    tiers: [
      { id: 'meia', name: 'Meia-entrada', price: 90, total: 800, sold: 401 },
      { id: 'inteira', name: 'Inteira', price: 180, total: 800, sold: 366 },
      { id: 'passaporte', name: 'Passaporte 2 dias', price: 300, total: 200, sold: 88 },
    ],
    featured: true,
    rating: 4.6,
    reviews: 512,
    createdAt: '2026-05-20T12:00:00',
  },
  {
    id: 'evt-veludo',
    title: 'Veludo — Noite de Jazz & Soul',
    category: 'Jazz',
    emoji: '🎷',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    date: '2026-09-05T20:30:00',
    venue: 'Teatro Bourbon',
    city: 'Curitiba, PR',
    organizer: 'Casa Veludo',
    description:
      'Jantar + show em formato cabaré. Standards de jazz, soul brasileiro e uma seleção de vinhos premiada.',
    tiers: [
      { id: 'plateia', name: 'Plateia', price: 150, total: 220, sold: 130 },
      { id: 'mesa', name: 'Mesa p/ 2 + jantar', price: 420, total: 60, sold: 33 },
    ],
    featured: false,
    rating: 4.9,
    reviews: 98,
    createdAt: '2026-06-10T12:00:00',
  },
  {
    id: 'evt-trovão',
    title: 'Trovão Elétrico — Rock in Club',
    category: 'Rock',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg,#ef4444,#7f1d1d)',
    date: '2026-08-08T21:00:00',
    venue: 'Hangar 677',
    city: 'Porto Alegre, RS',
    organizer: 'Sul Pesado Prod.',
    description:
      'O retorno do Trovão Elétrico aos palcos depois de 5 anos. Repertório completo do álbum "Circuito" + clássicos.',
    tiers: [
      { id: 'pista', name: 'Pista', price: 95, total: 700, sold: 655 },
      { id: 'front', name: 'Front stage', price: 190, total: 150, sold: 150 },
    ],
    featured: false,
    rating: 4.7,
    reviews: 187,
    createdAt: '2026-04-15T12:00:00',
  },
  {
    id: 'evt-luar',
    title: 'Luar do Sertão — Acústico',
    category: 'Sertanejo',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg,#22c55e,#0d9488)',
    date: '2026-09-19T19:00:00',
    venue: 'Arena Sertaneja',
    city: 'Goiânia, GO',
    organizer: 'Violada Shows',
    description:
      'Modas de viola ao pôr do sol em formato acústico. Área kids, praça de alimentação e estacionamento incluso.',
    tiers: [
      { id: 'arquibancada', name: 'Arquibancada', price: 60, total: 1200, sold: 402 },
      { id: 'pista', name: 'Pista', price: 110, total: 900, sold: 287 },
      { id: 'camarote', name: 'Camarote família', price: 240, total: 80, sold: 19 },
    ],
    featured: false,
    rating: 4.5,
    reviews: 143,
    createdAt: '2026-06-18T12:00:00',
  },
  {
    id: 'evt-pixel',
    title: 'Pixel Beats — Games & Chiptune',
    category: 'Eletrônica',
    emoji: '👾',
    gradient: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    date: '2026-10-03T18:00:00',
    venue: 'Centro de Convenções',
    city: 'Belo Horizonte, MG',
    organizer: '8-Bit Collective',
    description:
      'Festival de chiptune com freeplay de fliperamas, campeonato de retrogames e DJs tocando trilhas de videogame ao vivo.',
    tiers: [
      { id: 'gamer', name: 'Gamer', price: 75, total: 600, sold: 210 },
      { id: 'pro', name: 'Pro (campeonato)', price: 140, total: 128, sold: 64 },
    ],
    featured: false,
    rating: 4.4,
    reviews: 76,
    createdAt: '2026-06-25T12:00:00',
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getEvents() {
  let events = read(EVENTS_KEY, null);
  if (!events) {
    events = seedEvents;
    write(EVENTS_KEY, events);
  }
  return events;
}

export function getEvent(id) {
  return getEvents().find((e) => e.id === id) || null;
}

export function createEvent(data) {
  const events = getEvents();
  const event = {
    id: `evt-${Date.now().toString(36)}`,
    emoji: data.emoji || '🎫',
    gradient: data.gradient || 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    rating: null,
    reviews: 0,
    featured: false,
    createdAt: new Date().toISOString(),
    ...data,
    tiers: data.tiers.map((t, i) => ({
      id: `tier-${i}`,
      name: t.name,
      price: Number(t.price),
      total: Number(t.total),
      sold: 0,
    })),
  };
  events.push(event);
  write(EVENTS_KEY, events);
  return event;
}

export function getOrders() {
  return read(ORDERS_KEY, []);
}

export function getOrder(id) {
  return getOrders().find((o) => o.id === id) || null;
}

// Efetiva a compra: baixa estoque do lote e registra o pedido.
export function purchaseTickets({ eventId, tierId, quantity, buyer, paymentMethod }) {
  const events = getEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) throw new Error('Evento não encontrado');
  const tier = event.tiers.find((t) => t.id === tierId);
  if (!tier) throw new Error('Tipo de ingresso não encontrado');
  const remaining = tier.total - tier.sold;
  if (quantity > remaining) throw new Error('Ingressos esgotados para este lote');

  tier.sold += quantity;
  write(EVENTS_KEY, events);

  const fee = Math.round(tier.price * quantity * 0.1 * 100) / 100;
  const order = {
    id: `TKT-${Date.now().toString(36).toUpperCase()}`,
    eventId,
    eventTitle: event.title,
    tierId,
    tierName: tier.name,
    unitPrice: tier.price,
    quantity,
    subtotal: tier.price * quantity,
    fee,
    total: tier.price * quantity + fee,
    buyer,
    paymentMethod,
    status: 'confirmado',
    createdAt: new Date().toISOString(),
    tickets: Array.from({ length: quantity }, (_, i) => ({
      code: `${eventId.slice(4, 8).toUpperCase()}-${tierId.toUpperCase()}-${String(
        tier.sold - quantity + i + 1,
      ).padStart(4, '0')}`,
    })),
  };
  const orders = getOrders();
  orders.push(order);
  write(ORDERS_KEY, orders);
  return order;
}

// Visão do organizador: eventos + receita estimada por evento.
export function getOrganizerStats() {
  const events = getEvents();
  return events.map((e) => {
    const sold = e.tiers.reduce((acc, t) => acc + t.sold, 0);
    const capacity = e.tiers.reduce((acc, t) => acc + t.total, 0);
    const revenue = e.tiers.reduce((acc, t) => acc + t.sold * t.price, 0);
    return { event: e, sold, capacity, revenue };
  });
}

export const CATEGORIES = [
  'Eletrônica',
  'Festival',
  'Rock',
  'Sertanejo',
  'Jazz',
  'Pop',
  'Rap & Trap',
  'Clássica',
  'Outro',
];

export const GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#22c55e,#0d9488)',
  'linear-gradient(135deg,#ec4899,#f59e0b)',
  'linear-gradient(135deg,#3b82f6,#8b5cf6)',
];

export function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
