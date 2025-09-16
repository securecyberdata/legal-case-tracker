#!/usr/bin/env node

/**
 * Backup and Migration Script for Legal Case Tracker
 * 
 * This script helps backup your existing database and migrate to Neon.
 * 
 * Usage:
 *   node scripts/backup-and-migrate.js
 *   SOURCE_DB_URL=source DATABASE_URL=target node scripts/backup-and-migrate.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Legal Case Tracker - Backup and Migration to Neon');
console.log('====================================================\n');

// Check environment variables
const sourceDbUrl = process.env.SOURCE_DB_URL;
const targetDbUrl = process.env.DATABASE_URL;

if (!targetDbUrl) {
  console.log('❌ Error: DATABASE_URL (Neon) environment variable is not set');
  console.log('\nTo migrate to Neon:');
  console.log('1. Set your Neon DATABASE_URL');
  console.log('2. Optionally set SOURCE_DB_URL for your current database');
  console.log('3. Run: DATABASE_URL="your-neon-connection-string" node scripts/backup-and-migrate.js');
  process.exit(1);
}

console.log('✅ Target Neon DATABASE_URL is set');
console.log(`📍 Neon Database: ${targetDbUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

if (sourceDbUrl) {
  console.log('✅ Source DATABASE_URL is set');
  console.log(`📍 Source Database: ${sourceDbUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);
}

try {
  // Step 1: Create schema in Neon
  console.log('🔄 Step 1: Creating schema in Neon database...');
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: targetDbUrl }
  });
  console.log('✅ Schema created successfully\n');

  // Step 2: Backup and migrate data (if source database provided)
  if (sourceDbUrl) {
    console.log('🔄 Step 2: Backing up and migrating data...');
    
    const backupFile = `backup-${Date.now()}.sql`;
    console.log(`📦 Creating backup: ${backupFile}`);
    
    try {
      // Create backup
      execSync(`pg_dump "${sourceDbUrl}" > ${backupFile}`, { stdio: 'inherit' });
      console.log('✅ Backup created successfully');
      
      // Restore to Neon
      console.log('📤 Restoring data to Neon...');
      execSync(`psql "${targetDbUrl}" < ${backupFile}`, { stdio: 'inherit' });
      console.log('✅ Data migrated successfully');
      
      // Clean up backup file
      fs.unlinkSync(backupFile);
      console.log('🧹 Backup file cleaned up');
      
    } catch (error) {
      console.log('⚠️  Data migration failed, but schema is ready');
      console.log('You can manually migrate your data later');
      if (fs.existsSync(backupFile)) {
        console.log(`📦 Backup file saved as: ${backupFile}`);
      }
    }
  } else {
    console.log('ℹ️  No source database provided - schema only migration');
    console.log('   To migrate data, set SOURCE_DB_URL and run again');
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with the Neon DATABASE_URL');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Visit http://localhost:5000');
  console.log('4. Test the application');
  
  console.log('\n📋 Database Tables Created:');
  console.log('  - users (authentication)');
  console.log('  - sessions (session storage)');
  console.log('  - cases (legal cases)');
  console.log('  - clients (client information)');
  console.log('  - hearings (court hearings)');
  console.log('  - activities (audit trail)');
  
  console.log('\n🔧 Useful commands:');
  console.log('  npm run db:studio  # View database in browser');
  console.log('  npm run db:push    # Push schema changes');
  console.log('  npm run dev        # Start development server');
  
} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your Neon DATABASE_URL is correct');
  console.log('2. Ensure your Neon database is not paused');
  console.log('3. Verify you have the correct permissions');
  console.log('4. Check your internet connection');
  console.log('5. Try running: npx drizzle-kit push --verbose');
  process.exit(1);
}

