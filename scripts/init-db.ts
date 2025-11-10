import { config } from 'dotenv';
import { resolve } from 'path';
import { initDatabase } from '../lib/db';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set.');
      console.error('Please create a .env.local file with DATABASE_URL=...');
      process.exit(1);
    }

    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();

