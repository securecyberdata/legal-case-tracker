#!/usr/bin/env node

/**
 * Neon Database Connection Test Script
 * 
 * This script tests the connection to your Neon database and verifies functionality.
 * 
 * Usage:
 *   node scripts/test-neon-connection.js
 *   DATABASE_URL=your-neon-connection-string node scripts/test-neon-connection.js
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ path: ['env.local', '.env'] });

console.log('🧪 Legal Case Tracker - Neon Connection Test');
console.log('===========================================\n');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ Error: DATABASE_URL environment variable is not set');
  console.log('\nTo test your Neon connection:');
  console.log('DATABASE_URL="your-neon-connection-string" node scripts/test-neon-connection.js');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`📍 Testing connection to: ${databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

async function testConnection() {
  let pool;
  
  try {
    // Configure Neon for WebSocket support
    neonConfig.webSocketConstructor = ws;
    
    // Create connection pool
    console.log('🔄 Creating connection pool...');
    pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: true
    });
    
    // Test basic connection
    console.log('🔄 Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Connection established successfully');
    
    // Test query execution
    console.log('🔄 Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query executed successfully');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].postgres_version}`);
    
    // Test table existence
    console.log('🔄 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Found ${tables.length} tables in the database`);
    
    if (tables.length > 0) {
      console.log('   Tables:');
      tables.forEach(table => console.log(`     - ${table}`));
    } else {
      console.log('   ⚠️  No tables found. You may need to run the migration script.');
    }
    
    // Test specific tables for Legal Case Tracker
    const expectedTables = ['users', 'sessions', 'cases', 'clients', 'hearings', 'activities'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All expected tables are present');
    } else {
      console.log('⚠️  Missing tables:');
      missingTables.forEach(table => console.log(`     - ${table}`));
      console.log('\n   Run the migration script to create missing tables:');
      console.log('   npm run db:migrate');
    }
    
    // Test insert/select operations
    console.log('🔄 Testing insert/select operations...');
    try {
      // Test with a simple table (sessions table should exist)
      if (tables.includes('sessions')) {
        const testSid = 'test-session-' + Date.now();
        const testData = { test: true, timestamp: new Date().toISOString() };
        
        await client.query(
          'INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)',
          [testSid, JSON.stringify(testData), new Date(Date.now() + 24 * 60 * 60 * 1000)]
        );
        
        const selectResult = await client.query('SELECT * FROM sessions WHERE sid = $1', [testSid]);
        if (selectResult.rows.length > 0) {
          console.log('✅ Insert/select operations working correctly');
        }
        
        // Clean up test data
        await client.query('DELETE FROM sessions WHERE sid = $1', [testSid]);
        console.log('✅ Test data cleaned up');
      }
    } catch (error) {
      console.log('⚠️  Insert/select test failed (this is normal if tables are not set up yet)');
    }
    
    client.release();
    
    console.log('\n🎉 Connection test completed successfully!');
    console.log('\nYour Neon database is ready to use with the Legal Case Tracker.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error(`   Error: ${error.message}`);
    
    console.log('\nTroubleshooting:');
    console.log('1. Check your Neon connection string is correct');
    console.log('2. Ensure your Neon database is not paused');
    console.log('3. Verify you have the correct permissions');
    console.log('4. Check your internet connection');
    console.log('5. Make sure your connection string includes ?sslmode=require');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Network-related error detected:');
      console.log('   - Check your internet connection');
      console.log('   - Verify the Neon database URL is correct');
      console.log('   - Try accessing the Neon dashboard to ensure the database is active');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testConnection();

