#!/usr/bin/env node

/**
 * Migration Script for Legal Case Tracker to Neon Database
 * 
 * This script helps migrate your existing database to Neon and set up the schema.
 * 
 * Usage:
 *   node scripts/migrate-to-neon.js
 *   DATABASE_URL=your-neon-connection-string node scripts/migrate-to-neon.js
 */

import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ path: ['env.local', '.env'] });

console.log('🚀 Legal Case Tracker - Neon Database Migration');
console.log('==============================================\n');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ Error: DATABASE_URL environment variable is not set');
  console.log('\nTo migrate to Neon:');
  console.log('1. Sign up at https://neon.tech/');
  console.log('2. Create a new project');
  console.log('3. Copy your connection string from the dashboard');
  console.log('4. Run: DATABASE_URL="your-neon-connection-string" node scripts/migrate-to-neon.js');
  console.log('\nExample:');
  console.log('DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require" node scripts/migrate-to-neon.js');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`📍 Neon Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

try {
  console.log('🔄 Creating database schema...');
  
  // Run drizzle-kit push to create tables
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });
  
  console.log('\n✅ Database migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with the Neon DATABASE_URL');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Visit http://localhost:5000');
  console.log('4. Test the application with your data');
  
  console.log('\n📋 Database Tables Created:');
  console.log('  - users (authentication)');
  console.log('  - sessions (session storage)');
  console.log('  - cases (legal cases)');
  console.log('  - clients (client information)');
  console.log('  - hearings (court hearings)');
  console.log('  - activities (audit trail)');
  
} catch (error) {
  console.error('\n❌ Database migration failed:');
  console.error(error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your Neon DATABASE_URL is correct');
  console.log('2. Ensure your Neon database is not paused');
  console.log('3. Verify you have the correct permissions');
  console.log('4. Check your internet connection');
  console.log('5. Try running: npx drizzle-kit push --verbose');
  process.exit(1);
}

