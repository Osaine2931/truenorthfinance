create table if not exists public.payments (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_id text not null unique,
  user_id uuid not null,
  deposit_id uuid null,
  invoice_id text null,
  payment_id text null,
  payment_address text null,
  payment_url text null,
  qr_code_url text null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  crypto_currency text not null default 'BTC',
  expires_at timestamptz null,
  status text not null default 'waiting',
  metadata jsonb null
);

alter table public.payments enable row level security;

create policy if not exists payments_select_own
  on public.payments
  for select
  using (auth.uid() = user_id);

create policy if not exists payments_insert_own
  on public.payments
  for insert
  with check (auth.uid() = user_id);

create policy if not exists payments_update_own
  on public.payments
  for update
  using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
before update on public.payments
for each row
execute function public.touch_updated_at();
