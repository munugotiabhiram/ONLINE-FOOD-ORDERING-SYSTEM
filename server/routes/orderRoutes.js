const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/orders - Get logged-in user's orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.all(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [req.user.id]
    );

    // Fetch items for each order
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await db.all(
          `SELECT * FROM order_items WHERE order_id = ?`,
          [order.id]
        );
        return {
          ...order,
          items
        };
      })
    );

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) {
    console.error('[Order List Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve order history.' });
  }
});

// GET /api/orders/:id - Single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await db.get(
      `SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (err) {
    console.error('[Order Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
});

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      paymentMethod = 'Simulated Credit Card',
      couponCode,
      notes
    } = req.body;

    if (!deliveryAddress || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Delivery address and contact phone are required.' });
    }

    // Get current cart items for user
    const cartItems = await db.all(`
      SELECT c.id as cart_id, c.quantity, f.id as food_id, f.name, f.price, f.image_url
      FROM cart_items c
      JOIN food_items f ON c.food_item_id = f.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before checking out.' });
    }

    // Calculate totals
    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const deliveryFee = subtotal > 35 ? 0.00 : 2.99;
    let discount = 0.00;

    if (couponCode) {
      const coupon = await db.get('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1', [couponCode.trim()]);
      if (coupon && subtotal >= parseFloat(coupon.min_order_amount)) {
        discount = (subtotal * coupon.discount_percent) / 100;
        if (discount > parseFloat(coupon.max_discount)) {
          discount = parseFloat(coupon.max_discount);
        }
      }
    }

    const total = parseFloat((subtotal + deliveryFee - discount).toFixed(2));
    const orderCode = 'FD-' + Math.floor(10000 + Math.random() * 90000);

    const nameToUse = customerName || req.user.name || 'Valued Customer';
    const emailToUse = customerEmail || req.user.email || 'customer@foodverse.com';

    // Insert order
    const orderResult = await db.run(`
      INSERT INTO orders (
        order_code, user_id, customer_name, customer_email, customer_phone,
        delivery_address, subtotal, delivery_fee, discount, coupon_code, total,
        payment_method, payment_status, order_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', 'Preparing', ?)
    `, [
      orderCode,
      req.user.id,
      nameToUse,
      emailToUse,
      customerPhone,
      deliveryAddress,
      parseFloat(subtotal.toFixed(2)),
      parseFloat(deliveryFee.toFixed(2)),
      parseFloat(discount.toFixed(2)),
      couponCode || null,
      total,
      paymentMethod,
      notes || null
    ]);

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      const itemTotal = parseFloat((item.price * item.quantity).toFixed(2));
      await db.run(`
        INSERT INTO order_items (order_id, food_item_id, item_name, item_price, quantity, total_price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.food_id, item.name, item.price, item.quantity, itemTotal, item.image_url]);
    }

    // Clear cart
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    // Update user contact/address if not set
    await db.run(`
      UPDATE users SET phone = COALESCE(phone, ?), address = COALESCE(address, ?) WHERE id = ?
    `, [customerPhone, deliveryAddress, req.user.id]);

    const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Chef has started preparing your delicious food.',
      order: {
        ...createdOrder,
        items
      }
    });
  } catch (err) {
    console.error('[Order Placement Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to place order: ' + err.message });
  }
});

module.exports = router;
