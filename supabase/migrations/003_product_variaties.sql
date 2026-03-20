-- Add variaties and extras JSONB columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variaties JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS extras    JSONB NOT NULL DEFAULT '[]';
