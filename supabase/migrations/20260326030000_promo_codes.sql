-- Promo codes table for discount codes at checkout
CREATE TABLE IF NOT EXISTS promo_codes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text        UNIQUE NOT NULL,
  description  text,
  discount_pct numeric,          -- e.g. 15 = 15% off (null if flat discount)
  discount_flat numeric,         -- e.g. 10 = $10 off (null if pct discount)
  currency     text,             -- 'USD' or 'EGP' — null means any currency
  max_uses     int,              -- null = unlimited
  uses_count   int        NOT NULL DEFAULT 0,
  expires_at   timestamptz,      -- null = never expires
  active       boolean    NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Seed a sample 10% off code for testing
INSERT INTO promo_codes (code, description, discount_pct, active)
VALUES ('WELCOME10', '10% off for new students', 10, true)
ON CONFLICT (code) DO NOTHING;

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can read active codes (needed to validate at checkout)
CREATE POLICY "Public can read active promo codes"
  ON promo_codes FOR SELECT
  USING (active = true);

-- Authenticated (admin) can do everything
CREATE POLICY "Admin can manage promo codes"
  ON promo_codes FOR ALL
  USING (auth.role() = 'authenticated');
