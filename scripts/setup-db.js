#!/usr/bin/env node

/**
 * Database Setup Script for Legal Case Tracker
 * 
 * This script helps set up the database for both local development and production.
 * 
 * Usage:
 *   node scripts/setup-db.js
 *   DATABASE_URL=your-connection-string node scripts/setup-db.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Legal Case Tracker - Database Setup');
console.log('=====================================\n');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ Error: DATABASE_URL environment variable is not set');
  console.log('\nTo set up the database:');
  console.log('1. For local development:');
  console.log('   export DATABASE_URL="postgresql://username:password@localhost:5432/legal_case_tracker"');
  console.log('   node scripts/setup-db.js');
  console.log('\n2. For production (with Neon):');
  console.log('   export DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require"');
  console.log('   node scripts/setup-db.js');
  console.log('\n3. Or create a .env file with DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

try {
  console.log('🔄 Running database migrations...');
  
  // Run drizzle-kit push to create tables
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit http://localhost:5000');
  console.log('3. Login with test credentials:');
  console.log('   Email: test@test.com');
  console.log('   Password: test123');
  
} catch (error) {
  console.error('\n❌ Database setup failed:');
  console.error(error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your DATABASE_URL is correct');
  console.log('2. Ensure the database server is running');
  console.log('3. Verify you have the correct permissions');
  console.log('4. For Neon: Make sure the database is not paused');
  process.exit(1);
}
