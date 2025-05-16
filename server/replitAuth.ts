import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Check for required environment variables
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

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
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

// Create or update a user in the database
export async function upsertUser(profile: any) {
  try {
    return await storage.upsertUser({
      id: profile.id,
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      profileImageUrl: profile.picture,
    });
  } catch (error) {
    console.error("Failed to upsert user:", error);
    throw error;
  }
}

// Set up authentication
export async function setupAuth(app: Express) {
  // Trust proxies for secure cookies
  app.set("trust proxy", 1);
  
  // Set up session middleware
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  try {
    const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
    
    // Configure Replit OAuth2 strategy
    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: "https://replit.com/auth_with_repl_site",
          tokenURL: "https://replit.com/api/v1/oauth/token",
          clientID: process.env.REPL_ID!,
          clientSecret: "REPLIT_OAUTH_SECRET", // Not used but required by passport-oauth2
          callbackURL: `https://${domain}/api/callback`,
          state: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Get user info from the access token
            const response = await fetch("https://replit.com/api/v1/user", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!response.ok) {
              return done(new Error("Failed to fetch user profile"));
            }

            const userProfile = await response.json();
            
            // Create or update user in our database
            const user = await upsertUser({
              id: userProfile.id.toString(),
              email: userProfile.email,
              given_name: userProfile.firstName,
              family_name: userProfile.lastName,
              picture: userProfile.profileImage,
            });
            
            // Store tokens in the user session
            const sessionUser = {
              ...user,
              accessToken,
              refreshToken,
              expiresAt: Date.now() + 3600 * 1000, // 1 hour expiry
            };
            
            return done(null, sessionUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );

    // Configure passport serialization
    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user, done) => {
      done(null, user);
    });

    // Set up routes
    app.get("/api/login", passport.authenticate("oauth2"));

    app.get(
      "/api/callback",
      passport.authenticate("oauth2", {
        successRedirect: "/",
        failureRedirect: "/login",
      })
    );

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    console.log("Authentication setup completed successfully");
  } catch (error) {
    console.error("Authentication setup failed:", error);
  }
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};