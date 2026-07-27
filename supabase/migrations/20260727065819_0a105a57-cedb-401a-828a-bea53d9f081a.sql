
-- ===== ROLES =====
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== updated_at helper =====
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ===== PROFILES =====
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  country text,
  referral_code text not null unique,
  referred_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin profiles read" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin profiles write" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

-- ===== WALLETS =====
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  available_balance numeric(18,2) not null default 0,
  welcome_bonus numeric(18,2) not null default 0,
  total_deposited numeric(18,2) not null default 0,
  total_invested numeric(18,2) not null default 0,
  total_profit numeric(18,2) not null default 0,
  referral_earnings numeric(18,2) not null default 0,
  has_deposited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "own wallet read" on public.wallets for select to authenticated using (auth.uid() = user_id);
create policy "admin wallets all" on public.wallets for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger wallets_updated before update on public.wallets for each row execute function public.update_updated_at_column();

-- ===== INVESTMENT PLANS =====
create type public.roi_period as enum ('daily','weekly','monthly');

create table public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  min_amount numeric(18,2) not null default 1000,
  max_amount numeric(18,2),
  roi_percent numeric(8,3) not null,
  roi_period public.roi_period not null default 'monthly',
  duration_days integer not null default 90,
  risk_level text default 'Moderate',
  featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.investment_plans to authenticated, anon;
grant all on public.investment_plans to service_role;
alter table public.investment_plans enable row level security;
create policy "anyone reads active plans" on public.investment_plans for select to authenticated, anon using (is_active = true);
create policy "admin plans all" on public.investment_plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger plans_updated before update on public.investment_plans for each row execute function public.update_updated_at_column();

-- ===== CRYPTO METHODS =====
create table public.crypto_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text not null,
  network text,
  wallet_address text not null,
  min_deposit numeric(18,2) not null default 1000,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.crypto_methods to authenticated, anon;
grant all on public.crypto_methods to service_role;
alter table public.crypto_methods enable row level security;
create policy "anyone reads active methods" on public.crypto_methods for select to authenticated, anon using (is_active = true);
create policy "admin methods all" on public.crypto_methods for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger methods_updated before update on public.crypto_methods for each row execute function public.update_updated_at_column();

-- ===== DEPOSITS =====
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(18,2) not null,
  crypto_symbol text not null,
  network text,
  wallet_address text,
  tx_hash text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.deposits to authenticated;
grant all on public.deposits to service_role;
alter table public.deposits enable row level security;
create policy "own deposits read" on public.deposits for select to authenticated using (auth.uid() = user_id);
create policy "own deposits insert" on public.deposits for insert to authenticated with check (auth.uid() = user_id and status = 'pending' and amount >= 1000);
create policy "admin deposits all" on public.deposits for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger deposits_updated before update on public.deposits for each row execute function public.update_updated_at_column();

-- ===== WITHDRAWALS =====
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(18,2) not null,
  crypto_symbol text not null,
  network text,
  destination_address text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;
alter table public.withdrawals enable row level security;
create policy "own withdrawals read" on public.withdrawals for select to authenticated using (auth.uid() = user_id);
create policy "own withdrawals insert" on public.withdrawals for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
create policy "admin withdrawals all" on public.withdrawals for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger withdrawals_updated before update on public.withdrawals for each row execute function public.update_updated_at_column();

-- ===== INVESTMENTS =====
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid references public.investment_plans(id) on delete set null,
  plan_name text,
  amount numeric(18,2) not null,
  profit_earned numeric(18,2) not null default 0,
  expected_profit numeric(18,2) not null default 0,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.investments to authenticated;
grant all on public.investments to service_role;
alter table public.investments enable row level security;
create policy "own investments read" on public.investments for select to authenticated using (auth.uid() = user_id);
create policy "own investments insert" on public.investments for insert to authenticated with check (auth.uid() = user_id);
create policy "admin investments all" on public.investments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger investments_updated before update on public.investments for each row execute function public.update_updated_at_column();

