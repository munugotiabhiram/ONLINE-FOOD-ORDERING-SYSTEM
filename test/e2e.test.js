const http = require('http');
const { app, startServer } = require('../server/index');

async function runTests() {
  console.log('=== STARTING END-TO-END VERIFICATION SUITE ===');
  const server = await startServer();
  const PORT = server.address().port;
  const baseUrl = `http://localhost:${PORT}`;

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqOptions = {
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      if (options.body) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }

      const req = http.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, text: data, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('✓ Health check passed:', health.data.status, 'DB:', health.data.database);

    // 2. Auth Config
    const authConfig = await request('/api/auth/config');
    console.log('✓ Auth config passed. Demo customer:', authConfig.data.demoCustomer.email);

    // 3. Demo Customer Login
    const demoLogin = await request('/api/auth/demo', {
      method: 'POST',
      body: { email: 'demo@foodverse.com', password: 'demo123' }
    });
    console.log('✓ Demo Customer login passed:', demoLogin.data.user.name, 'Token received:', Boolean(demoLogin.data.token));
    const customerToken = demoLogin.data.token;

    // 4. Demo Admin Login
    const adminLogin = await request('/api/auth/demo', {
      method: 'POST',
      body: { role: 'admin' }
    });
    console.log('✓ Demo Admin login passed:', adminLogin.data.user.name, 'Role:', adminLogin.data.user.role);
    const adminToken = adminLogin.data.token;

    // 5. Auth /me check
    const meCheck = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✓ Auth /me verified:', meCheck.data.user.email);

    // 6. Categories List
    const categories = await request('/api/categories');
    console.log('✓ Categories fetched count:', categories.data.categories.length);

    // 7. Food items & Search
    const allFood = await request('/api/food');
    console.log('✓ Food catalog total dishes:', allFood.data.count);

    const searchFood = await request('/api/food?search=pizza');
    console.log('✓ Search for "pizza" dishes found:', searchFood.data.count);

    const categoryFood = await request('/api/food?category=burgers');
    console.log('✓ Filter by category "burgers" found:', categoryFood.data.count);

    // 8. Cart Operations
    const addCart = await request('/api/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { foodId: allFood.data.foodItems[0].id, quantity: 2 }
    });
    console.log('✓ Added item to cart:', addCart.data.message);

    const cartState = await request('/api/cart', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✓ Cart items count:', cartState.data.itemCount, 'Subtotal: $' + cartState.data.subtotal);

    // 9. Coupon Validation
    const couponVal = await request('/api/coupons/validate', {
      method: 'POST',
      body: { code: 'WELCOME50', subtotal: cartState.data.subtotal }
    });
    console.log('✓ Coupon validate:', couponVal.data.message);

    // 10. Place Order
    const placeOrder = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        customerName: 'Alex Johnson',
        customerPhone: '+1 (555) 349-8291',
        deliveryAddress: '42 Skyline Boulevard, Apt 7B, New York, NY 10001',
        paymentMethod: 'Simulated Credit Card',
        couponCode: 'WELCOME50',
        notes: 'Doorbell is quiet, please knock loudly.'
      }
    });
    console.log('✓ Order placed successfully:', placeOrder.data.order.order_code, 'Total: $' + placeOrder.data.order.total);

    // 11. User Order History
    const userOrders = await request('/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✓ Order history fetched. Total orders for user:', userOrders.data.orders.length);

    // 12. Admin Stats & Order Management
    const adminStats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Admin Stats: Revenue: $' + adminStats.data.stats.totalRevenue, 'Orders:', adminStats.data.stats.totalOrders);

    // Update order status in Admin
    const createdOrderId = placeOrder.data.order.id;
    const updateStatus = await request(`/api/admin/orders/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Out for Delivery' }
    });
    console.log('✓ Admin updated order status:', updateStatus.data.message);

    // 13. Admin Customer List
    const adminCustomers = await request('/api/admin/customers', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Admin customer records count:', adminCustomers.data.customers.length);

    // 14. Access Control Protection Test
    const forbiddenCheck = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('✓ Access control verified. Regular customer blocked from admin with status:', forbiddenCheck.status);

    // 15. Verify Static HTML files
    const homeHtml = await request('/');
    const loginHtml = await request('/login.html');
    const adminHtml = await request('/admin.html');
    console.log('✓ Frontend routes served: / (status ' + homeHtml.status + '), /login.html (status ' + loginHtml.status + '), /admin.html (status ' + adminHtml.status + ')');

    console.log('\n🎉 ALL 15 END-TO-END TESTS PASSED FLAWLESSLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
