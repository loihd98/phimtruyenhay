const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const prisma = require("../lib/prisma");
const config = require("../config");

// Google OAuth Strategy
if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        // callbackURL must resolve via the public domain so Google can call back.
        // nginx routes /api/* → backend, so ${corsOrigin}/api/auth/google/callback works
        // in both production (https://phimtruyenhay.com) and development.
        callbackURL: `${config.corsOrigin}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleEmail = profile.emails?.[0]?.value;
          const googleAvatar = profile.photos?.[0]?.value || null;
          const googleName = profile.displayName || null;

          // Check if user already exists with Google ID
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (user) {
            // Update name and avatar in case they changed since last login
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: googleName || user.name,
                avatar: googleAvatar || user.avatar,
              },
            });
            return done(null, user);
          }

          if (!googleEmail) {
            return done(new Error("Google profile has no email"), null);
          }

          // Check if user exists with same email — link accounts
          const existingUser = await prisma.user.findUnique({
            where: { email: googleEmail },
          });

          if (existingUser) {
            // Link Google account to existing user and refresh avatar
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: profile.id,
                avatar: existingUser.avatar || googleAvatar,
              },
            });
            return done(null, user);
          }

          // Create new user from Google profile
          user = await prisma.user.create({
            data: {
              email: googleEmail,
              name: googleName,
              avatar: googleAvatar,
              googleId: profile.id,
              role: "USER",
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (config.facebook.appId && config.facebook.appSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.facebook.appId,
        clientSecret: config.facebook.appSecret,
        callbackURL: `${config.corsOrigin}/api/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const fbEmail = profile.emails?.[0]?.value || null;
          const fbAvatar = profile.photos?.[0]?.value || null;
          const fbName = profile.name
            ? `${profile.name.givenName || ""} ${profile.name.familyName || ""}`.trim()
            : profile.displayName || null;

          // Check if user already exists with Facebook ID
          let user = await prisma.user.findUnique({
            where: { facebookId: profile.id },
          });

          if (user) {
            // Update name and avatar in case they changed since last login
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: fbName || user.name,
                avatar: fbAvatar || user.avatar,
              },
            });
            return done(null, user);
          }

          // Check if user exists with same email — link accounts
          if (fbEmail) {
            const existingUser = await prisma.user.findUnique({
              where: { email: fbEmail },
            });

            if (existingUser) {
              user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  facebookId: profile.id,
                  avatar: existingUser.avatar || fbAvatar,
                },
              });
              return done(null, user);
            }
          }

          // Create new user from Facebook profile
          user = await prisma.user.create({
            data: {
              // Use email if available, else synthetic identifier (no real email needed)
              email: fbEmail || `fb_${profile.id}@phimtruyenhay.com`,
              name: fbName || `User ${profile.id}`,
              avatar: fbAvatar,
              facebookId: profile.id,
              role: "USER",
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
