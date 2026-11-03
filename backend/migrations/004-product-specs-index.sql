-- Index the product_specs foreign key: the /api/products list route looks these
-- up one product at a time, so without this every lookup is a sequential scan
-- over the whole table on a remote database.
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs (product_id);
