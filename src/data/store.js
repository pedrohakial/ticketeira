// Camada de dados da Ticketeira.
// Eventos, lotes, pedidos e tickets vivem no Supabase (Postgres).
// Pedidos/tickets são escritos apenas via RPCs security definer;
// o localStorage só guarda os ids dos pedidos feitos neste navegador
// (para a página "Meus ingressos").
import { getSupabase } from '../lib/supabase';

const MY_ORDERS_KEY = 'ticketeira:myOrders';

// ---------- mapeadores (linha do banco -> shape usado nas páginas) ----------

function mapTier(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    total: row.total,
    sold: row.sold,
  };
}

function mapEvent(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    emoji: row.emoji,
    gradient: row.gradient,
    date: row.date,
    venue: row.venue,
    city: row.city,
    organizer: row.organizer,
    description: row.description,
    featured: row.featured,
    rating: row.rating != null ? Number(row.rating) : null,
    reviews: row.reviews,
    tiers: (row.ticket_tiers || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(mapTier),
  };
}

function mapOrder(row, extras = {}) {
  return {
    id: row.id,
    eventId: row.event_id,
    tierId: row.tier_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    fee: Number(row.fee),
    total: Number(row.total),
    buyer: { name: row.buyer_name, email: row.buyer_email, cpf: row.buyer_cpf },
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    tickets: [],
    ...extras,
  };
}

function throwSb(error, fallback) {
  throw new Error(error?.message || fallback);
}

// ---------- eventos ----------

export async function getEvents() {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*, ticket_tiers(*)')
    .order('date', { ascending: true });
  if (error) throwSb(error, 'Não foi possível carregar os eventos.');
  return data.map(mapEvent);
}

export async function getEvent(id) {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*, ticket_tiers(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throwSb(error, 'Não foi possível carregar o evento.');
  return data ? mapEvent(data) : null;
}

export async function createEvent(data) {
  const id = `evt-${Date.now().toString(36)}`;
  const eventRow = {
    id,
    title: data.title,
    category: data.category,
    emoji: data.emoji || '🎫',
    gradient: data.gradient || 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    date: new Date(data.date).toISOString(),
    venue: data.venue,
    city: data.city,
    organizer: data.organizer,
    description: data.description,
    featured: false,
    rating: null,
    reviews: 0,
  };
  const { error } = await getSupabase().from('events').insert(eventRow);
  if (error) throwSb(error, 'Não foi possível criar o evento.');

  const tierRows = data.tiers.map((t, i) => ({
    id: `${id}:tier-${i}`,
    event_id: id,
    name: t.name,
    price: Number(t.price),
    total: Number(t.total),
    sold: 0,
    position: i,
  }));
  const { error: tiersError } = await getSupabase().from('ticket_tiers').insert(tierRows);
  if (tiersError) throwSb(tiersError, 'Não foi possível criar os lotes do evento.');

  return mapEvent({ ...eventRow, ticket_tiers: tierRows });
}

// ---------- pedidos ----------

// Lembra localmente os pedidos feitos neste navegador (Meus ingressos).
function rememberOrder(orderId) {
  try {
    const ids = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
    if (!ids.includes(orderId)) ids.push(orderId);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(ids));
  } catch {
    // storage indisponível — a página Meus ingressos simplesmente ficará vazia
  }
}

function readMyOrderIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

// Cria um pedido pendente (estoque é baixado só na confirmação do pagamento).
export async function createOrder({ eventId, tierId, quantity, buyer, paymentMethod }) {
  const { data, error } = await getSupabase().rpc('create_order', {
    p_event_id: eventId,
    p_tier_id: tierId,
    p_quantity: quantity,
    p_buyer_name: buyer.name,
    p_buyer_email: buyer.email,
    p_buyer_cpf: buyer.cpf,
    p_payment_method: paymentMethod,
  });
  if (error) throwSb(error, 'Não foi possível criar o pedido.');
  const order = mapOrder(data);
  rememberOrder(order.id);
  return order;
}

// Confirmação manual do pedido — fallback de demonstração para quando o
// Mercado Pago não está configurado (em produção quem confirma é o webhook).
export async function confirmOrderDemo(orderId) {
  const { data, error } = await getSupabase().rpc('confirm_order', { p_order_id: orderId });
  if (error) throwSb(error, 'Não foi possível confirmar o pedido.');
  return mapOrder(data);
}

// Busca dados de apresentação (título do evento, nome do lote) de vários pedidos.
async function fetchOrderExtras(sb, rows) {
  const orderIds = rows.map((r) => r.id);
  const eventIds = [...new Set(rows.map((r) => r.event_id))];
  const tierIds = [...new Set(rows.map((r) => r.tier_id))];

  const [ticketsRes, eventsRes, tiersRes] = await Promise.all([
    sb.from('tickets').select('order_id, code').in('order_id', orderIds),
    sb.from('events').select('*, ticket_tiers(*)').in('id', eventIds),
    sb.from('ticket_tiers').select('id, name').in('id', tierIds),
  ]);
  if (ticketsRes.error) throwSb(ticketsRes.error, 'Não foi possível carregar os ingressos.');
  if (eventsRes.error) throwSb(eventsRes.error, 'Não foi possível carregar os eventos.');
  if (tiersRes.error) throwSb(tiersRes.error, 'Não foi possível carregar os lotes.');

  const eventsById = new Map(eventsRes.data.map((e) => [e.id, e]));
  const tiersById = new Map(tiersRes.data.map((t) => [t.id, t]));
  const ticketsByOrder = new Map();
  for (const t of ticketsRes.data) {
    if (!ticketsByOrder.has(t.order_id)) ticketsByOrder.set(t.order_id, []);
    ticketsByOrder.get(t.order_id).push({ code: t.code });
  }

  return (row) => {
    const eventRow = eventsById.get(row.event_id);
    return {
      tickets: ticketsByOrder.get(row.id) || [],
      event: eventRow ? mapEvent(eventRow) : null,
      eventTitle: eventRow?.title || 'Evento indisponível',
      tierName: tiersById.get(row.tier_id)?.name || 'Ingresso',
    };
  };
}

export async function getOrder(id) {
  const sb = getSupabase();
  const { data: row, error } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throwSb(error, 'Não foi possível carregar o pedido.');
  if (!row) return null;

  const extrasFor = await fetchOrderExtras(sb, [row]);
  return mapOrder(row, extrasFor(row));
}

// Pedidos feitos neste navegador, mais recente primeiro.
export async function getMyOrders() {
  const ids = readMyOrderIds();
  if (ids.length === 0) return [];

  const sb = getSupabase();
  const { data: rows, error } = await sb
    .from('orders')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throwSb(error, 'Não foi possível carregar seus pedidos.');
  if (!rows.length) return [];

  const extrasFor = await fetchOrderExtras(sb, rows);
  return rows.map((row) => mapOrder(row, extrasFor(row)));
}

// Visão do organizador: eventos + receita estimada por evento.
export async function getOrganizerStats() {
  const events = await getEvents();
  return events.map((e) => {
    const sold = e.tiers.reduce((acc, t) => acc + t.sold, 0);
    const capacity = e.tiers.reduce((acc, t) => acc + t.total, 0);
    const revenue = e.tiers.reduce((acc, t) => acc + t.sold * t.price, 0);
    return { event: e, sold, capacity, revenue };
  });
}

// ---------- constantes e formatação (puros) ----------

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
