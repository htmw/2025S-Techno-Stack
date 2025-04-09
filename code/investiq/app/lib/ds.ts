// lib/db.ts
import { Pool } from 'pg';

// Create a singleton database connection pool
const globalPool = global as unknown as { pool: Pool | undefined };

if (!globalPool.pool) {
  globalPool.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
    max: 20, // Maximum connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = globalPool.pool;

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log({
      query: text,
      params,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Wrapper for transactions
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}