-- ===== TRANSACTIONS =====
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  direction text not null default 'in',
  amount numeric(18,2) not null,
  status text not null default 'completed',
  description text,
  created_at timestamptz not null default now()
);
grant select, insert on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own tx read" on public.transactions for select to authenticated using (auth.uid() = user_id);
create policy "own tx insert" on public.transactions for insert to authenticated with check (auth.uid() = user_id);
create policy "admin tx all" on public.transactions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== ACTIVITIES =====
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
grant select, insert on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy "own activity read" on public.activities for select to authenticated using (auth.uid() = user_id);
create policy "own activity insert" on public.activities for insert to authenticated with check (auth.uid() = user_id);
create policy "admin activity all" on public.activities for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== NOTIFICATIONS =====
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  kind text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notif read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "own notif update" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin notif all" on public.notifications for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== REFERRALS =====
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null unique,
  earnings numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "own referrals read" on public.referrals for select to authenticated using (auth.uid() = referrer_id);
create policy "admin referrals all" on public.referrals for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== ANNOUNCEMENTS =====
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.announcements to authenticated, anon;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "anyone reads active announcements" on public.announcements for select to authenticated, anon using (is_active = true);
create policy "admin announcements all" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger announcements_updated before update on public.announcements for each row execute function public.update_updated_at_column();

-- ===== SITE SETTINGS =====
create table public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to authenticated, anon;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "anyone reads settings" on public.site_settings for select to authenticated, anon using (true);
create policy "admin settings all" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== SIGNUP TRIGGER =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_ref_code text;
  v_referrer uuid;
begin
  v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  v_ref_code := nullif(new.raw_user_meta_data ->> 'referral_code','');

  if v_ref_code is not null then
    select user_id into v_referrer from public.profiles where referral_code = upper(v_ref_code);
  end if;

  insert into public.profiles (user_id, email, full_name, referral_code, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email,'@',1)), v_code, v_referrer);

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  insert into public.wallets (user_id, available_balance, welcome_bonus)
  values (new.id, 0, 1000);

  insert into public.transactions (user_id, type, direction, amount, status, description)
  values (new.id, 'Welcome Bonus', 'in', 1000, 'completed', 'Promotional welcome bonus (non-withdrawable)');

  insert into public.notifications (user_id, title, body, kind)
  values (new.id, 'Welcome to TrueNorth Financial',
    'Your $1,000 Welcome Bonus has been credited. It is promotional and cannot be withdrawn or invested. Make a deposit of at least $1,000 to unlock investment plans.', 'success');

  insert into public.activities (user_id, action, detail)
  values (new.id, 'Account created', 'Welcome bonus credited');

  if v_referrer is not null then
    insert into public.referrals (referrer_id, referred_id) values (v_referrer, new.id) on conflict do nothing;
  end if;

  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== SEED =====
insert into public.investment_plans (name, description, category, min_amount, max_amount, roi_percent, roi_period, duration_days, risk_level, featured) values
('Foundation', 'Capital-preservation portfolio of investment-grade bonds and money markets.', 'Conservative', 1000, 25000, 1.20, 'monthly', 90, 'Low', false),
('Horizon Growth', 'Diversified global equity and index strategy for long-term compounding.', 'Balanced', 5000, 100000, 2.50, 'monthly', 180, 'Moderate', true),
('Momentum', 'Weekly-yield strategy across managed futures and alternatives.', 'Growth', 10000, 250000, 1.10, 'weekly', 270, 'Moderate-High', false),
('Private Wealth', 'Bespoke private markets mandate with dedicated advisory.', 'Premium', 50000, null, 3.40, 'monthly', 365, 'High', true);

insert into public.crypto_methods (name, symbol, network, wallet_address, sort_order) values
('Bitcoin','BTC','Bitcoin','bc1qtruenorthdemoaddressxxxxxxxxxxxxxxxx',1),
('Ethereum','ETH','ERC20','0xTrueNorthDemoAddress000000000000000000',2),
('Tether','USDT','TRC20','TTrueNorthDemoAddress0000000000000',3),
('Tether','USDT','ERC20','0xTrueNorthDemoUSDTERC20000000000000000',4),
('Tether','USDT','BEP20','0xTrueNorthDemoUSDTBEP20000000000000000',5),
('BNB','BNB','BEP20','0xTrueNorthDemoBNB0000000000000000000000',6),
('Solana','SOL','Solana','TrueNorthDemoSolanaAddress00000000000',7);

insert into public.site_settings (key, value) values
('min_deposit','1000'),
('welcome_bonus','1000'),
('referral_rate','5'),
('support_email','support@truenorthfinance.com');
