-- Ticketeira — schema inicial
-- Eventos, lotes de ingressos, pedidos e tickets + RPCs de compra.

create table if not exists public.events (
  id text primary key,
  title text not null,
  category text not null,
  emoji text not null default '🎫',
  gradient text not null default 'linear-gradient(135deg,#8b5cf6,#ec4899)',
  date timestamptz not null,
  venue text not null,
  city text not null,
  organizer text not null,
  description text not null default '',
  featured boolean not null default false,
  rating numeric(2,1),
  reviews integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_tiers (
  id text primary key, -- formato: <event_id>:<slug>
  event_id text not null references public.events(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  total integer not null check (total > 0),
  sold integer not null default 0 check (sold >= 0),
  position integer not null default 0
);

create index if not exists ticket_tiers_event_idx on public.ticket_tiers(event_id);

create table if not exists public.orders (
  id text primary key,
  event_id text not null references public.events(id),
  tier_id text not null references public.ticket_tiers(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  fee numeric(10,2) not null,
  total numeric(10,2) not null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_cpf text,
  payment_method text not null default 'mercadopago',
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'cancelado')),
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists orders_event_idx on public.orders(event_id);
create index if not exists orders_email_idx on public.orders(buyer_email);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists tickets_order_idx on public.tickets(order_id);

-- ---------- RLS ----------
alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.tickets enable row level security;

-- leitura pública do catálogo
create policy "eventos públicos" on public.events for select using (true);
create policy "lotes públicos" on public.ticket_tiers for select using (true);

-- compradores leem seus próprios pedidos/tickets pelo id (consulta direta por id)
create policy "pedido legível por id" on public.orders for select using (true);
create policy "tickets legíveis" on public.tickets for select using (true);

-- escrita só via RPCs (security definer) ou service role
create policy "sem insert direto em pedidos" on public.orders for insert with check (false);
create policy "sem insert direto em tickets" on public.tickets for insert with check (false);
create policy "organizador cria eventos" on public.events for insert with check (true);
create policy "organizador cria lotes" on public.ticket_tiers for insert with check (true);

-- ---------- RPCs ----------

-- Cria pedido pendente (sem baixar estoque). Retorna o pedido como json.
create or replace function public.create_order(
  p_event_id text,
  p_tier_id text,
  p_quantity integer,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_cpf text default null,
  p_payment_method text default 'mercadopago'
) returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_tier ticket_tiers%rowtype;
  v_order_id text;
  v_subtotal numeric(10,2);
  v_fee numeric(10,2);
begin
  select * into v_tier from ticket_tiers where id = p_tier_id and event_id = p_event_id for update;
  if not found then
    raise exception 'Lote não encontrado';
  end if;
  if p_quantity < 1 or p_quantity > 10 then
    raise exception 'Quantidade inválida';
  end if;
  if v_tier.total - v_tier.sold < p_quantity then
    raise exception 'Ingressos esgotados para este lote';
  end if;

  v_order_id := 'TKT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  v_subtotal := round(v_tier.price * p_quantity, 2);
  v_fee := round(v_subtotal * 0.10, 2);

  insert into orders (id, event_id, tier_id, quantity, unit_price, subtotal, fee, total,
                      buyer_name, buyer_email, buyer_cpf, payment_method, status)
  values (v_order_id, p_event_id, p_tier_id, p_quantity, v_tier.price, v_subtotal, v_fee,
          v_subtotal + v_fee, p_buyer_name, p_buyer_email, p_buyer_cpf, p_payment_method, 'pendente');

  return (select row_to_json(o) from orders o where o.id = v_order_id);
end;
$$;

-- Confirma o pedido após pagamento aprovado: baixa estoque e emite tickets.
create or replace function public.confirm_order(p_order_id text, p_mp_payment_id text default null)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_tier ticket_tiers%rowtype;
  i integer;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_order.status = 'confirmado' then
    return (select row_to_json(o) from orders o where o.id = p_order_id);
  end if;
  if v_order.status = 'cancelado' then
    raise exception 'Pedido cancelado';
  end if;

  select * into v_tier from ticket_tiers where id = v_order.tier_id for update;
  if v_tier.total - v_tier.sold < v_order.quantity then
    update orders set status = 'cancelado' where id = p_order_id;
    raise exception 'Estoque insuficiente; pedido cancelado';
  end if;

  update ticket_tiers set sold = sold + v_order.quantity where id = v_order.tier_id;
  update orders set status = 'confirmado', mp_payment_id = coalesce(p_mp_payment_id, mp_payment_id)
  where id = p_order_id;

  for i in 1..v_order.quantity loop
    insert into tickets (order_id, code)
    values (p_order_id,
            upper(substr(replace(v_order.event_id, 'evt-', ''), 1, 4)) || '-' ||
            upper(substr(md5(random()::text || i::text || clock_timestamp()::text), 1, 8)));
  end loop;

  return (select row_to_json(o) from orders o where o.id = p_order_id);
end;
$$;

-- Cancela pedido pendente (pagamento recusado/expirado).
create or replace function public.cancel_order(p_order_id text)
returns void
language sql security definer set search_path = public
as $$
  update orders set status = 'cancelado' where id = p_order_id and status = 'pendente';
$$;

-- helper para o MCP server (introspecção de tabelas)
create or replace function public.get_tables_info()
returns json
language sql security definer set search_path = public
as $$
  select coalesce(json_agg(t), '[]'::json) from (
    select tablename as name from pg_tables where schemaname = 'public' order by tablename
  ) t;
$$;
