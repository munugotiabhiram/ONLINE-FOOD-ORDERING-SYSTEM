<<<<<<< HEAD
# 🍕 FoodVerse 3D – Complete Online Food Ordering System & Dashboard

An ultra-modern, full-stack, and responsive **Online Food Ordering System** crafted with a futuristic **3D glassmorphic UI**, interactive particle depth perspective, dual-option authentication (**Demo Account** & **Official Google OAuth 2.0**), live order tracking stepper, and an executive **Admin Dashboard**.

---

## 🌟 Key Features

### 1. 🎨 Premium 3D-Themed Glassmorphic Interface
- **Dynamic 3D Background**: Real-time canvas particle engine with depth-layered floating culinary particles and mouse parallax reaction.
- **Interactive 3D Card Tilts**: Mousemove card perspective transformations with specular rim lighting and responsive depth on food items and categories.
- **Glassmorphism**: High-blur frosted glass surfaces (`backdrop-filter: blur(20px)`), luminous neon accents, vibrant gradients, and fluid micro-animations.
- **Fully Responsive**: Optimized for desktop monitors, laptops, tablets, and smartphones.

### 2. 🔐 Dual-Option Authentication (No Traditional Forms)
- **Option 1: Demo Account Login**
  - Instant 1-click access to the dashboard.
  - Pre-seeded credentials provided directly on the login card:
    - **Customer Email**: `demo@foodverse.com` | **Password**: `demo123`
    - **Admin Email**: `admin@foodverse.com` | **Password**: `admin123`
  - Authenticated securely via backend JWT tokens.
- **Option 2: Google Account Login**
  - Official Google Identity Services (GSI) OAuth 2.0 integration.
  - Verifies cryptographically signed Google ID tokens on the backend using `google-auth-library`.
  - Automatically imports Google profile name and high-resolution avatar.
  - Clear `.env` configuration guides for activating Google OAuth.

### 3. 🍽️ Main Food Ordering Dashboard
- **Dashboard Home**: Personalized welcome message, 3D animated hero section, trending restaurants, and chef-recommended dishes.
- **Food Categories**: 9 rich categories (**Pizza**, **Burgers**, **Biryani**, **Chinese**, **South Indian**, **North Indian**, **Desserts**, **Beverages**, **Fast Food**) with instant filtering.
- **Food Menu**: Real-time search, category chips, Pure Veg filter, price/rating sorting, prep times, and 3D food cards.
- **Shopping Cart Drawer**: Sliding frosted glass drawer with quantity modifiers (`+`/`-`), removal, and auto-calculating subtotals & delivery fees.
- **Coupon System**: Live coupon code validation (`WELCOME50`, `TASTY30`, `FREEDEL`, `FEAST20`) with instant savings calculation.
- **Simulated Checkout**: Delivery address pre-filling, customer contact, delivery instructions, and demo payment methods (Credit Card, Google Pay, UPI, Cash on Delivery).
- **My Orders & Live Tracker**: Chronological order history with interactive 4-stage tracking stepper (**Placed** ➔ **Preparing** ➔ **Out for Delivery** ➔ **Delivered**).
- **User Profile**: Display Google/Demo credentials, editable delivery addresses and phone numbers, and live spending analytics.

### 4. 🛡️ Executive Admin Dashboard
- **Access Control**: Protected by role-based middleware (`requireAdmin`). Ordinary customers cannot view or modify administrative data.
- **Live Metrics**: Total customers, total orders placed, net revenue, and active catalog dishes.
- **Custom HTML5 Charts**: Interactive canvas Donut Chart for order status breakdown and Horizontal Bar Chart for category distribution.
- **Order Management**: Real-time order review and instant order status updates (**Pending**, **Preparing**, **Out for Delivery**, **Delivered**, **Cancelled**).
- **Food Catalog CRUD**: Add new food items, edit pricing/descriptions/images, toggle availability, or delete items.
- **Customer Directory**: Customer spending summaries and order history volume.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom 3D & Glassmorphic variables), Modern JavaScript (ES6+), HTML5 Canvas 3D Particle Engine |
| **Backend** | Node.js, Express.js, RESTful Architecture, JSON Web Tokens (JWT) |
| **Authentication** | Google OAuth 2.0 (`google-auth-library`), Bcrypt.js, JWT |
| **Database** | Dual Architecture: **MySQL** (via `mysql2`) + Zero-Config **SQLite** (via `sqlite3`) fallback |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node.js v20+)
- **npm** v9+
- *(Optional)* **MySQL Server** (if you choose MySQL mode)

### 2. Installation
Open your terminal in the project directory:
```bash
# 1. Install dependencies
npm install

# 2. Check environment file
# The application comes with a preconfigured .env file ready for instant execution!
```

### 3. Start the Server
```bash
npm start
```
The server will boot up and log:
```
====================================================
🚀 FOODVERSE 3D SERVER RUNNING ON PORT 5000
🌐 Dashboard: http://localhost:5000/
🔑 Login:     http://localhost:5000/login.html
🛡️  Admin:     http://localhost:5000/admin.html
📦 Database:  SQLITE (or MYSQL)
====================================================
```

Open your browser to:
- **Application Dashboard / Login**: [http://localhost:5000/](http://localhost:5000/)
- **Direct Login Page**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **Admin Portal**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)

