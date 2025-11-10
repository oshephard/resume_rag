import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function initDatabase() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS vector`);
  } catch (error: any) {
    if (error.message?.includes('extension "vector" is not available')) {
      // Try to get more diagnostic information
      let diagnosticInfo = '';
      try {
        const versionResult = await query(`SELECT version()`);
        const sharedLibsResult = await query(`
          SELECT name, setting FROM pg_settings 
          WHERE name IN ('sharedir', 'dynamic_library_path')
        `);
        diagnosticInfo = `\n\nPostgreSQL version: ${versionResult.rows[0]?.version || 'unknown'}\n`;
        diagnosticInfo += `Shared directory: ${sharedLibsResult.rows.find((r: any) => r.name === 'sharedir')?.setting || 'unknown'}\n`;
      } catch (diagError) {
        // Ignore diagnostic errors
      }
      
      throw new Error(
        'The pgvector extension is not available in your PostgreSQL database.\n\n' +
        'Possible causes:\n' +
        '1. PostgreSQL needs to be restarted after installing pgvector\n' +
        '2. The extension files are not in the correct location\n' +
        '3. You may need to install pgvector for your specific PostgreSQL version\n\n' +
        'Try:\n' +
        '- Restart PostgreSQL: `brew services restart postgresql` (or your PostgreSQL service)\n' +
        '- Verify installation: Check that pgvector files are in PostgreSQL\'s shared directory\n' +
        '- For more help, see: https://github.com/pgvector/pgvector#installation' +
        diagnosticInfo
      );
    }
    throw error;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS embeddings (
      id SERIAL PRIMARY KEY,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      chunk_text TEXT NOT NULL,
      embedding vector(1536) NOT NULL,
      chunk_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS embeddings_document_id_idx ON embeddings(document_id)
  `);

  const indexExists = await query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'embeddings_embedding_idx'
    )
  `);

  if (!indexExists.rows[0].exists) {
    await query(`
      CREATE INDEX embeddings_embedding_idx ON embeddings 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);
  }
}

export { getPool as pool };

