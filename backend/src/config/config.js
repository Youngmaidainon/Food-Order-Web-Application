import dotenv from 'dotenv';
dotenv.config();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ FATAL ERROR: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

// Extract variables
const portStr = process.env.PORT || '8000';
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/springroll_db';
const isProd = process.env.NODE_ENV === 'production';

// Fail fast for required variables
const jwtSecret = isProd ? requiredEnv('JWT_SECRET') : (process.env.JWT_SECRET || 'supersecretspringrollkey');

export const applicationConfig = {
  port: parseInt(portStr, 10),
  databaseUrl: dbUrl,
  jwtSecret: jwtSecret,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  discordCancelWebhookUrl: process.env.DISCORD_CANCEL_WEBHOOK_URL || '',
  discordReportWebhookUrl: process.env.DISCORD_REPORT_WEBHOOK_URL || '',
};
