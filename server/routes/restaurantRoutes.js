const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await db.all('SELECT * FROM restaurants ORDER BY rating DESC');
    res.json({ success: true, restaurants });
  } catch (err) {
    console.error('[Restaurant Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch restaurants.' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    const menu = await db.all('SELECT * FROM food_items WHERE restaurant_id = ? AND is_available = 1', [restaurant.id]);
    res.json({ success: true, restaurant, menu });
  } catch (err) {
    console.error('[Restaurant Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch restaurant menu.' });
  }
});

module.exports = router;
