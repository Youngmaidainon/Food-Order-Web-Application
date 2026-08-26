import pg from 'pg';
import { applicationConfig } from './config.js';

const { Pool } = pg;

const isLocalOrDocker = applicationConfig.databaseUrl && (
  applicationConfig.databaseUrl.includes('localhost') || 
  applicationConfig.databaseUrl.includes('127.0.0.1') || 
  applicationConfig.databaseUrl.includes('@db:')
);

// Database connection pool
export const databasePool = new Pool({
  connectionString: applicationConfig.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isLocalOrDocker ? false : { rejectUnauthorized: false }
});

// Global pool error handler
databasePool.on('error', (databaseError) => {
  console.error('Unexpected error on idle PostgreSQL client:', databaseError);
});

// Parameterized query helpers
export const executeQuery = (sqlText, sqlParams) => databasePool.query(sqlText, sqlParams);
export const getDatabaseClient = () => databasePool.connect();
