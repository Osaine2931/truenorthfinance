-- 1. payments table (NOWPayments invoice <-> deposit mapping)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deposit_id uuid REFERENCES public.deposits(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'nowpayments',
  order_id text NOT NULL,
  invoice_id text,
  payment_id text,
  payment_address text,
  payment_url text,
  qr_code_url text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  crypto_currency text,
  network text,
  pay_amount numeric,
  actually_paid numeric,
  status text NOT NULL DEFAULT 'waiting',
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payments_order_id_key ON public.payments (order_id);
CREATE UNIQUE INDEX payments_invoice_id_key ON public.payments (invoice_id) WHERE invoice_id IS NOT NULL AND invoice_id <> '';
CREATE UNIQUE INDEX payments_payment_id_key ON public.payments (payment_id) WHERE payment_id IS NOT NULL AND payment_id <> '';
CREATE INDEX payments_deposit_id_idx ON public.payments (deposit_id);
CREATE INDEX payments_user_id_idx ON public.payments (user_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own payments read" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin payments all" ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. deposits: allow the real initial lifecycle status used by the app
DROP POLICY IF EXISTS "own deposits insert" ON public.deposits;
CREATE POLICY "own deposits insert" ON public.deposits
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'waiting')
    AND amount >= 1000::numeric
  );

CREATE INDEX IF NOT EXISTS deposits_user_status_idx ON public.deposits (user_id, status);

-- 3. remove demo/placeholder crypto addresses; the provider supplies real addresses
ALTER TABLE public.crypto_methods ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE public.crypto_methods ALTER COLUMN wallet_address SET DEFAULT NULL;
UPDATE public.crypto_methods SET wallet_address = NULL;

-- 4. idempotency reference on transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference text;
CREATE UNIQUE INDEX transactions_reference_key ON public.transactions (reference) WHERE reference IS NOT NULL;

-- 5. atomic + idempotent deposit crediting (service role only)
CREATE OR REPLACE FUNCTION public.credit_deposit(
  p_deposit_id uuid,
  p_paid_amount numeric DEFAULT NULL,
  p_payment_id text DEFAULT NULL,
  p_status text DEFAULT 'finished'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_deposit public.deposits%rowtype;
  v_amount numeric;
begin
  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'deposit_not_found');
  end if;

  if v_deposit.status = 'completed' then
    return jsonb_build_object('ok', true, 'already_processed', true, 'deposit_id', v_deposit.id);
  end if;

  v_amount := coalesce(nullif(p_paid_amount, 0), v_deposit.amount);
  if v_amount is null or v_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  update public.wallets
     set available_balance = available_balance + v_amount,
         total_deposited   = total_deposited + v_amount,
         has_deposited     = true
   where user_id = v_deposit.user_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'wallet_not_found');
  end if;

  update public.deposits
     set status = 'completed'
   where id = v_deposit.id;

  update public.payments
     set status = coalesce(p_status, status),
         actually_paid = coalesce(p_paid_amount, actually_paid),
         payment_id = coalesce(nullif(p_payment_id, ''), payment_id)
   where deposit_id = v_deposit.id;

  insert into public.transactions (user_id, type, direction, amount, status, description, reference)
  values (v_deposit.user_id, 'Deposit', 'in', v_amount, 'completed',
          v_deposit.crypto_symbol || ' deposit confirmed', 'deposit:' || v_deposit.id)
  on conflict (reference) where reference is not null do nothing;

  insert into public.activities (user_id, action, detail)
  values (v_deposit.user_id, 'Deposit confirmed',
          v_deposit.crypto_symbol || ' deposit of ' || v_amount::text || ' credited');

  insert into public.notifications (user_id, title, body, kind)
  values (v_deposit.user_id, 'Deposit completed',
          'Your wallet has been credited with ' || v_amount::text || ' USD.', 'success');

  return jsonb_build_object('ok', true, 'already_processed', false,
                            'deposit_id', v_deposit.id, 'amount', v_amount);
end;
$$;

