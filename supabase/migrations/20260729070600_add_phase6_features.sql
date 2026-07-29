create table if not exists public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  level integer not null default 1,
  status text not null default 'not_started',
  document_url text,
  selfie_url text,
  review_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.kyc_verifications to authenticated;
grant all on public.kyc_verifications to service_role;
alter table public.kyc_verifications enable row level security;
create policy "own kyc read" on public.kyc_verifications for select to authenticated using (auth.uid() = user_id);
create policy "own kyc upsert" on public.kyc_verifications for insert, update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin kyc all" on public.kyc_verifications for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject text not null,
  message text not null,
  attachment_url text,
  status text not null default 'open',
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "own support read" on public.support_tickets for select to authenticated using (auth.uid() = user_id);
create policy "own support insert" on public.support_tickets for insert to authenticated with check (auth.uid() = user_id);
create policy "own support update" on public.support_tickets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin support all" on public.support_tickets for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
