import type { Express, RequestHandler } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Session configuration with proper memory store
export function getSession() {
  const MemoryStoreSession = MemoryStore(session);
  
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'lax', // Allow cookie to be sent with same-site requests
    },
  });
}

// Simple authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  
  if (!session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user to request
  (req as any).user = user;
  next();
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  app.use(getSession());

  // Login route
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple validation for test credentials
      if (email === 'test@test.com' && password === 'test123') {
        const user = await storage.getUserByEmail(email);
        if (user) {
          const session = req.session as any;
          session.userId = user.id;
          
          // Ensure session is saved before responding
          session.save((err: any) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ message: "Session save failed" });
            }
            res.json({ success: true, user });
          });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    const session = req.session as any;
    session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user route
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}