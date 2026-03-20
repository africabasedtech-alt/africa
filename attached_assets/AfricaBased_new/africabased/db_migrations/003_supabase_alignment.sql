-- Migration 003: Align server.js column references with Supabase schema
-- Applied: 2026-03-09

-- users: column is 'is_locked' (not 'locked')
-- ALTER TABLE users RENAME COLUMN locked TO is_locked; -- already named is_locked in Supabase

-- investments: rename last_collected -> last_collected_at
ALTER TABLE investments RENAME COLUMN last_collected TO last_collected_at;

-- withdrawals: add missing columns
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS fee NUMERIC(14,2) DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS method VARCHAR(50);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS account_number VARCHAR(30);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS account_name VARCHAR(100);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(255);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- deposits: add missing columns
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- exchange_codes: add missing columns and rename existing
ALTER TABLE exchange_codes ADD COLUMN IF NOT EXISTS code_type VARCHAR(30) DEFAULT 'wallet';
ALTER TABLE exchange_codes ADD COLUMN IF NOT EXISTS max_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE exchange_codes ADD COLUMN IF NOT EXISTS min_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE exchange_codes ADD COLUMN IF NOT EXISTS redeemed_by JSONB DEFAULT '[]';
ALTER TABLE exchange_codes RENAME COLUMN expires_at TO expiry;
ALTER TABLE exchange_codes RENAME COLUMN assigned_user TO assigned_to;

-- profiles: add created_at and statistics columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_deposited NUMERIC(14,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_withdrawn NUMERIC(14,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_investments INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_deposits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_withdrawals INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_deposit_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- testimonials table (new)
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  image TEXT DEFAULT '',
  text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- homepage tables (new)
CREATE TABLE IF NOT EXISTS homepage_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_opportunities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  price NUMERIC(14,2) DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_services (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_or_link TEXT NOT NULL,
  category VARCHAR(100),
  min_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
