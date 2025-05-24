import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Create session middleware
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "lawcasepro-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Create or update a user in the database
export async function upsertUser(userProfile: any) {
  try {
    return await storage.upsertUser({
      id: userProfile.id.toString(),
      email: userProfile.email,
      firstName: userProfile.first_name || userProfile.name || "",
      lastName: userProfile.last_name || "",
      profileImageUrl: userProfile.profile_image || "",
    });
  } catch (error) {
    console.error("Failed to upsert user:", error);
    throw error;
  }
}

// A simple implementation for demo purposes
// In a real app, you'd use a complete OAuth2 flow
function generateMockUserProfile(username: string) {
  const userId = Math.floor(Math.random() * 1000000).toString();
  return {
    id: userId,
    email: `${username}@example.com`,
    first_name: username,
    last_name: "User",
    name: username,
    profile_image: `https://ui-avatars.com/api/?name=${username}&background=random`,
  };
}

// Set up authentication
export async function setupAuth(app: Express) {
  // Set up session middleware
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple login handler for development
  app.get('/api/login', (req, res) => {
    // For demo purposes, we generate a mock user
    const demoUser = generateMockUserProfile("Demo");
    req.login(demoUser, async (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect('/login?error=true');
      }
      
      try {
        // Create or update user in database
        await upsertUser(demoUser);
        return res.redirect('/');
      } catch (error) {
        console.error("User creation error:", error);
        return res.redirect('/login?error=true');
      }
    });
  });

  // Simple logout handler
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect('/login');
    });
  });

  // User API endpoint
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      return res.json(req.user);
    }
    return res.status(401).json({ message: "Unauthorized" });
  });

  // Configure passport serialization
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  console.log("Authentication setup completed successfully");
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};