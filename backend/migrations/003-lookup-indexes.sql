-- Indexes pendukung untuk lookup order, ulasan, dan sesi.
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
