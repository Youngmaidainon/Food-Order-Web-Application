import pg from 'pg';
import { applicationConfig } from '../../config/config.js';

const { Pool } = pg;

// ตั้งค่า Database Connection Pool ควบคุมจำนวนการเชื่อมต่อพร้อมกัน
export const databasePool = new Pool({
  connectionString: applicationConfig.databaseUrl,
  max: 10, // ป้องกันฐานข้อมูลล่มจากการเปิด Connection มากเกินไป (Anti DoS)
  idleTimeoutMillis: 30000, // ปิด Connection ว่างเพื่อคืนทรัพยากร
  connectionTimeoutMillis: 5000, // Fail fast: จำกัดเวลารอเชื่อมต่อฐานข้อมูล
  ssl: applicationConfig.databaseUrl && (applicationConfig.databaseUrl.includes('localhost') || applicationConfig.databaseUrl.includes('@db:')) ? false : { rejectUnauthorized: false } // เปิดใช้ SSL ใน Production
});

// จัดการ Global Error ของ Database Pool ป้องกัน Server Crash
databasePool.on('error', (databaseError) => {
  console.error('Unexpected error on idle PostgreSQL client:', databaseError);
});

// บังคับส่งผ่าน Parameterized Query เพื่อป้องกันช่องโหว่ SQL Injection (Security First)
export const executeQuery = (sqlText, sqlParams) => databasePool.query(sqlText, sqlParams);
export const getDatabaseClient = () => databasePool.connect();
