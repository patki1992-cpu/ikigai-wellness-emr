import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
  role?: 'provider' | 'patient'
) {
  const userId = claims["sub"];
  
  // Check if user already exists
  const existingUser = await storage.getUser(userId);
  
  if (existingUser) {
    // User exists - verify the role matches what they're trying to use
    if (role && existingUser.role !== role) {
      throw new Error(`Access denied. User has role '${existingUser.role}' but attempted to login as '${role}'.`);
    }
    
    // Update user data without changing role
    const userData = {
      id: userId,
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      role: existingUser.role, // Keep existing role
      patientId: existingUser.patientId, // Keep existing patientId
    };
    
    return await storage.upsertUser(userData);
  } else {
    // New user - role assignment must be explicit, no defaults
    if (!role) {
      throw new Error('Role must be specified for new users.');
    }
    
    const userData = {
      id: userId,
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      role: role,
    };
    
    const user = await storage.upsertUser(userData);
    
    // If this is a new patient user, create a patient record
    if (role === 'patient') {
      try {
        const patient = await storage.createPatient({
          firstName: claims["first_name"],
          lastName: claims["last_name"],
          email: claims["email"],
          phone: '', // We don't have phone from OIDC claims
          dateOfBirth: '1990-01-01', // Default DOB, patient can update later
          gender: 'other', // Default gender, patient can update later
          address: '', // Default empty address
        });
        
        // Update the user with the patient ID
        return await storage.upsertUser({
          ...userData,
          patientId: patient.id,
        });
      } catch (error) {
        console.error('Error creating patient record for new patient user:', error);
        return user;
      }
    }
    
    return user;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const createVerifyFunction = (role?: 'provider' | 'patient'): VerifyFunction => async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims(), role);
      verified(null, user);
    } catch (error) {
      console.error(`Authentication failed for role ${role}:`, error);
      verified(error, false);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    // Provider strategy (default)
    const providerStrategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      createVerifyFunction('provider'),
    );
    passport.use(providerStrategy);
    
    // Patient strategy
    const patientStrategy = new Strategy(
      {
        name: `replitauth-patient:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/patient/callback`,
      },
      createVerifyFunction('patient'),
    );
    passport.use(patientStrategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  // Patient-specific login endpoints
  app.get("/api/patient/login", (req, res, next) => {
    passport.authenticate(`replitauth-patient:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/patient/callback", (req, res, next) => {
    passport.authenticate(`replitauth-patient:${req.hostname}`, {
      successReturnToOrRedirect: "/patient-dashboard",
      failureRedirect: "/api/patient/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Auth bypass for development/testing (with production guard)
  if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    if (!req.user) {
      req.user = { 
        claims: { 
          sub: 'dev-user', 
          email: 'dev@example.com',
          first_name: 'Dev',
          last_name: 'User'
        }, 
        expires_at: 1893456000 
      };
    }
    console.log('⚠️  AUTH_BYPASS is active - authentication disabled for development');
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
