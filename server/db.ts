import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

// Configure Neon for WebSocket support (required for serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a singleton pool for Vercel serverless functions
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Additional Neon-specific configuration
      ssl: true,
    });
  }
  return pool;
}

export const db = drizzle({ 
  client: getPool(), 
  schema,
  // Enable logging in development
  logger: process.env.NODE_ENV === 'development'
});