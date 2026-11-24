const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, avatar_url, phone, address, role, auth_provider, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get order stats for profile
    const orderStats = await db.get(
      'SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent FROM orders WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      profile: {
        ...user,
        totalOrders: orderStats.total_orders || 0,
        totalSpent: parseFloat(parseFloat(orderStats.total_spent || 0).toFixed(2))
      }
    });
  } catch (err) {
    console.error('[Profile GET Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// PUT /api/profile
router.put('/', async (req, res) => {
  try {
    const { name, phone, address, avatar_url } = req.body;

    await db.run(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [name || null, phone || null, address || null, avatar_url || null, req.user.id]
    );

    const updatedUser = await db.get(
      'SELECT id, name, email, avatar_url, phone, address, role, auth_provider FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('[Profile PUT Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