---

## 🔑 Login Credentials

### Option 1: Demo Customer (Full Dashboard Access)
- **Email**: `demo@foodverse.com`
- **Password**: `demo123`
- *Or simply click the pre-filled "🚀 Enter Dashboard" button on the login page.*

### Option 2: Demo Admin (Admin Portal Access)
- **Email**: `admin@foodverse.com`
- **Password**: `admin123`
- *Or click "🛡️ Admin Login" at the bottom of the login page.*

---

## 🌐 Google OAuth 2.0 Configuration Instructions

To enable sign-in with your personal Google Account:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a new project (e.g. `FoodVerse-App`).
3. Configure the **OAuth Consent Screen** (User Type: External, fill App Name and Developer Email).
4. Navigate to **Credentials** ➔ **Create Credentials** ➔ **OAuth Client ID**.
5. Select **Application type**: `Web application`.
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5000`
   - `http://127.0.0.1:5000`
7. Copy your generated **Client ID** (e.g. `123456789-abcdef.apps.googleusercontent.com`).
8. Open the `.env` file in the project root and update:
   ```env
   GOOGLE_CLIENT_ID=your_actual_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   ```
9. Restart the server with `npm start`. The login page will immediately display the official Google One Tap and "Continue with Google" sign-in button.

---

## 🗄️ Database Setup & MySQL Configuration

FoodVerse 3D includes a **universal dual-database engine**:
- **SQLite (Default Out-of-the-Box)**: Zero setup required! Runs immediately upon `npm start` with pre-populated tables, categories, dishes, demo accounts, and orders.
- **MySQL Integration**: To switch to your local or cloud MySQL instance:
  1. Open `.env` and set:
     ```env
     DB_TYPE=mysql
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=foodverse_db
     ```
  2. If desired, you can also import `server/database/schema.sql` directly into your MySQL client.
  3. Restart the server with `npm start`. If MySQL is running, the server connects and creates all tables and seed data automatically. If MySQL is unavailable, it gracefully falls back to SQLite so your app never crashes.

---

## 🧪 Running Automated Tests

Run the complete 15-point End-to-End verification test suite:
```bash
npm test
```
Verifies health checks, authentication, Google OAuth endpoint verification, category and dish querying, shopping cart updates, coupon validation, order placement, live status updating, and admin role restrictions.

---

## 📁 Project Structure

```
WEB FINAL PROJECT/
├── server/
│   ├── config/
│   │   └── config.js           # Server & credentials configuration
│   ├── database/
│   │   ├── db.js               # Universal MySQL / SQLite adapter
│   │   ├── schema.sql          # Complete MySQL DDL definitions
│   │   ├── seedData.js         # Comprehensive dishes, categories & restaurants
│   │   └── seed.js             # Standalone seeding script
│   ├── middleware/
│   │   └── auth.js             # JWT verification & Admin RBAC guard
│   ├── routes/
│   │   ├── authRoutes.js       # Demo & Google OAuth2 endpoints
│   │   ├── categoryRoutes.js   # Category listings & items
│   │   ├── foodRoutes.js       # Menu items, search & filtering
│   │   ├── restaurantRoutes.js # Restaurant profiles & menus
│   │   ├── cartRoutes.js       # Persistent cart management
│   │   ├── couponRoutes.js     # Promo coupon validation
│   │   ├── orderRoutes.js      # Order checkout & status tracking
│   │   ├── profileRoutes.js    # Customer profile updates
│   │   └── adminRoutes.js      # Admin analytics, food CRUD & orders
│   └── index.js                # Express application entrypoint
├── public/
│   ├── login.html              # Dual-option login (Demo & Google OAuth)
│   ├── index.html              # Main Food Ordering Dashboard
│   ├── admin.html              # Executive Admin Operations Dashboard
│   ├── css/
│   │   ├── style.css           # Glassmorphism, variables & layouts
│   │   ├── 3d-components.css   # 3D cards, tilt effects & hero banner
│   │   ├── dashboard.css       # Food menu, cart drawer & orders tracker
│   │   └── admin.css           # Admin stats, tables & charts
│   └── js/
│       ├── api.js              # Centralized fetch wrapper & toasts
│       ├── 3d-effects.js       # 3D particle canvas & card tilt engine
│       ├── auth.js             # Authentication & Google GSI logic
│       ├── app.js              # Main SPA router & ordering workflow
│       └── admin.js            # Admin metrics, charts & food CRUD
├── test/
│   └── e2e.test.js             # Automated end-to-end verification suite
├── .env.example                # Example environment configuration
├── .env                        # Live environment configuration
├── package.json                # Project dependencies & scripts
└── README.md                   # Full documentation
```

---

## 🏆 Summary

FoodVerse 3D provides a complete, modern, and production-grade food delivery dashboard experience with genuine 3D visual appeal, authentic Google and Demo authentication, complete shopping cart and order workflows, and administrative control.
=======
# ONLINE-FOOD-ORDERING-SYSTEM
An Online Food Ordering System that allows users to browse menus, order food, make payments, and track deliveries through a simple and user-friendly platform.
>>>>>>> 1b14b69a096da97bd94ef3b9885921a73f84f971
