const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/food - List with search, category filter, veg/non-veg filter, price sorting
router.get('/', async (req, res) => {
  try {
    const { search, category, veg, sort, minPrice, maxPrice, featured, recommended } = req.query;

    let sql = `
      SELECT f.*, c.name as category_name, c.slug as category_slug, r.name as restaurant_name
      FROM food_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND (LOWER(f.name) LIKE ? OR LOWER(f.description) LIKE ? OR LOWER(r.name) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'all') {
      sql += ` AND (c.slug = ? OR c.name = ?)`;
      params.push(category, category);
    }

    if (veg !== undefined && veg !== '') {
      sql += ` AND f.is_veg = ?`;
      params.push(parseInt(veg, 10));
    }

    if (featured === 'true' || featured === '1') {
      sql += ` AND f.is_featured = 1`;
    }

    if (recommended === 'true' || recommended === '1') {
      sql += ` AND f.is_recommended = 1`;
    }

    if (minPrice) {
      sql += ` AND f.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ` AND f.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        sql += ` ORDER BY f.price ASC`;
        break;
      case 'price-desc':
        sql += ` ORDER BY f.price DESC`;
        break;
      case 'rating':
        sql += ` ORDER BY f.rating DESC`;
        break;
      case 'name':
        sql += ` ORDER BY f.name ASC`;
        break;
      default:
        sql += ` ORDER BY f.is_featured DESC, f.rating DESC, f.id ASC`;
        break;
    }

    const items = await db.all(sql, params);
    res.json({ success: true, count: items.length, foodItems: items });
  } catch (err) {
    console.error('[Food List Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch food items.' });
  }
});

// GET /api/food/featured - Highlights for hero section
router.get('/featured', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT f.*, c.name as category_name, c.slug as category_slug, r.name as restaurant_name
      FROM food_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_featured = 1 AND f.is_available = 1
      LIMIT 8
    `);
    res.json({ success: true, foodItems: items });
  } catch (err) {
    console.error('[Featured Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch featured food items.' });
  }
});

// GET /api/food/recommended - Chef recommendations
router.get('/recommended', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT f.*, c.name as category_name, c.slug as category_slug, r.name as restaurant_name
      FROM food_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_recommended = 1 AND f.is_available = 1
      ORDER BY f.rating DESC
      LIMIT 8
    `);
    res.json({ success: true, foodItems: items });
  } catch (err) {
    console.error('[Recommended Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch recommended items.' });
  }
});

// GET /api/food/:id - Single food item
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get(`
      SELECT f.*, c.name as category_name, c.slug as category_slug, r.name as restaurant_name, r.delivery_time, r.cuisine
      FROM food_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    // Get related items in same category
    const related = await db.all(`
      SELECT id, name, price, rating, image_url, badge
      FROM food_items
      WHERE category_id = ? AND id != ? AND is_available = 1
      LIMIT 4
    `, [item.category_id, item.id]);

    res.json({ success: true, foodItem: item, related });
  } catch (err) {
    console.error('[Food Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch food details.' });
  }
});

module.exports = router;
