# Legal Case Tracker - Vercel Deployment Guide

## 🚀 Quick Setup for Vercel + Neon Database

### Step 1: Set Up Neon Database (PostgreSQL)

1. **Sign up at [Neon](https://neon.tech/)**
   - Go to https://neon.tech/
   - Click "Sign Up" and create an account
   - Choose the free tier (3GB storage, 10GB transfer)

2. **Create a New Project**
   - Click "Create Project"
   - Choose a project name: `legal-case-tracker`
   - Select a region close to your users
   - Click "Create Project"

3. **Get Your Connection String**
   - In your Neon dashboard, go to "Connection Details"
   - Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/legal_case_tracker?sslmode=require
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
   - Click "New Project"
   - Import from GitHub: `securecyberdata/legal-case-tracker`

2. **Configure Project Settings**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

3. **Add Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add these variables:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `DATABASE_URL` | Your Neon connection string | Production, Preview, Development |
   | `SESSION_SECRET` | A strong random string (32+ characters) | Production, Preview, Development |

   **Example SESSION_SECRET**: `your-super-secret-session-key-here-make-it-very-long-and-random`

### Step 3: Run Database Migrations

After deployment, you need to set up the database schema:

1. **Option A: Run locally with production DATABASE_URL**
   ```bash
   # Set your Neon DATABASE_URL
   export DATABASE_URL="your-neon-connection-string"
   
   # Run migrations
   npm run db:push
   ```

2. **Option B: Use Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link to your project
   vercel link
   
   # Run migrations in production
   vercel env pull .env.local
   npm run db:push
   ```

### Step 4: Test Your Deployment

1. **Visit your Vercel URL**
   - Go to your deployed app (e.g., `https://your-app.vercel.app`)

2. **Test Login**
   - Email: `test@test.com`
   - Password: `test123`

3. **Verify Features**
   - Create a case
   - Add a client
   - Schedule a hearing
   - Check dashboard

## 🔧 Troubleshooting

### Common Issues

1. **"Login Failed" Error**
   - Check Vercel logs for API errors
   - Verify DATABASE_URL is set correctly
   - Ensure database migrations ran successfully

2. **"Database Connection Error"**
   - Verify your Neon connection string
   - Check if the database is active (not paused)
   - Ensure SSL mode is enabled (`sslmode=require`)

3. **"Build Failed" Error**
   - Check TypeScript errors in Vercel logs
   - Ensure all dependencies are installed
   - Verify build command is correct

### Environment Variables Checklist

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `SESSION_SECRET` - Strong random string for session security
- [ ] `NODE_ENV` - Automatically set to "production" by Vercel

## 📊 Database Schema

The application uses these main tables:
- `users` - User accounts and authentication
- `cases` - Legal cases with status, priority, and dates
- `clients` - Client information and contact details
- `hearings` - Scheduled court hearings and appointments
- `activities` - Audit log of user actions

## 🎯 Production Checklist

- [ ] Neon database created and connected
- [ ] Environment variables set in Vercel
- [ ] Database migrations completed
- [ ] Login functionality tested
- [ ] All CRUD operations working
- [ ] Dashboard displaying correctly
- [ ] Mobile responsiveness verified

## 🚀 Next Steps

1. **Custom Domain** (Optional)
   - Add your custom domain in Vercel settings
   - Update DNS records as instructed

2. **Monitoring** (Recommended)
   - Set up Vercel Analytics
   - Monitor database usage in Neon dashboard
   - Set up error tracking (Sentry, etc.)

3. **Backup Strategy**
   - Neon provides automatic backups
   - Consider additional backup solutions for critical data

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Neon database logs
3. Verify environment variables
4. Test API endpoints directly

Your Legal Case Tracker is now ready for production! 🎉
