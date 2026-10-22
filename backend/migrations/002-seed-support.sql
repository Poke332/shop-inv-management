-- Simpan field katalog yang dipakai React; jangan mengubah migration 001 yang sudah applied.
ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5
  CHECK (typeof(low_stock_threshold) = 'integer' AND low_stock_threshold >= 0);

-- Seed hanya sekali: rerun tidak mengembalikan stok/password/status yang telah diedit.
CREATE TABLE seed_runs (
  name TEXT NOT NULL PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
