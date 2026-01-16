// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');

const app = express();

// --- Basic middleware (order matters) ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// minimal session (passport may need it)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true in production when using HTTPS
}));

// passport init (after session/cookie middleware)
app.use(passport.initialize());
app.use(passport.session());

// load passport strategies (ensure this file exists)
try {
  require('./config/passport')(passport);
} catch (err) {
  console.warn('Warning: passport config failed to load:', err?.message || err);
}

// --- Serve static uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes (mount after passport initialized) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// --- MongoDB connection ---
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/airbnb-clone';
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err.message || err));

// --- Health check ---
app.get('/', (req, res) => res.send('Server running'));

// --- Error handling middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// --- 404 handler (put last) ---
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
