const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { categories, restaurants, foodItems, coupons } = require('./seedData');

let dbDriver = null; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;

// Helpers to convert MySQL style queries to SQLite if running SQLite
function formatSqlForSqlite(sql) {
  let s = sql;
  // Replace AUTO_INCREMENT with AUTOINCREMENT
  s = s.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
  // Replace ENUM(...) with TEXT
  s = s.replace(/ENUM\([^)]+\)/gi, 'TEXT');
  // Replace INT with INTEGER
  s = s.replace(/\bINT\b/gi, 'INTEGER');
  // Replace TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP with DATETIME DEFAULT CURRENT_TIMESTAMP
  s = s.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  // Replace TIMESTAMP with DATETIME
  s = s.replace(/\bTIMESTAMP\b/gi, 'DATETIME');
  return s;
}

async function initDatabase() {
  if (config.db.type === 'mysql') {
    try {
      const mysql = require('mysql2/promise');
      // First connect without database to ensure database exists
      const tempConn = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConn.end();

      mysqlPool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      await mysqlPool.query('SELECT 1');
      dbDriver = 'mysql';
      console.log(`[Database] Connected to MySQL database "${config.db.database}" at ${config.db.host}:${config.db.port}`);
    } catch (err) {
      console.warn(`[Database] MySQL connection failed (${err.message}). Gracefully falling back to SQLite.`);
      dbDriver = 'sqlite';
    }
  } else {
    dbDriver = 'sqlite';
  }

  if (dbDriver === 'sqlite') {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'foodverse.db');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log(`[Database] Connected to SQLite database at "${dbPath}"`);
  }

  await createTables();
  await seedInitialData();
}

async function query(sql, params = []) {
  if (dbDriver === 'mysql') {
    const [rows, fields] = await mysqlPool.execute(sql, params);
    if (Array.isArray(rows)) {
      return { rows, insertId: rows.insertId, affectedRows: rows.affectedRows };
    }
    return { rows: [], insertId: rows.insertId, affectedRows: rows.affectedRows };
  } else {
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], insertId: 0, affectedRows: 0 });
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ rows: [], insertId: this.lastID, affectedRows: this.changes });
        });
      }
    });
  }
}

async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
}

async function run(sql, params = []) {
  const result = await query(sql, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
}

async function createTables() {
  if (dbDriver === 'mysql') {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        auth_provider VARCHAR(50) DEFAULT 'demo',
        google_id VARCHAR(150) NULL,
        avatar_url TEXT NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        image_url TEXT NOT NULL,
        icon_3d VARCHAR(50) DEFAULT '🍕',
        description TEXT NULL,
        display_order INT DEFAULT 0
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        cuisine VARCHAR(150) NOT NULL,
        rating DECIMAL(2,1) DEFAULT 4.5,
        delivery_time VARCHAR(50) DEFAULT '30-40 mins',
        min_order DECIMAL(10,2) DEFAULT 10.00,
        banner_url TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        address VARCHAR(255) NULL,
        is_trending BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        restaurant_id INT DEFAULT 1,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        rating DECIMAL(2,1) DEFAULT 4.5,
        reviews_count INT DEFAULT 120,
        prep_time VARCHAR(50) DEFAULT '20-25 min',
        is_veg BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_recommended BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        image_url TEXT NOT NULL,
        badge VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_percent INT NOT NULL,
        max_discount DECIMAL(10,2) DEFAULT 15.00,
        min_order_amount DECIMAL(10,2) DEFAULT 20.00,
        is_active BOOLEAN DEFAULT TRUE,
        description VARCHAR(255) NOT NULL
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_email VARCHAR(191) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        delivery_address TEXT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 2.99,
        discount DECIMAL(10,2) DEFAULT 0.00,
        coupon_code VARCHAR(50) NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Simulated Card',
        payment_status VARCHAR(50) DEFAULT 'Paid',
        order_status ENUM('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        food_item_id INT NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        item_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        image_url TEXT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        food_item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
      );
    `);
  } else {
    // SQLite Tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        auth_provider TEXT DEFAULT 'demo',
        google_id TEXT,
        avatar_url TEXT,
        phone TEXT,
        address TEXT,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        image_url TEXT NOT NULL,
        icon_3d TEXT DEFAULT '🍕',
        description TEXT,
        display_order INTEGER DEFAULT 0
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        rating REAL DEFAULT 4.5,
        delivery_time TEXT DEFAULT '30-40 mins',
        min_order REAL DEFAULT 10.00,
        banner_url TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        address TEXT,
        is_trending INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        restaurant_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        rating REAL DEFAULT 4.5,
        reviews_count INTEGER DEFAULT 120,
        prep_time TEXT DEFAULT '20-25 min',
        is_veg INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        is_recommended INTEGER DEFAULT 0,
        is_available INTEGER DEFAULT 1,
        image_url TEXT NOT NULL,
        badge TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL,
        max_discount REAL DEFAULT 15.00,
        min_order_amount REAL DEFAULT 20.00,
        is_active INTEGER DEFAULT 1,
        description TEXT NOT NULL
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        subtotal REAL NOT NULL,
        delivery_fee REAL DEFAULT 2.99,
        discount REAL DEFAULT 0.00,
        coupon_code TEXT,
        total REAL NOT NULL,
        payment_method TEXT DEFAULT 'Simulated Card',
        payment_status TEXT DEFAULT 'Paid',
        order_status TEXT DEFAULT 'Pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        food_item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        item_price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price REAL NOT NULL,
        image_url TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        food_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
      );
    `);
  }
}

