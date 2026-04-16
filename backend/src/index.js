const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const passport = require("./config/passport");
const prisma = require("./lib/prisma");
const config = require("./config");

const app = express();

// Trust first proxy (nginx) — required for express-rate-limit and real IP detection
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS — Allow all origins for production to ensure 100% no CORS issues
// Then lock down later if needed
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://phimtruyenhay.com',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.phimtruyenhay.com')) {
      callback(null, true);
    } else {
      console.log(`CORS request from: ${origin}`);
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Cookie parser — needed to read httpOnly refresh-token cookie
app.use(cookieParser());

// Passport — must be initialized before any route that uses passport.authenticate()
// No session needed; we use stateless JWT + httpOnly cookie refresh tokens.
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6000, // limit each IP to 6000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // 600 attempts per 15 minutes
  message: {
    error: "Too Many Requests",
    message: "Too many login attempts, please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);

// Body parsing - increase limit for large file uploads (audio up to 1.5GB)
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ extended: true, limit: "2gb" }));

// Serve static files (uploads)
app.use("/uploads", express.static(config.uploadPath || "/uploads"));

// Health check (accessible at /health and /api/health)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// API routes will be added here
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/chapters", require("./routes/chapters"));
app.use("/api/comments", require("./routes/comments")); // Mount back at /api/comments
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/permissions", require("./routes/permissions"));
app.use("/api/media", require("./routes/media"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/affiliate", require("./routes/affiliate"));
app.use("/api/film-reviews", require("./routes/filmReviews"));
app.use("/api/blog", require("./routes/blog"));
app.use("/api/vip", require("./routes/vip"));

// Webhook endpoints (no /api prefix — matches SePay's expected URL format)
app.use("/hooks", require("./routes/hooks"));

// Affiliate redirect (short URL)
app.use("/r", require("./routes/affiliate"));

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found on this server.",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      details: err.details || null,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      config.nodeEnv === "production" ? "Something went wrong!" : err.message,
  });
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📱 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

module.exports = app;
