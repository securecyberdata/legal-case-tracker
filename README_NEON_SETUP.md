# Neon Database Integration - Quick Start Guide

This guide will help you quickly set up your Legal Case Tracker with Neon database.

## 🚀 Quick Setup (Recommended)

Run the interactive setup script:

```bash
npm run db:setup-neon
```

This will guide you through the entire process step by step.

## 📋 Manual Setup Steps

### 1. Get Your Neon Connection String

1. Go to [https://neon.tech/](https://neon.tech/)
2. Sign up or log in
3. Create a new project
4. Copy the connection string from the dashboard

### 2. Configure Environment Variables

Create or update your `.env` file:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require
SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-random
```

### 3. Run Database Migration

```bash
npm run db:migrate
```

### 4. Test the Connection

```bash
npm run db:test
```

### 5. Start the Application

```bash
npm run dev
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup-neon` | Interactive Neon setup |
| `npm run db:migrate` | Create database schema |
| `npm run db:test` | Test database connection |
| `npm run db:studio` | View database in browser |
| `npm run db:push` | Push schema changes |
| `npm run db:backup-migrate` | Backup and migrate data |

## 📊 Database Schema

Your Neon database will include these tables:

- **users** - User authentication and profiles
- **sessions** - Session storage
- **cases** - Legal case information
- **clients** - Client information
- **hearings** - Court hearing schedules
- **activities** - Audit trail

## 🔄 Data Migration

If you have existing data to migrate:

### Option 1: Using the backup script
```bash
SOURCE_DB_URL="your-source-db-url" npm run db:backup-migrate
```

### Option 2: Manual migration
```bash
# Export from source
pg_dump -h source-host -U username -d database > backup.sql

# Import to Neon
psql "your-neon-connection-string" < backup.sql
```

## 🚀 Deployment

### For Vercel:

1. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your Neon connection string
   - `SESSION_SECRET` - A strong random string

2. Deploy:
```bash
vercel --prod
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Connection timeout**: Ensure your Neon database is not paused
2. **SSL errors**: Make sure your connection string includes `?sslmode=require`
3. **Permission errors**: Verify your database user has correct permissions

### Test Commands:

```bash
# Test connection
npm run db:test

# View database
npm run db:studio

# Check logs
npm run dev
```

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Full Migration Guide](NEON_MIGRATION_GUIDE.md)

## ✅ Verification Checklist

- [ ] Neon database created
- [ ] Connection string configured
- [ ] Database schema created
- [ ] Connection test passed
- [ ] Application starts successfully
- [ ] Can create/login users
- [ ] Can create cases and clients

## 🆘 Need Help?

1. Check the [troubleshooting section](#-troubleshooting)
2. Review the [full migration guide](NEON_MIGRATION_GUIDE.md)
3. Check the [Neon documentation](https://neon.tech/docs)
4. Verify your connection string format

---

**Ready to go?** Run `npm run db:setup-neon` to get started! 🚀

