-- ========================================================
-- Schema: Spring Roll Online Store (ร้านสปริงโรลออนไลน์)
-- ========================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0
);

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dressings Table
CREATE TABLE IF NOT EXISTS dressings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

-- 4. Orders Table
DO $$ BEGIN
    CREATE TYPE delivery_type_enum AS ENUM ('รับเองที่ร้าน', 'จัดส่ง');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('รอดำเนินการ', 'รับออเดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร', 'รับอาหารแล้ว', 'กำลังจัดส่ง', 'จัดส่งแล้ว', 'ยกเลิก');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_type delivery_type_enum NOT NULL,
    address TEXT,
    status order_status_enum NOT NULL DEFAULT 'รอดำเนินการ',
    total_amount DECIMAL(10, 2) NOT NULL,
    cancel_reason TEXT DEFAULT NULL,
    canceled_by TEXT DEFAULT NULL,
    discord_message_id VARCHAR(255) DEFAULT NULL,
    discord_cancel_message_id VARCHAR(255) DEFAULT NULL,
    sequence_number INT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    session_id VARCHAR(255) DEFAULT NULL,
    previous_status order_status_enum DEFAULT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    dressing_id INT REFERENCES dressings(id) ON DELETE SET NULL,
    item_notes TEXT
);

-- 6. Store Status Table
CREATE TABLE IF NOT EXISTS store_status (
    id SERIAL PRIMARY KEY,
    is_open BOOLEAN DEFAULT TRUE,
    announcement_message TEXT DEFAULT '',
    restaurant_name VARCHAR(100) DEFAULT 'ร้านสปริงโรลออนไลน์',
    current_sequence INT DEFAULT 0
);

-- 7. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id UUID PRIMARY KEY,
    admin_id INT REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 9. Cart Sessions Table
CREATE TABLE IF NOT EXISTS cart_sessions (
    session_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES cart_sessions(session_id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
    dressing_id INT REFERENCES dressings(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    item_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    discord_message_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ========================================================
-- Indexes สำหรับเพิ่มประสิทธิภาพการคิวรี่
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_last_active ON cart_sessions(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- ========================================================
-- Seed Data เริ่มต้นสำหรับทดสอบระบบ
-- ========================================================

-- Categories Seed Data
INSERT INTO categories (id, name, display_order) VALUES 
(1, 'สปริงโรล', 1),
(2, 'สปริงโรลอโวคาโด้', 2)
ON CONFLICT (id) DO NOTHING;

-- Menu Items Seed Data
INSERT INTO menu_items (id, category_id, name, description, price, image_url, is_available) VALUES
(1, 1, 'สปริงโรลแซลม่อน', 'ชิ้นพอดีกิน อีสฉ่ำ', 40.00, '🐟', true),
(2, 2, 'สปริงโรลอโวคาโด้+แซลม่อน', 'ชิ้นพอดีกิน อีสฉ่ำ', 40.00, '🐟🥑', true),
(3, 1, 'สปริงโรลกุ้ง', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🦐', true),
(4, 2, 'สปริงโรลอโวคาโด้+กุ้ง', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🦐🥑', true),
(5, 1, 'สปริงโรลอกไก่', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🐣', true),
(6, 2, 'สปริงโรลอโวคาโด้+อกไก่', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🐣🥑', true),
(7, 1, 'สปริงโรลปูอัด', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🦀', true),
(8, 2, 'สปริงโรลอโวคาโด้+ปูอัด', 'ชิ้นพอดีกิน อีสฉ่ำ', 35.00, '🦀🥑', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- Dressings Seed Data
INSERT INTO dressings (id, name, is_available) VALUES
(0, 'ไม่รับน้ำสลัด', true),
(1, 'สลัดครีม', true),
(2, 'สลัดครีมซีฟู๊ด', true),
(3, 'ซีซาร์สลัด', true),
(4, 'สลัดเทาซันไอแลนด์', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('dressings_id_seq', GREATEST((SELECT MAX(id) FROM dressings WHERE id != 0), 1));

-- Store Status Seed Data
INSERT INTO store_status (id, is_open, announcement_message, restaurant_name, current_sequence) VALUES
(1, true, 'เปิดรับออเดอร์ค่า 💖', 'ร้านสปริงโรลออนไลน์', 0)
ON CONFLICT (id) DO NOTHING;

-- Admin User Seed Data (admin / Initial password set via ADMIN_INIT_PASSWORD env var)
INSERT INTO admin_users (username, password_hash) VALUES
('admin', '$2a$10$X8X8X8X8X8X8X8X8X8X8X.0000000000000000000000000000000')
ON CONFLICT (username) DO NOTHING;
