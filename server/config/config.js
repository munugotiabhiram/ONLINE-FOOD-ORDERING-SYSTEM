require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'foodverse_secret_key_2026',
  db: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodverse_db'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },
  demoUser: {
    name: 'Alex Johnson (Demo)',
    email: process.env.DEMO_USER_EMAIL || 'demo@foodverse.com',
    password: process.env.DEMO_USER_PASSWORD || 'demo123',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    address: '42 Skyline Boulevard, Apt 7B, New York, NY 10001',
    phone: '+1 (555) 349-8291'
  },
  demoAdmin: {
    name: 'Sarah Connor (Admin)',
    email: process.env.DEMO_ADMIN_EMAIL || 'admin@foodverse.com',
    password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    address: 'FoodVerse HQ, Executive Suite 10, New York, NY',
    phone: '+1 (555) 900-1122'
  }
};
