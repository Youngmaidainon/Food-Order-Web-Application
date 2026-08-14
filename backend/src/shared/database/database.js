import pg from 'pg';
import { applicationConfig } from '../../config/config.js';

const { Pool } = pg;

export const databasePool = new Pool({
  connectionString: applicationConfig.databaseUrl,
  max: 10, // Limit connections for Neon free tier
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Wait 5s max to connect (handles cold starts better by failing fast or retry logic)
  ssl: applicationConfig.databaseUrl && (applicationConfig.databaseUrl.includes('localhost') || applicationConfig.databaseUrl.includes('@db:')) ? false : { rejectUnauthorized: false } // Required for many serverless Postgres providers like Neon, but breaks local Docker
});

databasePool.on('error', (databaseError) => {
  console.error('Unexpected error on idle PostgreSQL client:', databaseError);
});

export const executeQuery = (sqlText, sqlParams) => databasePool.query(sqlText, sqlParams);
export const getDatabaseClient = () => databasePool.connect();
