const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const googleClient = config.google.clientId ? new OAuth2Client(config.google.clientId) : null;

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
      auth_provider: user.auth_provider
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

// GET /api/auth/config - Public configuration for frontend
router.get('/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: config.google.clientId || null,
    isGoogleConfigured: Boolean(config.google.clientId && config.google.clientId !== 'your_google_client_id_here.apps.googleusercontent.com'),
    demoCustomer: {
      email: config.demoUser.email,
      password: config.demoUser.password,
      name: config.demoUser.name
    },
    demoAdmin: {
      email: config.demoAdmin.email,
      password: config.demoAdmin.password,
      name: config.demoAdmin.name
    }
  });
});

// POST /api/auth/demo - Demo Account Login
router.post('/demo', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let targetEmail = email;
    if (!targetEmail) {
      targetEmail = role === 'admin' ? config.demoAdmin.email : config.demoUser.email;
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [targetEmail]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo account not found in database.' });
    }

    // If password provided, verify it (unless instant demo switch)
    if (password) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match && password !== config.demoUser.password && password !== config.demoAdmin.password) {
        return res.status(401).json({ success: false, message: 'Invalid demo credentials.' });
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url,
        phone: user.phone,
        address: user.address,
        auth_provider: user.auth_provider
      }
    });
  } catch (err) {
    console.error('[Auth Error /demo]:', err);
    res.status(500).json({ success: false, message: 'Internal server error during demo authentication.' });
  }
});

// POST /api/auth/google - Official Google OAuth 2.0 verification
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Missing Google credential token.'
      });
    }

    if (!config.google.clientId || config.google.clientId.includes('your_google_client_id_here')) {
      return res.status(400).json({
        success: false,
        message: 'Google OAuth Client ID is not configured on the server. Please set GOOGLE_CLIENT_ID in your .env file to enable official Google sign-in.'
      });
    }

    // Verify token using official Google Auth Library
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[Google Verify Error]:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Token could not be verified by Google.'
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account did not provide an email address.' });
    }

    // Check if user exists by email or google_id
    let user = await db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);

    if (!user) {
      // Create new Google customer
      const insertResult = await db.run(
        `INSERT INTO users (name, email, auth_provider, google_id, avatar_url, role)
         VALUES (?, ?, 'google', ?, ?, 'customer')`,
        [name || 'Google User', email, googleId, picture || null]
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
    } else {
      // Update existing user with Google info
      await db.run(
        `UPDATE users SET name = ?, avatar_url = ?, google_id = ?, auth_provider = 'google' WHERE id = ?`,
        [name || user.name, picture || user.avatar_url, googleId, user.id]
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Successfully authenticated with Google as ${user.name}`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url,
        phone: user.phone,
        address: user.address,
        auth_provider: 'google'
      }
    });
  } catch (err) {
    console.error('[Auth Error /google]:', err);
    res.status(500).json({ success: false, message: 'Google authentication processing error: ' + err.message });
  }
});

// GET /api/auth/me - Current User Profile & Session Check
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, role, avatar_url, phone, address, auth_provider, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url,
        phone: user.phone,
        address: user.address,
        auth_provider: user.auth_provider,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Error /me]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
