-- Catalog fields used by React; do not modify the already-applied migration 001.
ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5
  CHECK (typeof(low_stock_threshold) = 'integer' AND low_stock_threshold >= 0);

-- Seeds run once: re-running does not restore stock/password/status values that have since been edited.
CREATE TABLE seed_runs (
  name TEXT NOT NULL PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