REVOKE ALL ON FUNCTION public.credit_deposit(uuid, numeric, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_deposit(uuid, numeric, text, text) TO service_role;

-- 6. atomic, server-verified investment creation (runs as the signed-in user)
CREATE OR REPLACE FUNCTION public.create_investment(p_plan_id uuid, p_amount numeric)
RETURNS public.investments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid := auth.uid();
  v_plan public.investment_plans%rowtype;
  v_wallet public.wallets%rowtype;
  v_periods numeric;
  v_expected numeric;
  v_investment public.investments%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter a valid investment amount';
  end if;

  select * into v_plan from public.investment_plans where id = p_plan_id and is_active = true;
  if not found then
    raise exception 'This investment plan is not available';
  end if;

  if p_amount < v_plan.min_amount then
    raise exception 'Minimum investment for % is %', v_plan.name, v_plan.min_amount;
  end if;

  if v_plan.max_amount is not null and v_plan.max_amount > 0 and p_amount > v_plan.max_amount then
    raise exception 'Maximum investment for % is %', v_plan.name, v_plan.max_amount;
  end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;
  if not found then
    raise exception 'Wallet not found';
  end if;

  if not v_wallet.has_deposited then
    raise exception 'Complete your first deposit of at least $1,000 to unlock investing.';
  end if;

  if v_wallet.available_balance < p_amount then
    raise exception 'Insufficient available balance';
  end if;

  v_periods := case v_plan.roi_period
                 when 'daily' then v_plan.duration_days::numeric
                 when 'weekly' then v_plan.duration_days::numeric / 7
                 else v_plan.duration_days::numeric / 30
               end;
  v_expected := round(p_amount * (v_plan.roi_percent / 100) * v_periods, 2);

  update public.wallets
     set available_balance = available_balance - p_amount,
         total_invested = total_invested + p_amount
   where user_id = v_uid;

  insert into public.investments (user_id, plan_id, plan_name, amount, expected_profit,
                                  profit_earned, status, started_at, ends_at)
  values (v_uid, v_plan.id, v_plan.name, p_amount, v_expected, 0, 'active', now(),
          now() + make_interval(days => v_plan.duration_days))
  returning * into v_investment;

  insert into public.transactions (user_id, type, direction, amount, status, description, reference)
  values (v_uid, 'Investment purchase', 'out', p_amount, 'completed',
          'Purchased ' || v_plan.name, 'investment:' || v_investment.id);

  insert into public.activities (user_id, action, detail)
  values (v_uid, 'Investment purchased', p_amount::text || ' invested in ' || v_plan.name);

  insert into public.notifications (user_id, title, body, kind)
  values (v_uid, 'Investment purchased',
          'Your ' || v_plan.name || ' investment was added to your portfolio.', 'success');

  return v_investment;
end;
$$;

REVOKE ALL ON FUNCTION public.create_investment(uuid, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_investment(uuid, numeric) TO authenticated, service_role;

-- 7. idempotent maturity / ROI processing (service role only)
CREATE OR REPLACE FUNCTION public.process_investment_maturity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_inv public.investments%rowtype;
  v_total numeric;
  v_elapsed numeric;
  v_progress numeric;
  v_processed int := 0;
  v_completed int := 0;
begin
  for v_inv in
    select * from public.investments where status = 'active' order by created_at
  loop
    perform 1 from public.investments where id = v_inv.id and status = 'active' for update;
    if not found then
      continue;
    end if;

    v_processed := v_processed + 1;

    if v_inv.ends_at is not null and v_inv.ends_at <= now() then
      update public.wallets
         set available_balance = available_balance + v_inv.amount + v_inv.expected_profit,
             total_profit = total_profit + v_inv.expected_profit
       where user_id = v_inv.user_id;

      update public.investments
         set status = 'completed', profit_earned = v_inv.expected_profit
       where id = v_inv.id;

      insert into public.transactions (user_id, type, direction, amount, status, description, reference)
      values (v_inv.user_id, 'Investment payout', 'in', v_inv.amount + v_inv.expected_profit,
              'completed', coalesce(v_inv.plan_name, 'Investment') || ' matured',
              'payout:' || v_inv.id)
      on conflict (reference) where reference is not null do nothing;

      insert into public.activities (user_id, action, detail)
      values (v_inv.user_id, 'Investment completed',
              coalesce(v_inv.plan_name, 'Investment') || ' reached maturity');

      insert into public.notifications (user_id, title, body, kind)
      values (v_inv.user_id, 'Investment completed',
              'Your ' || coalesce(v_inv.plan_name, 'investment') ||
              ' has matured and the profit was credited.', 'success');

      v_completed := v_completed + 1;
    else
      v_total := greatest(1, extract(epoch from (coalesce(v_inv.ends_at, v_inv.started_at + interval '30 days') - v_inv.started_at)));
      v_elapsed := greatest(0, extract(epoch from (now() - v_inv.started_at)));
      v_progress := least(1, v_elapsed / v_total);
      update public.investments
         set profit_earned = round(v_inv.expected_profit * v_progress, 2)
       where id = v_inv.id;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'processed', v_processed, 'completed', v_completed);
end;
$$;

REVOKE ALL ON FUNCTION public.process_investment_maturity() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_investment_maturity() TO service_role;