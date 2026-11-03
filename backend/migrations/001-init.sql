CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer'
    CHECK (role IN ('buyer', 'staff', 'manager', 'admin')),
  active INTEGER NOT NULL DEFAULT 1
    CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  jti TEXT NOT NULL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
  slug TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT NOT NULL PRIMARY KEY,
  category_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (typeof(price) = 'integer' AND price >= 0),
  original_price INTEGER CHECK (
    original_price IS NULL OR (typeof(original_price) = 'integer' AND original_price >= 0)
  ),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (typeof(stock) = 'integer' AND stock >= 0),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  on_sale INTEGER NOT NULL DEFAULT 0 CHECK (on_sale IN (0, 1)),
  catalog_position INTEGER NOT NULL DEFAULT 0 CHECK (catalog_position >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_slug) REFERENCES categories(slug)
);

CREATE TABLE product_specs (
  product_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (product_id, position),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  buyer_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
  client_request_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  buyer_contact TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal INTEGER NOT NULL CHECK (typeof(subtotal) = 'integer' AND subtotal >= 0),
  shipping INTEGER NOT NULL DEFAULT 0 CHECK (typeof(shipping) = 'integer' AND shipping >= 0),
  total INTEGER NOT NULL CHECK (typeof(total) = 'integer' AND total >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (buyer_id, client_request_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE order_lines (
  order_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (typeof(unit_price) = 'integer' AND unit_price >= 0),
  qty INTEGER NOT NULL CHECK (typeof(qty) = 'integer' AND qty > 0),
  amount INTEGER NOT NULL CHECK (typeof(amount) = 'integer' AND amount >= 0),
  UNIQUE (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  buyer_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (typeof(rating) = 'integer' AND rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '',
  -- Mengikuti state ulasan pada frontend yang sudah ada.
  state TEXT NOT NULL DEFAULT 'public' CHECK (state IN ('public', 'hidden')),
  seller_comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, product_id, buyer_id),
  FOREIGN KEY (order_id, product_id) REFERENCES order_lines(order_id, product_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  delta INTEGER NOT NULL CHECK (typeof(delta) = 'integer'),
  reason TEXT NOT NULL,
  order_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (actor_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
