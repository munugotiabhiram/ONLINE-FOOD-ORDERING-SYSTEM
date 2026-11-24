const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// All cart routes require user authentication
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get('/', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT c.id as cart_id, c.quantity, f.id as food_id, f.name, f.price, f.image_url, f.is_veg, f.prep_time,
             (c.quantity * f.price) as item_total
      FROM cart_items c
      JOIN food_items f ON c.food_item_id = f.id
      WHERE c.user_id = ?
      ORDER BY c.created_at ASC
    `, [req.user.id]);

    let subtotal = 0;
    let itemCount = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.item_total);
      itemCount += item.quantity;
    });

    const deliveryFee = subtotal > 35 ? 0.00 : (subtotal > 0 ? 2.99 : 0.00);
    const total = subtotal + deliveryFee;

    res.json({
      success: true,
      items,
      itemCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
  } catch (err) {
    console.error('[Cart GET Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve cart.' });
  }
});

// POST /api/cart - Add item to cart or increment
router.post('/', async (req, res) => {
  try {
    const { foodId, quantity = 1 } = req.body;
    if (!foodId) {
      return res.status(400).json({ success: false, message: 'foodId is required.' });
    }

    const food = await db.get('SELECT * FROM food_items WHERE id = ?', [foodId]);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    const existing = await db.get('SELECT * FROM cart_items WHERE user_id = ? AND food_item_id = ?', [req.user.id, foodId]);

    if (existing) {
      const newQty = existing.quantity + parseInt(quantity, 10);
      await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      await db.run('INSERT INTO cart_items (user_id, food_item_id, quantity) VALUES (?, ?, ?)', [req.user.id, foodId, parseInt(quantity, 10)]);
    }

    res.json({ success: true, message: `Added "${food.name}" to cart!` });
  } catch (err) {
    console.error('[Cart POST Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
});

// PUT /api/cart/:id - Update quantity
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartId = req.params.id;

    if (quantity <= 0) {
      await db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    await db.run('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, cartId, req.user.id]);
    res.json({ success: true, message: 'Cart updated successfully.' });
  } catch (err) {
    console.error('[Cart PUT Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update item quantity.' });
  }
});

// DELETE /api/cart/:id - Remove item
router.delete('/:id', async (req, res) => {
  try {
    const cartId = req.params.id;
    await db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    console.error('[Cart DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete cart item.' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res) => {
  try {
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('[Cart CLEAR Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

module.exports = router;
