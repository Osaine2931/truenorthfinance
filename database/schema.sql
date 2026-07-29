CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  available_balance NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_invested NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  referral_earnings NUMERIC DEFAULT 0,
  has_deposited BOOLEAN DEFAULT FALSE,
  welcome_bonus NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID,
  plan_name TEXT,
  amount NUMERIC NOT NULL,
  expected_profit NUMERIC DEFAULT 0,
  profit_earned NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
