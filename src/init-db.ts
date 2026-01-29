import pool from './db';

async function initDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('Initializing database...');

    // Create settings table with JSONB column for schemaless data
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        uid UUID PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on created_at for efficient pagination
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_settings_created_at 
      ON settings(created_at DESC);
    `);

    // Create GIN index on JSONB data for efficient querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_settings_data 
      ON settings USING GIN (data);
    `);

    console.log('Database initialized successfully!');
    console.log('- Table "settings" created');
    console.log('- Indexes created for optimal performance');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default initDatabase;
