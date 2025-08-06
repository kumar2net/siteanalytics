const { pool } = require('./src/config/database');

async function migrateDatabase() {
  console.log('🔄 Starting database migration...');
  
  try {
    const client = await pool.connect();
    
    // Add new columns to page_visits table
    console.log('📝 Adding new columns to page_visits table...');
    
    const alterQueries = [
      // Add event tracking columns if they don't exist
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS event_name VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS event_data JSONB",
      
      // Add geolocation columns
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS region VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)",
      
      // Add device and technology columns
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS device_type VARCHAR(50)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS browser VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS browser_version VARCHAR(50)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS operating_system VARCHAR(100)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS os_version VARCHAR(50)",
      "ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(20)"
    ];
    
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.code === '42701') { // Column already exists
          console.log(`ℹ️  Column already exists: ${query}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_page_visits_country ON page_visits(country)",
      "CREATE INDEX IF NOT EXISTS idx_page_visits_device_type ON page_visits(device_type)",
      "CREATE INDEX IF NOT EXISTS idx_page_visits_browser ON page_visits(browser)",
      "CREATE INDEX IF NOT EXISTS idx_page_visits_os ON page_visits(operating_system)"
    ];
    
    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log(`✅ Created index: ${query}`);
      } catch (error) {
        console.log(`ℹ️  Index already exists: ${query}`);
      }
    }
    
    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'page_visits' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current page_visits table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    client.release();
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateDatabase().then(() => {
  console.log('🎉 Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
}); 