import pg from 'pg';
import { applicationConfig } from './config.js';

const { Pool } = pg;

const isLocalOrDocker = applicationConfig.databaseUrl && (
  applicationConfig.databaseUrl.includes('localhost') || 
  applicationConfig.databaseUrl.includes('127.0.0.1') || 
  applicationConfig.databaseUrl.includes('@db:')
);

// ตั้งค่า Database Connection Pool เพื่อใช้ Connection ซ้ำและจัดการทรัพยากรฐานข้อมูลอย่างมีประสิทธิภาพ
export const databasePool = new Pool({
  connectionString: applicationConfig.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isLocalOrDocker ? false : { rejectUnauthorized: false }
});

// จัดการ Error ระดับ Global ของ Pool ป้องกันแอปพลิเคชัน Crash แบบเงียบๆ
databasePool.on('error', (databaseError) => {
  console.error('Unexpected error on idle PostgreSQL client:', databaseError);
});

// Helper สำหรับคิวรีผ่าน Parameter (Parameterized Query) เพื่อป้องกัน SQL Injection
export const executeQuery = (sqlText, sqlParams) => databasePool.query(sqlText, sqlParams);
export const getDatabaseClient = () => databasePool.connect();
