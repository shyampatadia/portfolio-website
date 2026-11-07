-- Run once in the Supabase SQL editor. No real account data belongs in Git.
begin;

create table if not exists public.trading_connections (
  owner_email text primary key,
  access_token_encrypted text,
  connected_at timestamptz,
  synced_at timestamptz,
  needs_reconnect boolean not null default false,
  login_nonce_hash text,
  login_expires_at timestamptz
);

-- One latest snapshot per observed IST day. A snapshot is not a return series:
-- changing holdings and cash flows also change the recorded portfolio value.
create table if not exists public.trading_days (
  owner_email text not null references public.trading_connections(owner_email),
  date date not null,
  captured_at timestamptz not null,
  totals jsonb not null,
  holdings jsonb not null,
  positions jsonb not null,
  primary key (owner_email, date)
);

create table if not exists public.trading_trades (
  owner_email text not null references public.trading_connections(owner_email),
  trade_id text not null,
  order_id text not null,
  exchange text not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  quantity integer not null check (quantity > 0),
  price numeric not null check (price >= 0),
  traded_at timestamptz not null,
  primary key (owner_email, exchange, trade_id)
);
create index if not exists trading_trades_owner_time
  on public.trading_trades(owner_email, traded_at desc);

-- The app uses its own admin JWT, not a Supabase browser session. Only the
-- backend service role gets access. RLS has NO browser/anonymous policies.
alter table public.trading_connections enable row level security;
alter table public.trading_days enable row level security;
alter table public.trading_trades enable row level security;
revoke all on public.trading_connections from anon, authenticated;
revoke all on public.trading_days from anon, authenticated;
revoke all on public.trading_trades from anon, authenticated;
grant select, insert, update, delete on public.trading_connections to service_role;
grant select, insert, update, delete on public.trading_days to service_role;
grant select, insert, update, delete on public.trading_trades to service_role;

commit;
