import pg from 'pg';
import { applicationConfig } from './config.js';

const { Pool } = pg;

// ตั้งค่า Database Connection Pool เพื่อใช้ Connection ซ้ำและจัดการทรัพยากรฐานข้อมูลอย่างมีประสิทธิภาพ
export const databasePool = new Pool({
  connectionString: applicationConfig.databaseUrl,
  max: 10, // จำกัดจำนวน Connection สูงสุด ป้องกันปัญหาฐานข้อมูลทำงานหนักเกินไป (DoS) และเหมาะกับ Free Tier
  idleTimeoutMillis: 30000, // ปิด Connection ที่ไม่ได้ใช้งานเกิน 30 วินาที คืนทรัพยากร
  connectionTimeoutMillis: 5000, // รอนานสุด 5 วินาทีในการเชื่อมต่อ (Fail fast)
  ssl: applicationConfig.databaseUrl && (applicationConfig.databaseUrl.includes('localhost') || applicationConfig.databaseUrl.includes('@db:')) ? false : { rejectUnauthorized: false } // เปิด SSL เมื่อรันบน Production (เช่น Neon) เพื่อความปลอดภัย (Transport Security)
});

// จัดการ Error ระดับ Global ของ Pool ป้องกันแอปพลิเคชัน Crash แบบเงียบๆ
databasePool.on('error', (databaseError) => {
  console.error('Unexpected error on idle PostgreSQL client:', databaseError);
});

// Helper สำหรับคิวรีผ่าน Parameter (Parameterized Query) เพื่อป้องกัน SQL Injection
export const executeQuery = (sqlText, sqlParams) => databasePool.query(sqlText, sqlParams);
export const getDatabaseClient = () => databasePool.connect();
