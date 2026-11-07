-- Run after 20261106_private_trading.sql. Schema only; no personal data.
begin;

-- Exchange trade IDs can be reused on another trading day.
alter table public.trading_trades
  add column if not exists trade_date date generated always as
    ((traded_at at time zone 'Asia/Kolkata')::date) stored,
  add column if not exists segment text not null default 'UNKNOWN',
  add column if not exists source text not null default 'kite';
alter table public.trading_trades drop constraint if exists trading_trades_pkey;
alter table public.trading_trades add primary key (owner_email, exchange, trade_date, trade_id);

create table if not exists public.trading_imports (
  owner_email text not null references public.trading_connections(owner_email),
  file_hash text not null,
  kind text not null check (kind in ('tradebook', 'ledger')),
  row_count integer not null,
  date_from date not null,
  date_to date not null,
  imported_at timestamptz not null default now(),
  opening_balance numeric(24,6),
  closing_balance numeric(24,6),
  primary key (owner_email, file_hash)
);

create table if not exists public.trading_ledger (
  owner_email text not null references public.trading_connections(owner_email),
  entry_id text not null,
  posting_date date not null,
  particulars text not null,
  cost_center text not null,
  voucher_type text not null,
  category text not null check (category in ('deposit','withdrawal','fo_settlement','other')),
  debit numeric(24,6) not null check (debit >= 0),
  credit numeric(24,6) not null check (credit >= 0),
  balance numeric(24,6) not null,
  source_sequence integer not null,
  import_hash text not null,
  primary key (owner_email, entry_id),
  foreign key (owner_email, import_hash)
    references public.trading_imports(owner_email, file_hash)
);
create index if not exists trading_ledger_owner_date
  on public.trading_ledger(owner_email, posting_date, source_sequence);

alter table public.trading_imports enable row level security;
alter table public.trading_ledger enable row level security;
revoke all on public.trading_imports, public.trading_ledger from public, anon, authenticated;
grant select, insert, update, delete on public.trading_imports, public.trading_ledger to service_role;

-- One transaction for the report and all its rows. Only the backend can invoke
-- this function; it cannot run arbitrary SQL or place trades.
create or replace function public.import_trading_report(p_owner text, p_report jsonb)
returns jsonb language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  n_trades integer := 0;
  n_ledger integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('trading-import:' || p_owner, 0));
  if exists(select 1 from trading_imports
            where owner_email = p_owner and file_hash = p_report->>'file_hash') then
    return jsonb_build_object('already_imported',true,'new_trades',0,'new_ledger_entries',0);
  end if;

  -- A repeated fill may have different broker/exchange order IDs, but its
  -- instrument, side, units, and price must agree before it is deduplicated.
  if exists (
    select 1 from jsonb_to_recordset(p_report->'trades') as x(
      trade_id text,exchange text,symbol text,side text,quantity integer,price numeric,traded_at timestamptz)
    join trading_trades t on t.owner_email=p_owner and t.exchange=x.exchange
      and t.trade_id=x.trade_id and t.trade_date=(x.traded_at at time zone 'Asia/Kolkata')::date
    where t.symbol<>x.symbol or t.side<>x.side or t.quantity<>x.quantity or t.price<>x.price
  ) then
    raise exception 'Import conflicts with an existing trade. No records were changed.';
  end if;

  insert into trading_connections(owner_email) values (p_owner) on conflict do nothing;
  insert into trading_imports(owner_email,file_hash,kind,row_count,date_from,date_to,opening_balance,closing_balance)
  values (p_owner,p_report->>'file_hash',p_report->>'kind',(p_report->>'row_count')::integer,
    (p_report->>'date_from')::date,(p_report->>'date_to')::date,
    (p_report->>'opening_balance')::numeric,(p_report->>'closing_balance')::numeric);

  insert into trading_trades(owner_email,trade_id,order_id,exchange,symbol,side,quantity,price,traded_at,segment,source)
  select p_owner,x.trade_id,x.order_id,x.exchange,x.symbol,x.side,x.quantity,x.price,x.traded_at,x.segment,'console'
  from jsonb_to_recordset(p_report->'trades') as x(
    trade_id text,order_id text,exchange text,symbol text,side text,quantity integer,
    price numeric,traded_at timestamptz,segment text)
  on conflict (owner_email,exchange,trade_date,trade_id) do nothing;
  get diagnostics n_trades = row_count;

  insert into trading_ledger(owner_email,entry_id,posting_date,particulars,cost_center,voucher_type,
    category,debit,credit,balance,source_sequence,import_hash)
  select p_owner,x.entry_id,x.posting_date,x.particulars,x.cost_center,x.voucher_type,
    x.category,x.debit,x.credit,x.balance,x.source_sequence,p_report->>'file_hash'
  from jsonb_to_recordset(p_report->'ledger') as x(
    entry_id text,posting_date date,particulars text,cost_center text,voucher_type text,
    category text,debit numeric,credit numeric,balance numeric,source_sequence integer)
  on conflict (owner_email,entry_id) do nothing;
  get diagnostics n_ledger = row_count;

  return jsonb_build_object('already_imported',false,'new_trades',n_trades,'new_ledger_entries',n_ledger);
end;
$$;
revoke all on function public.import_trading_report(text,jsonb) from public, anon, authenticated;
grant execute on function public.import_trading_report(text,jsonb) to service_role;

notify pgrst, 'reload schema';

commit;
