const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// initialize passport strategies (expects backend/config/passport.js to export a function)
try {
  require('../config/passport')(passport);
} catch (err) {
  // If config/passport.js is missing, this will fail — see instructions below to add it.
  console.warn('Passport config not loaded. If you want Google OAuth, add backend/config/passport.js');
}

// Generate JWT token (used by local login/register flows)
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// -------------------------
// Existing local auth routes
// -------------------------

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        phone: req.user.phone,
        isHost: req.user.isHost
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number is too long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, phone, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/become-host
// @desc    Become a host
// @access  Private
router.post('/become-host', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isHost: true },
      { new: true }
    );

    res.json({
      message: 'You are now a host!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Become host error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------
// Google OAuth routes
// -------------------------

// Initiate Google OAuth flow
// Route: GET /api/auth/google
router.get('/google', (req, res, next) => {
  // start passport google auth
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google callback route
// Route: GET /api/auth/google/callback
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/auth/failure` })(req, res, next);
  },
  (req, res) => {
    // passport strategy should attach { user, token } to req.user (per config/passport)
    const result = req.user;
    if (!result) {
      return res.redirect(`${FRONTEND_URL}/auth/failure`);
    }

    const token = result.token;
    // Set HTTP-only cookie and redirect to frontend success page
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect user to frontend route that finalizes login (calls /api/auth/me)
    return res.redirect(`${FRONTEND_URL}/auth/success`);
  }
);

// optional success/failure endpoints (frontend can call these if needed)
router.get('/oauth/success', (req, res) => res.json({ message: 'OAuth success' }));
router.get('/oauth/failure', (req, res) => res.status(401).json({ message: 'OAuth failed' }));

module.exports = router;

