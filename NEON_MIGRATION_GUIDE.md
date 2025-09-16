# Neon Database Migration Guide

This guide will help you migrate your Legal Case Tracker application to use Neon database.

## Prerequisites

1. **Neon Account**: Sign up at [https://neon.tech/](https://neon.tech/)
2. **Node.js**: Ensure you have Node.js installed
3. **Existing Database**: Have your current database data ready for migration

## Step 1: Create Neon Database

1. Go to [https://neon.tech/](https://neon.tech/) and sign up/login
2. Click "Create Project"
3. Choose a project name (e.g., "legal-case-tracker")
4. Select a region closest to your users
5. Click "Create Project"
6. Once created, go to the "Connection Details" tab
7. Copy the connection string (it looks like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require`)

## Step 2: Configure Environment Variables

1. Copy your Neon connection string
2. Update the `env.local` file with your actual Neon connection string:
   ```bash
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require
   SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-random
   ```

## Step 3: Run Database Migration

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run the migration script**:
   ```bash
   npm run db:migrate
   ```
   
   Or manually:
   ```bash
   DATABASE_URL="your-neon-connection-string" node scripts/migrate-to-neon.js
   ```

3. **Verify the migration**:
   ```bash
   npm run db:studio
   ```
   This will open Drizzle Studio where you can view your database tables.

## Step 4: Migrate Existing Data (Optional)

If you have existing data to migrate, you can use the following approaches:

### Option A: Using pg_dump and psql (Recommended)

1. **Export from your current database**:
   ```bash
   pg_dump -h your-current-host -U your-username -d your-database > backup.sql
   ```

2. **Import to Neon**:
   ```bash
   psql "your-neon-connection-string" < backup.sql
   ```

### Option B: Using a migration script

Create a custom script to migrate specific data tables if needed.

## Step 5: Test the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the application**:
   - Visit `http://localhost:5000`
   - Try logging in
   - Create a test case
   - Verify data is being saved to Neon

## Step 6: Deploy to Production

### For Vercel Deployment:

1. **Add environment variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon connection string
   - Add `SESSION_SECRET` with a strong random string

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Database Schema

The following tables will be created in your Neon database:

- **users**: User authentication and profile information
- **sessions**: Session storage for user authentication
- **cases**: Legal case information
- **clients**: Client information
- **hearings**: Court hearing schedules
- **activities**: Audit trail for user actions

## Troubleshooting

### Common Issues:

1. **Connection timeout**: Ensure your Neon database is not paused
2. **SSL errors**: Make sure your connection string includes `?sslmode=require`
3. **Permission errors**: Verify your database user has the correct permissions
4. **Migration failures**: Check the console output for specific error messages

### Useful Commands:

```bash
# Check database connection
npm run db:studio

# Generate new migrations
npm run db:generate

# Push schema changes
npm run db:push

# View database in browser
npm run db:studio
```

## Benefits of Neon

- **Serverless**: No server management required
- **Auto-scaling**: Automatically scales based on usage
- **Branching**: Create database branches for development
- **Point-in-time recovery**: Restore to any point in time
- **Global availability**: Deploy close to your users

## Support

- **Neon Documentation**: [https://neon.tech/docs](https://neon.tech/docs)
- **Drizzle ORM**: [https://orm.drizzle.team](https://orm.drizzle.team)
- **Project Issues**: Check the project repository for known issues

## Next Steps

After successful migration:

1. **Monitor performance**: Use Neon's dashboard to monitor database performance
2. **Set up backups**: Configure automated backups in Neon
3. **Optimize queries**: Use Drizzle Studio to analyze query performance
4. **Scale as needed**: Neon automatically handles scaling based on your usage