async function seedInitialData() {
  // Check users
  const existingUser = await get('SELECT id FROM users WHERE email = ?', [config.demoUser.email]);
  if (!existingUser) {
    const userPassHash = await bcrypt.hash(config.demoUser.password, 10);
    await run(
      `INSERT INTO users (name, email, password_hash, auth_provider, avatar_url, phone, address, role)
       VALUES (?, ?, ?, 'demo', ?, ?, ?, ?)`,
      [config.demoUser.name, config.demoUser.email, userPassHash, config.demoUser.avatar, config.demoUser.phone, config.demoUser.address, 'customer']
    );
  }

  const existingAdmin = await get('SELECT id FROM users WHERE email = ?', [config.demoAdmin.email]);
  if (!existingAdmin) {
    const adminPassHash = await bcrypt.hash(config.demoAdmin.password, 10);
    await run(
      `INSERT INTO users (name, email, password_hash, auth_provider, avatar_url, phone, address, role)
       VALUES (?, ?, ?, 'demo', ?, ?, ?, ?)`,
      [config.demoAdmin.name, config.demoAdmin.email, adminPassHash, config.demoAdmin.avatar, config.demoAdmin.phone, config.demoAdmin.address, 'admin']
    );
  }

  // Check categories
  const catCount = await get('SELECT COUNT(*) as count FROM categories');
  if (!catCount || catCount.count === 0) {
    for (const c of categories) {
      await run(
        `INSERT INTO categories (name, slug, image_url, icon_3d, description, display_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.name, c.slug, c.image_url, c.icon_3d, c.description, c.display_order]
      );
    }
  }

  // Check restaurants
  const restCount = await get('SELECT COUNT(*) as count FROM restaurants');
  if (!restCount || restCount.count === 0) {
    for (const r of restaurants) {
      await run(
        `INSERT INTO restaurants (name, cuisine, rating, delivery_time, min_order, banner_url, logo_url, address, is_trending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.name, r.cuisine, r.rating, r.delivery_time, r.min_order, r.banner_url, r.logo_url, r.address, r.is_trending]
      );
    }
  }

  // Check food items
  const foodCount = await get('SELECT COUNT(*) as count FROM food_items');
  if (!foodCount || foodCount.count === 0) {
    const catRows = await all('SELECT id, slug FROM categories');
    const catMap = {};
    catRows.forEach(row => { catMap[row.slug] = row.id; });

    const restRows = await all('SELECT id FROM restaurants');
    const restIds = restRows.map(r => r.id);

    for (const f of foodItems) {
      const catId = catMap[f.category_slug] || 1;
      const restId = restIds[f.restaurant_index] || restIds[0] || 1;
      await run(
        `INSERT INTO food_items (category_id, restaurant_id, name, description, price, rating, reviews_count, prep_time, is_veg, is_featured, is_recommended, is_available, image_url, badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [catId, restId, f.name, f.description, f.price, f.rating, f.reviews_count, f.prep_time, f.is_veg, f.is_featured, f.is_recommended, f.is_available, f.image_url, f.badge]
      );
    }
  }

  // Check coupons
  const coupCount = await get('SELECT COUNT(*) as count FROM coupons');
  if (!coupCount || coupCount.count === 0) {
    for (const cp of coupons) {
      await run(
        `INSERT INTO coupons (code, discount_percent, max_discount, min_order_amount, is_active, description)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [cp.code, cp.discount_percent, cp.max_discount, cp.min_order_amount, cp.description]
      );
    }
  }

  // Check initial orders
  const ordersCount = await get('SELECT COUNT(*) as count FROM orders');
  if (!ordersCount || ordersCount.count === 0) {
    const demoCustomer = await get('SELECT id, name, email, phone, address FROM users WHERE role = "customer" LIMIT 1');
    const foods = await all('SELECT id, name, price, image_url FROM food_items LIMIT 6');

    if (demoCustomer && foods.length >= 4) {
      // Order 1: Delivered
      const order1Result = await run(
        `INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, delivery_address, subtotal, delivery_fee, discount, coupon_code, total, payment_method, payment_status, order_status, notes)
         VALUES ('FD-98421', ?, ?, ?, ?, ?, 34.98, 2.99, 10.49, 'TASTY30', 27.48, 'Credit Card (Simulated)', 'Paid', 'Delivered', 'Leave at door please')`,
        [demoCustomer.id, demoCustomer.name, demoCustomer.email, demoCustomer.phone, demoCustomer.address]
      );
      await run(
        `INSERT INTO order_items (order_id, food_item_id, item_name, item_price, quantity, total_price, image_url)
         VALUES (?, ?, ?, ?, 1, ?, ?), (?, ?, ?, ?, 1, ?, ?)`,
        [order1Result.insertId, foods[0].id, foods[0].name, foods[0].price, foods[0].price, foods[0].image_url,
         order1Result.insertId, foods[1].id, foods[1].name, foods[1].price, foods[1].price, foods[1].image_url]
      );

      // Order 2: Out for Delivery
      const order2Result = await run(
        `INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, delivery_address, subtotal, delivery_fee, discount, coupon_code, total, payment_method, payment_status, order_status, notes)
         VALUES ('FD-98422', ?, ?, ?, ?, ?, 30.48, 2.99, 0.00, NULL, 33.47, 'Google Pay (Simulated)', 'Paid', 'Out for Delivery', 'Extra napkins')`,
        [demoCustomer.id, demoCustomer.name, demoCustomer.email, demoCustomer.phone, demoCustomer.address]
      );
      await run(
        `INSERT INTO order_items (order_id, food_item_id, item_name, item_price, quantity, total_price, image_url)
         VALUES (?, ?, ?, ?, 1, ?, ?), (?, ?, ?, ?, 1, ?, ?)`,
        [order2Result.insertId, foods[2].id, foods[2].name, foods[2].price, foods[2].price, foods[2].image_url,
         order2Result.insertId, foods[3].id, foods[3].name, foods[3].price, foods[3].price, foods[3].image_url]
      );

      // Order 3: Preparing
      const order3Result = await run(
        `INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, delivery_address, subtotal, delivery_fee, discount, coupon_code, total, payment_method, payment_status, order_status, notes)
         VALUES ('FD-98423', ?, ?, ?, ?, ?, 18.99, 2.99, 5.00, 'WELCOME50', 16.98, 'Apple Pay (Simulated)', 'Paid', 'Preparing', 'Ring the doorbell')`,
        [demoCustomer.id, demoCustomer.name, demoCustomer.email, demoCustomer.phone, demoCustomer.address]
      );
      await run(
        `INSERT INTO order_items (order_id, food_item_id, item_name, item_price, quantity, total_price, image_url)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [order3Result.insertId, foods[0].id, foods[0].name, foods[0].price, foods[0].price, foods[0].image_url]
      );
    }
  }

  console.log('[Database] Tables and seed data initialized successfully.');
}

module.exports = {
  initDatabase,
  query,
  all,
  get,
  run,
  getDriver: () => dbDriver
};
