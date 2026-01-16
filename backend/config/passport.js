// backend/config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path if needed

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function findOrCreateUser(profile, provider = 'google') {
  const email = profile.emails?.[0]?.value;
  let user = null;

  if (email) user = await User.findOne({ email });
  if (!user) user = await User.findOne({ [`auth.${provider}.id`]: profile.id });

  if (!user) {
    user = new User({
      name: profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`),
      email: email || `${provider}_${profile.id}@noemail.local`,
      auth: {
        [provider]: {
          id: profile.id,
          raw: profile._json
        }
      }
    });
    await user.save();
  } else {
    user.auth = user.auth || {};
    user.auth[provider] = user.auth[provider] || { id: profile.id, raw: profile._json };
    await user.save();
  }

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

module.exports = function(passport) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('GOOGLE_CLIENT_ID/SECRET not set — Google OAuth will fail until you add them to .env');
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await findOrCreateUser(profile, 'google');
      // pass result (contains both user and token) forward
      done(null, result);
    } catch (err) {
      done(err);
    }
  }));

  // minimal serialize/deserialize (we're using JWT; sessions optional)
  passport.serializeUser((data, done) => done(null, data.user?._id || null));
  passport.deserializeUser((id, done) => done(null, id));
};
