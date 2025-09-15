# Legal Case Tracker

A modern, full-stack legal case management application built with React, TypeScript, and Express, optimized for Vercel deployment.

## Features

- 📋 **Case Management**: Create, update, and track legal cases
- 👥 **Client Management**: Manage client information and relationships
- 📅 **Calendar Integration**: Schedule and track hearings
- 📊 **Dashboard**: Overview of cases, activities, and statistics
- 🔐 **Authentication**: Secure user authentication
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Vercel
- **UI Components**: Radix UI, Lucide React

## Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd legal-case-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your database URL:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/legal_case_tracker
   SESSION_SECRET=your-super-secret-session-key-here
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:5000 in your browser
   - Use test credentials: `test@test.com` / `test123`

## Vercel Deployment

### Prerequisites

- Vercel account
- PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

### Deployment Steps

1. **Set up a database**
   - Sign up for [Neon](https://neon.tech/) (recommended)
   - Create a new database
   - Copy the connection string

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Configure environment variables in Vercel**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SESSION_SECRET`: A strong random string

4. **Run database migrations**
   ```bash
   # In Vercel dashboard, go to Functions tab
   # Create a new function to run migrations
   # Or run locally with production DATABASE_URL
   npm run db:push
   ```

### Vercel Configuration

The project includes a `vercel.json` configuration file that:
- Builds the React frontend
- Routes API calls to serverless functions
- Sets up proper CORS headers
- Configures function timeouts

## Project Structure

```
├── api/                    # Vercel serverless functions
│   └── index.ts           # Main API handler
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   └── index.html
├── server/                # Express server (for local dev)
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data access layer
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and validation
├── vercel.json           # Vercel configuration
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/user` - Get current user

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/:id` - Get case by ID
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Hearings
- `GET /api/hearings` - List hearings
- `POST /api/hearings` - Create hearing
- `GET /api/hearings/:id` - Get hearing by ID
- `PUT /api/hearings/:id` - Update hearing
- `DELETE /api/hearings/:id` - Delete hearing

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/case-statuses` - Case status distribution
- `GET /api/activities` - Recent activities

## Database Schema

The application uses the following main entities:
- **Users**: User accounts and authentication
- **Cases**: Legal cases with status, priority, and dates
- **Clients**: Client information and contact details
- **Hearings**: Scheduled court hearings and appointments
- **Activities**: Audit log of user actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details