const express = require("express");
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const permissionsController = require("../controllers/permissionsController");
const { authenticateToken } = require("../middleware/auth");
const config = require("../config");

const router = express.Router();

// Guard middleware — returns 503 when OAuth credentials are not configured
function requireGoogleOAuth(req, res, next) {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(503).json({
      error: "OAuth Not Configured",
      message: "Google OAuth is not enabled on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
    });
  }
  next();
}

function requireFacebookOAuth(req, res, next) {
  if (!config.facebook.appId || !config.facebook.appSecret) {
    return res.status(503).json({
      error: "OAuth Not Configured",
      message: "Facebook OAuth is not enabled on this server. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
    });
  }
  next();
}

// Traditional auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);   // reads cookie, not body
router.post("/logout", authController.logout);     // reads cookie, clears it
router.post("/logout-all", authenticateToken, authController.logoutAll);

// Protected route to get current user
router.get("/me", authenticateToken, authController.me);

// GET /api/auth/me/permissions — get current user's permissions
router.get("/me/permissions", authenticateToken, permissionsController.getMyPermissions);

// Google OAuth routes
router.get(
  "/google",
  requireGoogleOAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  requireGoogleOAuth,
  passport.authenticate("google", {
    failureRedirect: "/api/auth/failure",
    session: false,
  }),
  authController.oauthSuccess
);

// Facebook OAuth routes
router.get(
  "/facebook",
  requireFacebookOAuth,
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

router.get(
  "/facebook/callback",
  requireFacebookOAuth,
  passport.authenticate("facebook", {
    failureRedirect: "/api/auth/failure",
    session: false,
  }),
  authController.oauthSuccess
);

// OAuth failure route
router.get("/failure", authController.oauthFailure);

module.exports = router;
