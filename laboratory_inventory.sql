-- =====================================
-- Laboratory Inventory Schema v2
-- Simplified workflow
-- =====================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ENUMS
-- =========================
CREATE TYPE user_role AS ENUM (
    'SUPERADMIN',
    'ADMIN',
    'GENERAL'
);

-- =========================
-- ROOMS
-- =========================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(100),
    role user_role NOT NULL,
    room_id UUID REFERENCES rooms(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_room ON users(room_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- =========================
-- PRODUCT CATALOG
-- =========================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    low_stock_threshold INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- INVENTORY STOCK
-- =========================
CREATE TABLE inventory_stocks (
    product_id UUID PRIMARY KEY REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity >= 0),
    updated_at TIMESTAMP DEFAULT now()
);

-- =========================
-- TRANSACTIONS (REQUEST + STOCK OUT)
-- =========================
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tx_user ON inventory_transactions(user_id);
CREATE INDEX idx_tx_room ON inventory_transactions(room_id);

-- =========================
-- TRANSACTION ITEMS
-- =========================
CREATE TABLE inventory_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL 
        REFERENCES inventory_transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_tx_items_tx ON inventory_transaction_items(transaction_id);

-- =========================
-- INVENTORY MOVEMENT (AUDIT)
-- =========================
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- OUT, IN, ADJUST
    reference_transaction UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_movements_product ON inventory_movements(product_id);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT now()
);