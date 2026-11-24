const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    // Also get item count per category
    const counts = await db.all('SELECT category_id, COUNT(*) as count FROM food_items GROUP BY category_id');
    const countMap = {};
    counts.forEach(c => { countMap[c.category_id] = c.count; });

    const enriched = categories.map(cat => ({
      ...cat,
      items_count: countMap[cat.id] || 0
    }));

    res.json({ success: true, categories: enriched });
  } catch (err) {
    console.error('[Category Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await db.get('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    const items = await db.all('SELECT * FROM food_items WHERE category_id = ? AND is_available = 1', [category.id]);
    res.json({ success: true, category, items });
  } catch (err) {
    console.error('[Category Slug Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch category details.' });
  }
});

module.exports = router;
