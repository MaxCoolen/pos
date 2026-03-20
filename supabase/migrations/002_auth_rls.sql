-- Migration 002: Auth + Row-Level Security
-- Run this in the Supabase SQL Editor after enabling Authentication.
-- Also disable "Confirm email" in Dashboard → Auth → Settings for easier testing.

-- ─── 1. Add owner_id to stores ───────────────────────────────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- ─── 2. Helper: does the current user own a given store? ─────────────────────
CREATE OR REPLACE FUNCTION user_owns_store(sid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores WHERE id = sid AND owner_id = auth.uid()
  )
$$;

-- ─── 3. Stores: replace permissive policy with owner-scoped policy ────────────
DROP POLICY IF EXISTS "allow_all"    ON stores;
DROP POLICY IF EXISTS "owner_stores" ON stores;
CREATE POLICY "owner_stores" ON stores FOR ALL
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ─── 4. Employees ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON employees;
DROP POLICY IF EXISTS "owner_access" ON employees;
CREATE POLICY "owner_access" ON employees FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 5. Products ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON products;
DROP POLICY IF EXISTS "owner_access" ON products;
CREATE POLICY "owner_access" ON products FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 6. Categories ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON categories;
DROP POLICY IF EXISTS "owner_access" ON categories;
CREATE POLICY "owner_access" ON categories FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 7. Discounts ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON discounts;
DROP POLICY IF EXISTS "owner_access" ON discounts;
CREATE POLICY "owner_access" ON discounts FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 8. Transactions ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON transactions;
DROP POLICY IF EXISTS "owner_access" ON transactions;
CREATE POLICY "owner_access" ON transactions FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 9. Transaction lines (via transactions → store) ──────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON transaction_lines;
DROP POLICY IF EXISTS "owner_access" ON transaction_lines;
CREATE POLICY "owner_access" ON transaction_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN stores s ON s.id = t.store_id
      WHERE t.id = transaction_lines.transaction_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN stores s ON s.id = t.store_id
      WHERE t.id = transaction_lines.transaction_id
        AND s.owner_id = auth.uid()
    )
  );

-- ─── 10. Carts ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON carts;
DROP POLICY IF EXISTS "owner_access" ON carts;
CREATE POLICY "owner_access" ON carts FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));

-- ─── 11. Cart items (via carts → store) ──────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON cart_items;
DROP POLICY IF EXISTS "owner_access" ON cart_items;
CREATE POLICY "owner_access" ON cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts c
      JOIN stores s ON s.id = c.store_id
      WHERE c.id = cart_items.cart_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts c
      JOIN stores s ON s.id = c.store_id
      WHERE c.id = cart_items.cart_id
        AND s.owner_id = auth.uid()
    )
  );

-- ─── 12. Store settings ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all"    ON store_settings;
DROP POLICY IF EXISTS "owner_access" ON store_settings;
CREATE POLICY "owner_access" ON store_settings FOR ALL
  USING  (user_owns_store(store_id))
  WITH CHECK (user_owns_store(store_id));
