const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const db = require('./database/db');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const cartRoutes = require('./routes/cartRoutes');
const couponRoutes = require('./routes/couponRoutes');
const orderRoutes = require('./routes/orderRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: db.getDriver(),
    version: '1.0.0'
  });
});

// HTML page shortcuts
app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// Default frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

// Start Server
async function startServer() {
  try {
    await db.initDatabase();

    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 FOODVERSE 3D SERVER RUNNING ON PORT ${PORT}`);
      console.log(`🌐 Dashboard: http://localhost:${PORT}/`);
      console.log(`🔑 Login:     http://localhost:${PORT}/login.html`);
      console.log(`🛡️  Admin:     http://localhost:${PORT}/admin.html`);
      console.log(`📦 Database:  ${db.getDriver().toUpperCase()}`);
      console.log(`====================================================`);
    });

    return server;
  } catch (err) {
    console.error('Fatal error starting FoodVerse server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
