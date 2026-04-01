require("dotenv").config();

// Validate required environment variables at startup
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: "15m", // Short-lived access token
  jwtRefreshExpiresIn: "7d", // Refresh token lifetime
  refreshTokenMaxAgeDays: 7, // Cookie max-age in days

  // OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  },

  // Upload
  uploadPath: process.env.UPLOAD_PATH || "/uploads",
  maxFileSize: 1536 * 1024 * 1024, // 1.5GB

  // CORS
  corsOrigin: process.env.FRONTEND_URL || "https://phimtruyenhay.com",

  // Base URL
  baseUrl: process.env.BASE_URL || "http://localhost:3000",

  // Cookie
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  isProduction: (process.env.NODE_ENV || "development") === "production",
};
