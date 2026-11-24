const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/coupons - List active coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await db.all('SELECT * FROM coupons WHERE is_active = 1 ORDER BY discount_percent DESC');
    res.json({ success: true, coupons });
  } catch (err) {
    console.error('[Coupon Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

// POST /api/coupons/validate - Validate coupon against cart subtotal
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await db.get('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1', [code.trim()]);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const orderAmount = parseFloat(subtotal) || 0;
    if (orderAmount < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required for coupon "${coupon.code}".`
      });
    }

    // Calculate discount
    let discount = (orderAmount * coupon.discount_percent) / 100;
    if (discount > parseFloat(coupon.max_discount)) {
      discount = parseFloat(coupon.max_discount);
    }
    discount = parseFloat(discount.toFixed(2));

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You saved $${discount.toFixed(2)}`,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        discountAmount: discount,
        description: coupon.description
      }
    });
  } catch (err) {
    console.error('[Coupon Validate Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
});

module.exports = router;
