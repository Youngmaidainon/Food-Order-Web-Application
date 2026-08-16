import dotenv from 'dotenv';
dotenv.config();

// ดึงตัวแปรจาก Environment (Twelve-Factor App) ห้าม Hardcode เพื่อป้องกัน Secret Leakage
function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ FATAL ERROR: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

// ดึงและตั้งค่าตัวแปร (Environment Variables) พื้นฐาน
const portStr = process.env.PORT || '8000';
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/springroll_db';
const isProd = process.env.NODE_ENV === 'production';

// Fail fast: บังคับให้ต้องมีค่าตัวแปรสำคัญเมื่อรันโหมด Production (ป้องกันระบบทำงานผิดพลาดเมื่อ Config ไม่ครบ)
const jwtSecret = isProd ? requiredEnv('JWT_SECRET') : (process.env.JWT_SECRET || 'supersecretspringrollkey');

// ส่งออกตัวแปร Config กลางเพื่อใช้งานร่วมกันทั้งระบบ
export const applicationConfig = {
  port: parseInt(portStr, 10),
  databaseUrl: dbUrl,
  jwtSecret: jwtSecret,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  discordCancelWebhookUrl: process.env.DISCORD_CANCEL_WEBHOOK_URL || '',
  discordReportWebhookUrl: process.env.DISCORD_REPORT_WEBHOOK_URL || '',
};
