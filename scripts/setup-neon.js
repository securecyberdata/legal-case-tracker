#!/usr/bin/env node

/**
 * Neon Database Setup Script for Legal Case Tracker
 * 
 * This script provides an interactive setup for Neon database integration.
 * 
 * Usage:
 *   node scripts/setup-neon.js
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('🚀 Legal Case Tracker - Neon Database Setup');
console.log('===========================================\n');

async function setupNeon() {
  try {
    console.log('This script will help you set up Neon database for your Legal Case Tracker.\n');
    
    // Check if DATABASE_URL is already set
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is already set');
      const useExisting = await question('Do you want to use the existing DATABASE_URL? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        console.log('Using existing DATABASE_URL...\n');
      } else {
        process.env.DATABASE_URL = '';
      }
    }
    
    if (!process.env.DATABASE_URL) {
      console.log('📋 To get your Neon connection string:');
      console.log('1. Go to https://neon.tech/');
      console.log('2. Sign up or log in');
      console.log('3. Create a new project');
      console.log('4. Copy the connection string from the dashboard\n');
      
      const connectionString = await question('Enter your Neon connection string: ');
      if (!connectionString) {
        console.log('❌ No connection string provided. Exiting...');
        process.exit(1);
      }
      
      process.env.DATABASE_URL = connectionString;
    }
    
    console.log('\n🔄 Setting up database schema...');
    
    // Run drizzle-kit push
    execSync('npx drizzle-kit push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('\n✅ Database schema created successfully!');
    
    // Ask about data migration
    const hasExistingData = await question('\nDo you have existing data to migrate? (y/n): ');
    
    if (hasExistingData.toLowerCase() === 'y') {
      console.log('\n📋 Data Migration Options:');
      console.log('1. Manual migration using pg_dump/psql');
      console.log('2. Use the backup-and-migrate script');
      console.log('3. Skip for now and migrate later\n');
      
      const migrationChoice = await question('Choose an option (1-3): ');
      
      if (migrationChoice === '2') {
        const sourceDbUrl = await question('Enter your source database URL: ');
        if (sourceDbUrl) {
          console.log('\n🔄 Running backup and migration...');
          execSync(`SOURCE_DB_URL="${sourceDbUrl}" DATABASE_URL="${process.env.DATABASE_URL}" node scripts/backup-and-migrate.js`, {
            stdio: 'inherit'
          });
        }
      } else if (migrationChoice === '1') {
        console.log('\n📋 Manual Migration Steps:');
        console.log('1. Export from your current database:');
        console.log('   pg_dump -h your-host -U your-username -d your-database > backup.sql');
        console.log('2. Import to Neon:');
        console.log(`   psql "${process.env.DATABASE_URL}" < backup.sql`);
      }
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the Neon DATABASE_URL');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Visit http://localhost:5000');
    console.log('4. Test the application');
    
    console.log('\n📋 Available commands:');
    console.log('  npm run dev           # Start development server');
    console.log('  npm run db:studio     # View database in browser');
    console.log('  npm run db:push       # Push schema changes');
    console.log('  npm run db:migrate    # Run migration script');
    
    console.log('\n📚 Documentation:');
    console.log('  - Migration Guide: NEON_MIGRATION_GUIDE.md');
    console.log('  - Neon Docs: https://neon.tech/docs');
    console.log('  - Drizzle ORM: https://orm.drizzle.team');
    
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your Neon connection string');
    console.log('2. Ensure your Neon database is not paused');
    console.log('3. Verify you have the correct permissions');
    console.log('4. Check your internet connection');
  } finally {
    rl.close();
  }
}

setupNeon();

