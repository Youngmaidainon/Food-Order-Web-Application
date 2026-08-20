import dotenv from 'dotenv';
dotenv.config();

// ดึงและตั้งค่าตัวแปร (Environment Variables) พื้นฐาน
const portStr = process.env.PORT || '8000';
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/springroll_db';

// ส่งออกตัวแปร Config กลางเพื่อใช้งานร่วมกันทั้งระบบ
export const applicationConfig = {
  port: parseInt(portStr, 10),
  databaseUrl: dbUrl,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  discordCancelWebhookUrl: process.env.DISCORD_CANCEL_WEBHOOK_URL || '',
  discordReportWebhookUrl: process.env.DISCORD_REPORT_WEBHOOK_URL || '',
};
