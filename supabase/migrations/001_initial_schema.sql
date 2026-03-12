-- ─── Extension ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── stores ───────────────────────────────────────────────────────────────────
CREATE TABLE stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naam       TEXT NOT NULL,
  adres      TEXT,
  aktief     BOOLEAN NOT NULL DEFAULT TRUE,
  aangemaakt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── employees ────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id  UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  naam      TEXT NOT NULL,
  initialen TEXT NOT NULL,
  kleur     TEXT NOT NULL DEFAULT '#3B82F6',
  rol       TEXT NOT NULL DEFAULT 'medewerker' CHECK (rol IN ('admin', 'medewerker')),
  aktief    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── products ─────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  naam       TEXT NOT NULL,
  prijs      DECIMAL(10,4) NOT NULL,
  categorie  TEXT NOT NULL DEFAULT 'Overig',
  prijs_type TEXT NOT NULL DEFAULT 'stuk' CHECK (prijs_type IN ('stuk', 'kg')),
  btw        INTEGER NOT NULL DEFAULT 9 CHECK (btw IN (0, 9, 21)),
  kleur      TEXT,
  aktief     BOOLEAN NOT NULL DEFAULT TRUE,
  bijgewerkt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── categories ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  naam     TEXT NOT NULL,
  kleur    TEXT NOT NULL DEFAULT '#F3F4F6',
  volgorde INTEGER NOT NULL DEFAULT 0
);

-- ─── discounts ────────────────────────────────────────────────────────────────
CREATE TABLE discounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  naam          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('stapel', 'gratis', 'percentage')),
  aantal_voor   INTEGER,
  prijs_voor    DECIMAL(10,4),
  koop_aantal   INTEGER,
  gratis_aantal INTEGER,
  percentage    DECIMAL(5,2),
  product_ids   UUID[] NOT NULL DEFAULT '{}',
  van_datum     DATE,
  tot_datum     DATE,
  actief        BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── carts ────────────────────────────────────────────────────────────────────
CREATE TABLE carts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  aangemaakt  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bijgewerkt  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active cart per employee per store
CREATE UNIQUE INDEX carts_active_unique ON carts (store_id, employee_id)
  WHERE status = 'active';

-- ─── cart_items ───────────────────────────────────────────────────────────────
CREATE TABLE cart_items (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id            UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id         UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_naam       TEXT NOT NULL,
  product_prijs      DECIMAL(10,4) NOT NULL,
  product_prijs_type TEXT NOT NULL DEFAULT 'stuk',
  aantal             DECIMAL(10,3) NOT NULL DEFAULT 1,
  bijgewerkt         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_cart_product_unique UNIQUE (cart_id, product_id)
);

-- ─── transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee_id             UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_naam           TEXT,
  totaal                  DECIMAL(10,2) NOT NULL,
  btw                     DECIMAL(10,2) NOT NULL DEFAULT 0,
  betaalmethode           TEXT NOT NULL CHECK (betaalmethode IN ('contant', 'pin', 'cadeaubon', 'gesplitst')),
  betaald_cents           INTEGER,
  wisselgeld_cents        INTEGER,
  is_terugboeking         BOOLEAN NOT NULL DEFAULT FALSE,
  origineel_transactie_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  is_terug_geboekt        BOOLEAN NOT NULL DEFAULT FALSE,
  tijdstip                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── transaction_lines ────────────────────────────────────────────────────────
CREATE TABLE transaction_lines (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  naam           TEXT NOT NULL,
  categorie      TEXT NOT NULL DEFAULT 'Overig',
  aantal         DECIMAL(10,3) NOT NULL,
  prijs          DECIMAL(10,4) NOT NULL
);

-- ─── store_settings ───────────────────────────────────────────────────────────
CREATE TABLE store_settings (
  store_id      UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  bedrijfsnaam  TEXT NOT NULL DEFAULT 'Mijn POS',
  adres         TEXT NOT NULL DEFAULT '',
  postcode      TEXT NOT NULL DEFAULT '',
  plaats        TEXT NOT NULL DEFAULT '',
  telefoon      TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  btw_nummer    TEXT NOT NULL DEFAULT '',
  kvk_nummer    TEXT NOT NULL DEFAULT '',
  logo_url      TEXT,
  bon_header    TEXT NOT NULL DEFAULT '',
  bon_footer    TEXT NOT NULL DEFAULT 'Bedankt voor uw bezoek!',
  bon_qr_url    TEXT NOT NULL DEFAULT '',
  btw_standaard INTEGER NOT NULL DEFAULT 9 CHECK (btw_standaard IN (9, 21)),
  dark_mode     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Permissive policies — tighten with proper auth later
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON stores           FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON employees        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON products         FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON categories       FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON discounts        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON carts            FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON cart_items       FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON transactions     FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON transaction_lines FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all" ON store_settings   FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE discounts;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
