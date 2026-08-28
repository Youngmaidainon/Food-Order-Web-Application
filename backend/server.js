import http from 'http';
import app from './src/index.js';
import { applicationConfig } from './src/config/config.js';
import { executeQuery, databasePool } from './src/config/database.js';
import { appLogger } from './src/shared/logger.js';

// Override global console methods with Pino structured logger
globalThis.console.log = (...args) => appLogger.info({ msg: args.join(' ') });
globalThis.console.error = (...args) => appLogger.error({ msg: args.join(' ') });
globalThis.console.warn = (...args) => appLogger.warn({ msg: args.join(' ') });
globalThis.console.info = (...args) => appLogger.info({ msg: args.join(' ') });
globalThis.console.debug = (...args) => appLogger.debug({ msg: args.join(' ') });

// Run DB schema migrations (non-blocking background task)
async function runDatabaseMigrations() {
  try {
    await executeQuery(`ALTER TABLE store_status ADD COLUMN IF NOT EXISTS restaurant_name VARCHAR(100) DEFAULT 'ร้านสปริงโรลออนไลน์'`);
    await executeQuery(`ALTER TABLE store_status ADD COLUMN IF NOT EXISTS hero_title VARCHAR(150) DEFAULT '🥗 เมนูเพื่อสุขภาพสดใหม่'`);
    await executeQuery(`ALTER TABLE store_status ADD COLUMN IF NOT EXISTS hero_subtitle VARCHAR(255) DEFAULT 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์'`);
    await executeQuery(`ALTER TABLE store_status ADD COLUMN IF NOT EXISTS current_sequence INT DEFAULT 0`);
    await executeQuery(`
      INSERT INTO store_status (id, is_open, announcement_message, restaurant_name, hero_title, hero_subtitle, current_sequence)
      VALUES (1, true, 'เปิดรับออเดอร์ค่า 💖', 'ร้านสปริงโรลออนไลน์', '🥗 เมนูเพื่อสุขภาพสดใหม่', 'ผักสดกรอบ สะอาด อร่อยเต็มคำ — ทำสดใหม่ทุกออเดอร์', 0)
      ON CONFLICT (id) DO NOTHING
    `);

    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(255) DEFAULT NULL`);

    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_by TEXT DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS sequence_number INT DEFAULT 0`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50) DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`);
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discord_cancel_message_id VARCHAR(255) DEFAULT NULL`);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        discord_message_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await executeQuery(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
    await executeQuery(`CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at)`);
    await executeQuery(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);

    await executeQuery(`
      INSERT INTO dressings (id, name, is_available)
      VALUES (0, 'ไม่รับน้ำสลัด', true)
      ON CONFLICT (id) DO UPDATE SET is_available = true, name = EXCLUDED.name
    `);

    await executeQuery(`SELECT setval('dressings_id_seq', GREATEST((SELECT MAX(id) FROM dressings WHERE id != 0), 1))`);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id UUID PRIMARY KEY,
        admin_id INT REFERENCES admin_users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS cart_sessions (
        session_id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        session_id UUID REFERENCES cart_sessions(session_id) ON DELETE CASCADE,
        menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
        dressing_id INT REFERENCES dressings(id) ON DELETE SET NULL,
        quantity INT NOT NULL DEFAULT 1,
        item_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const adminUsername = process.env.ADMIN_INIT_USERNAME || 'admin';
    const adminUserCheckQueryResult = await executeQuery(`SELECT password_rotated_at FROM admin_users WHERE username = $1`, [adminUsername]);
    if (adminUserCheckQueryResult.rows.length > 0) {
      const passwordRotatedAt = adminUserCheckQueryResult.rows[0].password_rotated_at;
      const initialAdminPassword = process.env.ADMIN_INIT_PASSWORD;

      if (!passwordRotatedAt && initialAdminPassword) {
        const bcryptModule = await import('bcryptjs');
        const hashedPassword = await bcryptModule.default.hash(initialAdminPassword, 12);
        await executeQuery(`
          UPDATE admin_users 
          SET password_hash = $1, password_rotated_at = NOW() 
          WHERE username = $2
        `, [hashedPassword, adminUsername]);
        appLogger.info({ msg: '🔒 Admin password successfully rotated from ADMIN_INIT_PASSWORD' });
      } else if (passwordRotatedAt && initialAdminPassword) {
        appLogger.warn({ msg: `⚠️ ADMIN_INIT_PASSWORD is set but password was already rotated on ${passwordRotatedAt}; ignoring` });
      }
    }

    appLogger.info({ msg: '✅ Database migrations applied successfully' });
  } catch (migrationError) {
    appLogger.warn({ msg: '⚠️ Migration warning (non-fatal):', error: migrationError.message });
  }
}

// Start HTTP server immediately (Non-blocking startup for Render / PaaS)
const httpServer = http.createServer(app);
const PORT = process.env.PORT || applicationConfig.port || 8000;
const HOST = '0.0.0.0';

const server = httpServer.listen(PORT, HOST, () => {
  appLogger.info({ msg: `🌯 Spring Roll Online Store Backend listening on ${HOST}:${PORT}` });
  
  // Defer migrations to next tick to ensure port binding completes first
  setImmediate(() => {
    runDatabaseMigrations().catch((migrationError) => {
      appLogger.error({ msg: 'Failed to run database migrations during startup', error: migrationError });
    });
  });
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  appLogger.info({ msg: `Received ${signal}. Shutting down gracefully...` });
  server.close(async () => {
    appLogger.info({ msg: 'HTTP server closed.' });
    try {
      await databasePool.end();
      appLogger.info({ msg: 'Database pool closed.' });
      process.exit(0);
    } catch (err) {
      appLogger.error({ msg: 'Error closing database pool', error: err });
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    appLogger.error({ msg: 'Could not close connections in time, forcefully shutting down' });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
