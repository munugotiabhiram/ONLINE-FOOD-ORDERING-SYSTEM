const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticate, requireAdmin);

// GET /api/admin/stats - Overview Metrics and Analytics
router.get('/stats', async (req, res) => {
  try {
    const customerCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`);
    const orderCount = await db.get(`SELECT COUNT(*) as count FROM orders`);
    const revenueSum = await db.get(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE order_status != 'Cancelled'`);
    const foodItemCount = await db.get(`SELECT COUNT(*) as count FROM food_items WHERE is_available = 1`);

    // Orders by status
    const statusRows = await db.all(`
      SELECT order_status, COUNT(*) as count
      FROM orders
      GROUP BY order_status
    `);
    const statusBreakdown = {
      Pending: 0,
      Preparing: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Cancelled: 0
    };
    statusRows.forEach(r => { statusBreakdown[r.order_status] = r.count; });

    // Category distribution
    const categoryStats = await db.all(`
      SELECT c.name, COUNT(f.id) as count
      FROM categories c
      LEFT JOIN food_items f ON c.id = f.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    // Recent 5 orders
    const recentOrders = await db.all(`
      SELECT id, order_code, customer_name, total, payment_method, order_status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalCustomers: customerCount.count || 0,
        totalOrders: orderCount.count || 0,
        totalRevenue: parseFloat(parseFloat(revenueSum.total || 0).toFixed(2)),
        availableFoodItems: foodItemCount.count || 0,
        statusBreakdown,
        categoryStats,
        recentOrders
      }
    });
  } catch (err) {
    console.error('[Admin Stats Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate admin stats.' });
  }
});

// GET /api/admin/orders - All Orders
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT * FROM orders`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE order_status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY id DESC`;

    const orders = await db.all(sql, params);

    // Attach items
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        return {
          ...order,
          items
        };
      })
    );

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) {
    console.error('[Admin Orders Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin orders.' });
  }
});

// PUT /api/admin/orders/:id/status - Update Order Status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Allowed: ' + allowed.join(', ') });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    await db.run('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);

    res.json({
      success: true,
      message: `Order #${order.order_code} status updated to "${status}".`,
      orderId: req.params.id,
      newStatus: status
    });
  } catch (err) {
    console.error('[Admin Order Status Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// GET /api/admin/food - All Food Items for Admin
router.get('/food', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT f.*, c.name as category_name, r.name as restaurant_name
      FROM food_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      ORDER BY f.id DESC
    `);
    res.json({ success: true, foodItems: items });
  } catch (err) {
    console.error('[Admin Food Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch food items.' });
  }
});

// POST /api/admin/food - Add New Food Item
router.post('/food', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      restaurant_id = 1,
      rating = 4.5,
      prep_time = '20-25 min',
      is_veg = 0,
      is_featured = 0,
      is_recommended = 0,
      is_available = 1,
      image_url,
      badge = 'New'
    } = req.body;

    if (!name || !price || !category_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and image URL are required.'
      });
    }

    const result = await db.run(`
      INSERT INTO food_items (
        category_id, restaurant_id, name, description, price, rating,
        prep_time, is_veg, is_featured, is_recommended, is_available, image_url, badge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category_id,
      restaurant_id,
      name,
      description || '',
      parseFloat(price),
      parseFloat(rating),
      prep_time,
      is_veg ? 1 : 0,
      is_featured ? 1 : 0,
      is_recommended ? 1 : 0,
      is_available ? 1 : 0,
      image_url,
      badge || null
    ]);

    const created = await db.get('SELECT * FROM food_items WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: `Dish "${name}" created successfully!`,
      foodItem: created
    });
  } catch (err) {
    console.error('[Admin Create Food Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to create food item: ' + err.message });
  }
});

// PUT /api/admin/food/:id - Update Food Item
router.put('/food/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      rating,
      prep_time,
      is_veg,
      is_featured,
      is_recommended,
      is_available,
      image_url,
      badge
    } = req.body;

    const existing = await db.get('SELECT * FROM food_items WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    await db.run(`
      UPDATE food_items SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = COALESCE(?, category_id),
        rating = COALESCE(?, rating),
        prep_time = COALESCE(?, prep_time),
        is_veg = COALESCE(?, is_veg),
        is_featured = COALESCE(?, is_featured),
        is_recommended = COALESCE(?, is_recommended),
        is_available = COALESCE(?, is_available),
        image_url = COALESCE(?, image_url),
        badge = COALESCE(?, badge)
      WHERE id = ?
    `, [
      name || null,
      description !== undefined ? description : null,
      price ? parseFloat(price) : null,
      category_id ? parseInt(category_id, 10) : null,
      rating ? parseFloat(rating) : null,
      prep_time || null,
      is_veg !== undefined ? (is_veg ? 1 : 0) : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_recommended !== undefined ? (is_recommended ? 1 : 0) : null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      image_url || null,
      badge !== undefined ? badge : null,
      req.params.id
    ]);

    const updated = await db.get('SELECT * FROM food_items WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: `Dish "${updated.name}" updated successfully.`,
      foodItem: updated
    });
  } catch (err) {
    console.error('[Admin Update Food Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update food item.' });
  }
});

// DELETE /api/admin/food/:id - Delete Food Item
router.delete('/food/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM food_items WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    await db.run('DELETE FROM food_items WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: `Dish "${existing.name}" deleted from menu.`
    });
  } catch (err) {
    console.error('[Admin Delete Food Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete food item.' });
  }
});

// GET /api/admin/customers - Customers List
router.get('/customers', async (req, res) => {
  try {
    const customers = await db.all(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.phone, u.address, u.auth_provider, u.created_at,
             COUNT(o.id) as orders_count,
             COALESCE(SUM(o.total), 0) as total_spend
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.order_status != 'Cancelled'
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json({ success: true, customers });
  } catch (err) {
    console.error('[Admin Customers Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
});

module.exports = router;
