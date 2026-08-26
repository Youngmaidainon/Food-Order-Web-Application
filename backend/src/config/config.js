import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from current directory, then fallback to root workspace .env or backend/.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const portStr = process.env.PORT || '8000';
let dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/springroll_db';

// If running locally outside Docker but DATABASE_URL points to '@db:', adapt to localhost
const isDocker = process.env.DOCKER_CONTAINER === 'true' || process.env.IS_DOCKER === 'true' || process.env.NODE_ENV === 'production';
if (!isDocker && dbUrl.includes('@db:')) {
  dbUrl = dbUrl.replace('@db:', '@localhost:');
}

// Centralized application configuration
export const applicationConfig = {
  port: parseInt(portStr, 10),
  databaseUrl: dbUrl,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  discordCancelWebhookUrl: process.env.DISCORD_CANCEL_WEBHOOK_URL || '',
  discordReportWebhookUrl: process.env.DISCORD_REPORT_WEBHOOK_URL || '',
};
