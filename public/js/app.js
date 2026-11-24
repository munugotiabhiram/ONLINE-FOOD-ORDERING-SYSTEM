/**
 * FoodVerse 3D - Main Application Controller
 */

// Application State
const AppState = {
  user: null,
  categories: [],
  restaurants: [],
  allFoodItems: [],
  cart: {
    items: [],
    itemCount: 0,
    subtotal: 0,
    deliveryFee: 2.99,
    total: 0
  },
  appliedCoupon: null,
  activeCategory: 'all',
  isVegOnly: false,
  sortOption: 'default',
  selectedPaymentMethod: 'Simulated Credit Card',
  currentView: 'dashboard'
};

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthAndInitialize();
});

async function checkAuthAndInitialize() {
  const token = API.getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await API.get('/api/auth/me');
    if (res.success && res.user) {
      AppState.user = res.user;
      API.setUser(res.user);
      renderUserHeaderAndSidebar();

      // Check if admin to show admin portal link
      if (res.user.role === 'admin') {
        const adminLink = document.getElementById('nav-admin-link');
        if (adminLink) adminLink.style.display = 'flex';
      }

      // Load core data in parallel
      await Promise.all([
        loadCategories(),
        loadFoodItems(),
        loadRestaurants(),
        loadCart(),
        loadOffers()
      ]);

      // Handle hash navigation if present
      const initialView = window.location.hash.replace('#', '') || 'dashboard';
      navigateTo(initialView);
    }
  } catch (err) {
    console.error('Session validation error:', err);
    API.clearAuth();
    window.location.href = '/login.html';
  }
}

function renderUserHeaderAndSidebar() {
  const user = AppState.user;
  if (!user) return;

  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarRoleBadge = document.getElementById('sidebar-role-badge');
  const sidebarAuthProvider = document.getElementById('sidebar-auth-provider');

  const headerName = document.getElementById('header-user-name');
  const headerAvatar = document.getElementById('header-user-avatar');
  const headerAddress = document.getElementById('header-address-text');
  const heroWelcomeTitle = document.getElementById('hero-welcome-title');

  const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarAvatar) sidebarAvatar.src = avatar;
  if (headerName) headerName.textContent = user.name.split(' ')[0];
  if (headerAvatar) headerAvatar.src = avatar;

  if (sidebarRoleBadge) {
    sidebarRoleBadge.textContent = user.role.toUpperCase();
    if (user.role === 'admin') sidebarRoleBadge.classList.add('admin');
  }

  if (sidebarAuthProvider) {
    sidebarAuthProvider.textContent = user.auth_provider === 'google' ? 'Google OAuth' : 'Demo';
  }

  if (headerAddress) {
    headerAddress.textContent = user.address ? `Deliver: ${user.address}` : 'Set Delivery Address';
  }

  if (heroWelcomeTitle) {
    heroWelcomeTitle.innerHTML = `Welcome back, ${escapeHtml(user.name.split(' ')[0])}!<br>Experience Food in 3D.`;
  }
}

/* ====================================================================
   VIEW ROUTING & NAVIGATION
   ==================================================================== */
function navigateTo(viewName, event) {
  if (event) event.preventDefault();

  const validViews = ['dashboard', 'menu', 'categories', 'restaurants', 'checkout', 'orders', 'offers', 'profile'];
  if (!validViews.includes(viewName)) viewName = 'dashboard';

  AppState.currentView = viewName;
  window.location.hash = viewName;

  // Toggle View Section classes
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) targetSec.classList.add('active');

  // Update Sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.remove('open');

  // Specific view hooks
  if (viewName === 'orders') loadUserOrders();
  if (viewName === 'profile') loadUserProfile();
  if (viewName === 'checkout') renderCheckoutView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* ====================================================================
   DATA FETCHERS
   ==================================================================== */
async function loadCategories() {
  try {
    const res = await API.get('/api/categories');
    if (res.success) {
      AppState.categories = res.categories;
      renderHomeCategories();
      renderAllCategoriesView();
      renderMenuCategoryPills();
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function loadFoodItems() {
  try {
    const res = await API.get('/api/food');
    if (res.success) {
      AppState.allFoodItems = res.foodItems;
      renderHomeRecommended();
      renderMenuFoodGrid();
    }
  } catch (err) {
    console.error('Error loading food items:', err);
  }
}

async function loadRestaurants() {
  try {
    const res = await API.get('/api/restaurants');
    if (res.success) {
      AppState.restaurants = res.restaurants;
      renderHomeRestaurants();
      renderAllRestaurantsView();
    }
  } catch (err) {
    console.error('Error loading restaurants:', err);
  }
}

async function loadOffers() {
  try {
    const res = await API.get('/api/coupons');
    if (res.success) {
      renderOffersView(res.coupons);
    }
  } catch (err) {
    console.error('Error loading coupons:', err);
  }
}

/* ====================================================================
   RENDER FUNCTIONS
   ==================================================================== */
function renderHomeCategories() {
  const container = document.getElementById('home-category-container');
  if (!container) return;

  container.innerHTML = AppState.categories.slice(0, 8).map(c => `
    <div class="category-card-3d tilt-card-3d" onclick="filterByCategoryAndGoToMenu('${c.slug}')">
      <div class="category-icon-3d">${c.icon_3d || '🍕'}</div>
      <div class="category-name">${escapeHtml(c.name)}</div>
      <div class="category-count">${c.items_count || 0} items</div>
    </div>
  `).join('');
}

function renderAllCategoriesView() {
  const container = document.getElementById('all-categories-grid');
  if (!container) return;

  container.innerHTML = AppState.categories.map(c => `
    <div class="food-card-3d tilt-card-3d" onclick="filterByCategoryAndGoToMenu('${c.slug}')" style="cursor: pointer;">
      <div class="food-card-media" style="height: 160px;">
        <img src="${c.image_url}" alt="${escapeHtml(c.name)}" class="food-card-img">
        <div class="food-card-media-overlay"></div>
        <div class="food-badge-corner">${c.icon_3d} ${c.items_count || 0} Dishes</div>
      </div>
      <div class="food-card-body">
        <div class="food-name" style="font-size: 19px;">${escapeHtml(c.name)}</div>
        <p class="food-desc">${escapeHtml(c.description || '')}</p>
        <button class="btn-primary-3d" style="width: 100%; margin-top: 10px;">
          <span>Explore Category →</span>
        </button>
      </div>
    </div>
  `).join('');
}

function renderMenuCategoryPills() {
  const container = document.getElementById('menu-category-pills');
  if (!container) return;

  let html = `<div class="filter-chip ${AppState.activeCategory === 'all' ? 'active' : ''}" onclick="setMenuCategory('all', this)">All Items</div>`;
  AppState.categories.forEach(c => {
    html += `<div class="filter-chip ${AppState.activeCategory === c.slug ? 'active' : ''}" onclick="setMenuCategory('${c.slug}', this)">${c.icon_3d} ${escapeHtml(c.name)}</div>`;
  });
  container.innerHTML = html;
}

function renderHomeRecommended() {
  const container = document.getElementById('home-recommended-grid');
  if (!container) return;

  const recommended = AppState.allFoodItems.filter(f => f.is_recommended || f.is_featured).slice(0, 4);
  container.innerHTML = recommended.map(f => createFoodCardHTML(f)).join('');
}

function renderHomeRestaurants() {
  const container = document.getElementById('home-restaurants-grid');
  if (!container) return;

  container.innerHTML = AppState.restaurants.slice(0, 3).map(r => createRestaurantCardHTML(r)).join('');
}

function renderAllRestaurantsView() {
  const container = document.getElementById('all-restaurants-grid');
  if (!container) return;

  container.innerHTML = AppState.restaurants.map(r => createRestaurantCardHTML(r)).join('');
}

function createRestaurantCardHTML(r) {
  return `
    <div class="restaurant-card-3d tilt-card-3d" onclick="filterByRestaurantAndGoToMenu('${escapeHtml(r.name)}')">
      <div class="restaurant-banner-wrap">
        <img src="${r.banner_url}" alt="${escapeHtml(r.name)}" class="restaurant-banner-img">
        <img src="${r.logo_url}" alt="${escapeHtml(r.name)}" class="restaurant-logo-circle">
      </div>
      <div class="restaurant-body">
        <div class="restaurant-name">${escapeHtml(r.name)}</div>
        <div class="restaurant-cuisine">${escapeHtml(r.cuisine)}</div>
        <div class="restaurant-meta">
          <span class="rating-chip">⭐ ${r.rating}</span>
          <span>⚡ ${escapeHtml(r.delivery_time)}</span>
          <span>Min $${r.min_order.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderMenuFoodGrid() {
  const container = document.getElementById('menu-food-grid');
  if (!container) return;

  let filtered = [...AppState.allFoodItems];

  // Category filter
  if (AppState.activeCategory && AppState.activeCategory !== 'all') {
    filtered = filtered.filter(f => f.category_slug === AppState.activeCategory);
  }

  // Veg only filter
  if (AppState.isVegOnly) {
    filtered = filtered.filter(f => f.is_veg === 1);
  }

  // Sorting
  switch (AppState.sortOption) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      filtered.sort((a, b) => (b.is_featured || 0) - (a.is_featured || 0));
      break;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 54px; margin-bottom: 14px;">🍽️</div>
        <h3 style="color: #ffffff; font-size: 20px; margin-bottom: 8px;">No matching dishes found</h3>
        <p style="color: var(--text-secondary);">Try clearing some filters or searching for something else.</p>
        <button class="btn-secondary-3d" style="margin-top: 16px;" onclick="resetMenuFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(f => createFoodCardHTML(f)).join('');
}

function createFoodCardHTML(item) {
  const inCart = AppState.cart.items.find(ci => ci.food_id === item.id);
  const badgeHTML = item.badge ? `<div class="food-badge-corner">${escapeHtml(item.badge)}</div>` : '';
  const vegHTML = `
    <div class="veg-indicator-corner" title="${item.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}">
      <div class="veg-dot ${item.is_veg ? 'veg' : 'non-veg'}"></div>
    </div>
  `;

  let actionButtonHTML = '';
  if (inCart) {
    actionButtonHTML = `
      <div class="cart-qty-control">
        <button class="cart-qty-btn" onclick="updateCartQty(${inCart.cart_id}, ${inCart.quantity - 1})">-</button>
        <span class="cart-qty-val">${inCart.quantity}</span>
        <button class="cart-qty-btn" onclick="updateCartQty(${inCart.cart_id}, ${inCart.quantity + 1})">+</button>
      </div>
    `;
  } else {
    actionButtonHTML = `
      <button class="btn-add-cart-3d" onclick="addToCart(${item.id})">
        <span>+ Add</span>
      </button>
    `;
  }

  return `
    <div class="food-card-3d tilt-card-3d" id="food-card-${item.id}">
      <div class="food-card-media">
        <img src="${item.image_url}" alt="${escapeHtml(item.name)}" class="food-card-img" loading="lazy">
        <div class="food-card-media-overlay"></div>
        ${badgeHTML}
        ${vegHTML}
      </div>
      <div class="food-card-body">
        <div class="food-meta-row">
          <span class="rating-chip">⭐ ${item.rating}</span>
          <span class="prep-time-chip">⏱️ ${escapeHtml(item.prep_time || '20 min')}</span>
        </div>
        <h3 class="food-name">${escapeHtml(item.name)}</h3>
        <p class="food-desc">${escapeHtml(item.description)}</p>
        <div class="food-footer">
          <div class="food-price-wrap">
            <span class="food-price-label">Price</span>
            <div class="food-price"><span>$</span>${item.price.toFixed(2)}</div>
          </div>
          ${actionButtonHTML}
        </div>
      </div>
    </div>
  `;
}

/* ====================================================================
   FILTERING & SEARCH
   ==================================================================== */
function setMenuCategory(slug, el) {
  AppState.activeCategory = slug;
  if (el) {
    document.querySelectorAll('#menu-category-pills .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
  renderMenuFoodGrid();
}

function filterByCategoryAndGoToMenu(slug) {
  AppState.activeCategory = slug;
  renderMenuCategoryPills();
  navigateTo('menu');
  renderMenuFoodGrid();
}

function filterByRestaurantAndGoToMenu(restaurantName) {
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) searchInput.value = restaurantName;
  handleGlobalSearch(restaurantName);
  navigateTo('menu');
}

function toggleVegFilter(el) {
  AppState.isVegOnly = !AppState.isVegOnly;
  if (el) el.classList.toggle('active', AppState.isVegOnly);
  renderMenuFoodGrid();
}

function handleMenuSortChange(sortVal) {
  AppState.sortOption = sortVal;
  renderMenuFoodGrid();
}

function resetMenuFilters() {
  AppState.activeCategory = 'all';
  AppState.isVegOnly = false;
  AppState.sortOption = 'default';
  const vegChip = document.getElementById('chip-veg-only');
  if (vegChip) vegChip.classList.remove('active');
  renderMenuCategoryPills();
  renderMenuFoodGrid();
}

// Global Search Bar Handler
let searchDebounceTimeout = null;
function handleGlobalSearch(query) {
  clearTimeout(searchDebounceTimeout);
  const dropdown = document.getElementById('search-results-dropdown');
  if (!dropdown) return;

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
    return;
  }

  searchDebounceTimeout = setTimeout(() => {
    const matches = AppState.allFoodItems.filter(f =>
      f.name.toLowerCase().includes(trimmed) ||
      f.description.toLowerCase().includes(trimmed) ||
      (f.category_name && f.category_name.toLowerCase().includes(trimmed))
    ).slice(0, 6);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 13px;">No food items matching "${escapeHtml(query)}"</div>`;
    } else {
      dropdown.innerHTML = matches.map(m => `
        <div class="search-result-item" onclick="selectSearchResult(${m.id})">
          <img src="${m.image_url}" class="search-result-img" alt="${escapeHtml(m.name)}">
          <div>
            <div class="search-result-name">${escapeHtml(m.name)}</div>
            <div class="search-result-sub">${escapeHtml(m.category_name || '')} • ⭐ ${m.rating}</div>
          </div>
          <div class="search-result-price">$${m.price.toFixed(2)}</div>
        </div>
      `).join('');
    }
    dropdown.classList.add('active');
  }, 200);
}

function selectSearchResult(foodId) {
  const dropdown = document.getElementById('search-results-dropdown');
  if (dropdown) dropdown.classList.remove('active');
  navigateTo('menu');
  const targetCard = document.getElementById(`food-card-${foodId}`);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetCard.style.outline = '2px solid var(--primary)';
    setTimeout(() => { targetCard.style.outline = 'none'; }, 2000);
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const container = document.querySelector('.search-container');
  const dropdown = document.getElementById('search-results-dropdown');
  if (container && dropdown && !container.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

/* ====================================================================
   CART OPERATIONS & SLIDING DRAWER
   ==================================================================== */
async function loadCart() {
  try {
    const res = await API.get('/api/cart');
    if (res.success) {
      AppState.cart = res;
      updateCartUI();
    }
  } catch (err) {
    console.error('Error loading cart:', err);
  }
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer || !overlay) return;

  if (open) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    renderCartDrawerBody();
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

async function addToCart(foodId, quantity = 1) {
  try {
    const res = await API.post('/api/cart', { foodId, quantity });
    if (res.success) {
      API.showToast(res.message, 'success');
      await loadCart();
      renderMenuFoodGrid();
      renderHomeRecommended();
    }
  } catch (err) {
    API.showToast(err.message, 'error');
  }
}

async function updateCartQty(cartId, newQty) {
  try {
    const res = await API.put(`/api/cart/${cartId}`, { quantity: newQty });
    if (res.success) {
      await loadCart();
      renderMenuFoodGrid();
      renderHomeRecommended();
      renderCartDrawerBody();
      if (AppState.currentView === 'checkout') renderCheckoutView();
    }
  } catch (err) {
    API.showToast(err.message, 'error');
  }
}

function updateCartUI() {
  const count = AppState.cart.itemCount || 0;

  // Badges
  const navBadge = document.getElementById('nav-cart-badge');
  const headerBadge = document.getElementById('header-cart-badge');
  const drawerCount = document.getElementById('cart-drawer-count');

  if (navBadge) navBadge.textContent = count;
  if (headerBadge) headerBadge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;

  // Drawer Totals
  const subtotalEl = document.getElementById('drawer-subtotal');
  const deliveryEl = document.getElementById('drawer-delivery');
  const totalEl = document.getElementById('drawer-total');
  const discountRow = document.getElementById('drawer-discount-row');
  const discountEl = document.getElementById('drawer-discount');

  let discount = 0;
  if (AppState.appliedCoupon) {
    discount = AppState.appliedCoupon.discountAmount;
  }

  const finalTotal = Math.max(0, AppState.cart.subtotal + AppState.cart.deliveryFee - discount);

  if (subtotalEl) subtotalEl.textContent = `$${AppState.cart.subtotal.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = AppState.cart.subtotal > 35 || AppState.cart.subtotal === 0 ? 'FREE' : `$${AppState.cart.deliveryFee.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)}`;

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}

function renderCartDrawerBody() {
  const container = document.getElementById('cart-drawer-body');
  if (!container) return;

  if (!AppState.cart.items || AppState.cart.items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-state-icon">🛒</div>
        <h4 style="color: #ffffff; font-size: 18px; margin-bottom: 6px;">Your cart is empty</h4>
        <p style="font-size: 13px;">Add some tasty dishes from our menu to begin your feast!</p>
        <button class="btn-primary-3d" style="margin-top: 18px;" onclick="toggleCartDrawer(false); navigateTo('menu');">
          <span>Explore Menu</span>
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = AppState.cart.items.map(ci => `
    <div class="cart-item-card">
      <img src="${ci.image_url}" alt="${escapeHtml(ci.name)}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-name">${escapeHtml(ci.name)}</div>
        <div class="cart-item-price">$${ci.price.toFixed(2)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-qty-control">
          <button class="cart-qty-btn" onclick="updateCartQty(${ci.cart_id}, ${ci.quantity - 1})">-</button>
          <span class="cart-qty-val">${ci.quantity}</span>
          <button class="cart-qty-btn" onclick="updateCartQty(${ci.cart_id}, ${ci.quantity + 1})">+</button>
        </div>
        <button class="cart-item-remove-btn" onclick="updateCartQty(${ci.cart_id}, 0)" title="Remove item">🗑️</button>
      </div>
    </div>
  `).join('');
}

/* ====================================================================
   COUPONS & OFFERS
   ==================================================================== */
async function applyCouponCode() {
  const input = document.getElementById('checkout-coupon-input') || document.getElementById('drawer-coupon-input');
  if (!input || !input.value.trim()) {
    API.showToast('Please enter a coupon code.', 'error');
    return;
  }

  const code = input.value.trim();
  try {
    const res = await API.post('/api/coupons/validate', {
      code,
      subtotal: AppState.cart.subtotal
    });

    if (res.success && res.coupon) {
      AppState.appliedCoupon = res.coupon;
      API.showToast(res.message, 'success');

      // Update pills
      const drawerPill = document.getElementById('drawer-coupon-pill');
      const drawerText = document.getElementById('drawer-coupon-text');
      const checkPill = document.getElementById('checkout-coupon-pill');
      const checkText = document.getElementById('checkout-coupon-text');

      if (drawerPill && drawerText) {
        drawerPill.style.display = 'flex';
        drawerText.textContent = `Coupon ${res.coupon.code} (-$${res.coupon.discountAmount.toFixed(2)})`;
      }
      if (checkPill && checkText) {
        checkPill.style.display = 'flex';
        checkText.textContent = `Coupon ${res.coupon.code} (-$${res.coupon.discountAmount.toFixed(2)})`;
      }

      updateCartUI();
      if (AppState.currentView === 'checkout') renderCheckoutView();
    }
  } catch (err) {
    API.showToast(err.message, 'error');
  }
}

function applyCouponFromDrawer() {
  const input = document.getElementById('drawer-coupon-input');
  const checkoutInput = document.getElementById('checkout-coupon-input');
  if (input && checkoutInput) checkoutInput.value = input.value;
  applyCouponCode();
}

function removeCouponCode() {
  AppState.appliedCoupon = null;
  const drawerPill = document.getElementById('drawer-coupon-pill');
  const checkPill = document.getElementById('checkout-coupon-pill');
  if (drawerPill) drawerPill.style.display = 'none';
  if (checkPill) checkPill.style.display = 'none';

  API.showToast('Coupon removed.', 'info');
  updateCartUI();
  if (AppState.currentView === 'checkout') renderCheckoutView();
}

function copyCouponCode(code) {
  navigator.clipboard.writeText(code);
  API.showToast(`Coupon "${code}" copied! Applying to cart...`, 'success');

  const checkInput = document.getElementById('checkout-coupon-input');
  const drawerInput = document.getElementById('drawer-coupon-input');
  if (checkInput) checkInput.value = code;
  if (drawerInput) drawerInput.value = code;

  applyCouponCode();
}

function renderOffersView(coupons) {
  const container = document.getElementById('offers-container');
  if (!container) return;

  container.innerHTML = coupons.map(cp => `
    <div class="coupon-card-3d tilt-card-3d">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 34px;">🏷️</span>
        <div class="coupon-info">
          <h4>${cp.discount_percent}% Discount</h4>
          <p>${escapeHtml(cp.description)}</p>
          <span style="font-size: 11px; color: var(--text-muted);">Min Order: $${cp.min_order_amount.toFixed(2)}</span>
        </div>
      </div>
      <div class="coupon-action-badge" onclick="copyCouponCode('${cp.code}')" title="Copy & Apply">
        ${cp.code} 📋
      </div>
    </div>
  `).join('');
}

/* ====================================================================
   CHECKOUT & ORDER PLACEMENT
   ==================================================================== */
function goToCheckout() {
  toggleCartDrawer(false);
  navigateTo('checkout');
}

function renderCheckoutView() {
  const user = AppState.user;
  if (!user) return;

  const nameInput = document.getElementById('checkout-name');
  const phoneInput = document.getElementById('checkout-phone');
  const addressInput = document.getElementById('checkout-address');

  if (nameInput && !nameInput.value) nameInput.value = user.name || '';
  if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
  if (addressInput && !addressInput.value) addressInput.value = user.address || '';

  const summaryContainer = document.getElementById('checkout-items-summary');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const deliveryEl = document.getElementById('checkout-delivery');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountEl = document.getElementById('checkout-discount');
  const totalEl = document.getElementById('checkout-total');
  const placeBtn = document.getElementById('btn-place-order');

  if (!AppState.cart.items || AppState.cart.items.length === 0) {
    if (summaryContainer) {
      summaryContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Your cart is empty. Add food items before checking out.</div>`;
    }
    if (placeBtn) placeBtn.disabled = true;
    return;
  }

  if (placeBtn) placeBtn.disabled = false;

  if (summaryContainer) {
    summaryContainer.innerHTML = AppState.cart.items.map(ci => `
      <div class="order-item-row">
        <div class="order-item-left">
          <img src="${ci.image_url}" class="order-item-thumb" alt="${escapeHtml(ci.name)}">
          <div>
            <div style="font-weight: 600; color: #ffffff;">${escapeHtml(ci.name)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${ci.quantity} × $${ci.price.toFixed(2)}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: #ffffff;">$${(ci.quantity * ci.price).toFixed(2)}</div>
      </div>
    `).join('');
  }

  let discount = 0;
  if (AppState.appliedCoupon) {
    discount = AppState.appliedCoupon.discountAmount;
  }

  const finalTotal = Math.max(0, AppState.cart.subtotal + AppState.cart.deliveryFee - discount);

  if (subtotalEl) subtotalEl.textContent = `$${AppState.cart.subtotal.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = AppState.cart.subtotal > 35 ? 'FREE' : `$${AppState.cart.deliveryFee.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)}`;

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}

function selectPaymentMethod(methodName, el) {
  AppState.selectedPaymentMethod = methodName;
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

async function submitOrder() {
  const nameInput = document.getElementById('checkout-name');
  const phoneInput = document.getElementById('checkout-phone');
  const addressInput = document.getElementById('checkout-address');
  const notesInput = document.getElementById('checkout-notes');
  const placeBtn = document.getElementById('btn-place-order');

  const customerName = nameInput ? nameInput.value.trim() : '';
  const customerPhone = phoneInput ? phoneInput.value.trim() : '';
  const deliveryAddress = addressInput ? addressInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!customerPhone || !deliveryAddress) {
    API.showToast('Please provide your contact phone and complete delivery address.', 'error');
    return;
  }

  if (placeBtn) {
    placeBtn.disabled = true;
    placeBtn.innerHTML = '<span>⏳ Processing Demo Order...</span>';
  }

  try {
    const res = await API.post('/api/orders', {
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod: AppState.selectedPaymentMethod,
      couponCode: AppState.appliedCoupon ? AppState.appliedCoupon.code : null,
      notes
    });

    if (res.success && res.order) {
      // Show Confirmation Modal
      const modal = document.getElementById('order-success-modal');
      const orderCodeEl = document.getElementById('modal-order-code');
      if (orderCodeEl) orderCodeEl.textContent = `Order Code: ${res.order.order_code}`;
      if (modal) modal.classList.add('active');

      // Clear local cart and coupon
      AppState.appliedCoupon = null;
      await loadCart();
      renderMenuFoodGrid();
      renderHomeRecommended();
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to place order.', 'error');
  } finally {
    if (placeBtn) {
      placeBtn.disabled = false;
      placeBtn.innerHTML = '<span>🚀 Confirm & Place Order</span>';
    }
  }
}

function closeOrderModalAndGoTo(view) {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.classList.remove('active');
  navigateTo(view);
}

/* ====================================================================
   MY ORDERS & REAL-TIME TRACKER
   ==================================================================== */
async function loadUserOrders() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading your order history...</div>`;

  try {
    const res = await API.get('/api/orders');
    if (res.success) {
      if (res.orders.length === 0) {
        container.innerHTML = `
          <div class="cart-empty-state">
            <div class="empty-state-icon">📦</div>
            <h3 style="color: #ffffff; font-size: 20px; margin-bottom: 8px;">No orders placed yet</h3>
            <p>You haven't ordered any delicious food yet. Treat yourself today!</p>
            <button class="btn-primary-3d" style="margin-top: 16px;" onclick="navigateTo('menu')">
              Order Your First Dish
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = res.orders.map(order => createOrderCardHTML(order)).join('');
    }
  } catch (err) {
    container.innerHTML = `<div style="color: var(--accent-red); text-align: center; padding: 30px;">Error loading orders: ${err.message}</div>`;
  }
}

function createOrderCardHTML(order) {
  const steps = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];
  const currentIndex = steps.indexOf(order.order_status);
  const statusClass = order.order_status.replace(/\s+/g, '-');

  // Calculate stepper progress bar percentage
  let progressPct = 0;
  if (currentIndex >= 0) {
    progressPct = (currentIndex / (steps.length - 1)) * 100;
  }

  const itemsHTML = (order.items || []).map(item => `
    <div class="order-item-row">
      <div class="order-item-left">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=100&q=80'}" class="order-item-thumb" alt="${escapeHtml(item.item_name)}">
        <div>
          <span style="font-weight: 600; color: #ffffff;">${escapeHtml(item.item_name)}</span>
          <span style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">× ${item.quantity}</span>
        </div>
      </div>
      <div style="font-weight: 700; color: #ffffff;">$${item.total_price.toFixed(2)}</div>
    </div>
  `).join('');

  return `
    <div class="order-card-3d tilt-card-3d">
      <div class="order-header">
        <div>
          <div class="order-code-badge">
            <span>📦</span>
            <span>Order #${order.order_code}</span>
          </div>
          <div class="order-date-text">Placed on ${formatDate(order.created_at)}</div>
        </div>
        <div style="text-align: right;">
          <span class="order-status-pill ${statusClass}">${order.order_status}</span>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Paid via ${escapeHtml(order.payment_method)}</div>
        </div>
      </div>

      <!-- Live Stepper Tracker -->
      <div class="order-stepper">
        <div class="stepper-progress-fill" style="width: ${progressPct}%;"></div>
        
        <div class="step-node ${currentIndex >= 0 ? (currentIndex === 0 ? 'active' : 'completed') : ''}">
          <div class="step-circle">📝</div>
          <span class="step-label">Placed</span>
        </div>
        <div class="step-node ${currentIndex >= 1 ? (currentIndex === 1 ? 'active' : 'completed') : ''}">
          <div class="step-circle">👨‍🍳</div>
          <span class="step-label">Preparing</span>
        </div>
        <div class="step-node ${currentIndex >= 2 ? (currentIndex === 2 ? 'active' : 'completed') : ''}">
          <div class="step-circle">🛵</div>
          <span class="step-label">On The Way</span>
        </div>
        <div class="step-node ${currentIndex >= 3 ? 'completed' : ''}">
          <div class="step-circle">🎉</div>
          <span class="step-label">Delivered</span>
        </div>
      </div>

      <!-- Items List -->
      <div class="order-items-summary">
        ${itemsHTML}
      </div>

      <!-- Breakdown footer -->
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--text-secondary); padding-top: 8px;">
        <div>📍 Delivering to: <b style="color: #ffffff;">${escapeHtml(order.delivery_address)}</b></div>
        <div style="font-size: 16px; font-weight: 800; color: #ffffff;">
          Total: <span style="color: var(--secondary);">$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

/* ====================================================================
   USER PROFILE MANAGEMENT
   ==================================================================== */
async function loadUserProfile() {
  try {
    const res = await API.get('/api/profile');
    if (res.success && res.profile) {
      const p = res.profile;
      const avatarEl = document.getElementById('profile-avatar-img');
      const nameEl = document.getElementById('profile-name-text');
      const emailEl = document.getElementById('profile-email-text');
      const authSourceEl = document.getElementById('profile-auth-source');
      const badgePill = document.getElementById('profile-badge-pill');

      const statOrders = document.getElementById('profile-stat-orders');
      const statSpent = document.getElementById('profile-stat-spent');

      const inputName = document.getElementById('profile-input-name');
      const inputPhone = document.getElementById('profile-input-phone');
      const inputAddress = document.getElementById('profile-input-address');

      if (avatarEl) avatarEl.src = p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
      if (nameEl) nameEl.textContent = p.name;
      if (emailEl) emailEl.textContent = p.email;
      if (authSourceEl) authSourceEl.textContent = p.auth_provider === 'google' ? 'Google Account (OAuth 2.0)' : 'Demo Credentials';
      if (badgePill) badgePill.textContent = p.role.toUpperCase();

      if (statOrders) statOrders.textContent = p.totalOrders || 0;
      if (statSpent) statSpent.textContent = `$${(p.totalSpent || 0).toFixed(2)}`;

      if (inputName) inputName.value = p.name || '';
      if (inputPhone) inputPhone.value = p.phone || '';
      if (inputAddress) inputAddress.value = p.address || '';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function handleProfileUpdate(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('profile-input-name').value.trim();
  const phone = document.getElementById('profile-input-phone').value.trim();
  const address = document.getElementById('profile-input-address').value.trim();

  try {
    const res = await API.put('/api/profile', { name, phone, address });
    if (res.success && res.user) {
      AppState.user = { ...AppState.user, ...res.user };
      API.setUser(AppState.user);
      renderUserHeaderAndSidebar();
      API.showToast(res.message || 'Profile saved successfully!', 'success');
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to update profile.', 'error');
  }
}

/* ====================================================================
   HELPERS
   ==================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Global exposes
window.navigateTo = navigateTo;
window.toggleMobileSidebar = toggleMobileSidebar;
window.filterByCategoryAndGoToMenu = filterByCategoryAndGoToMenu;
window.filterByRestaurantAndGoToMenu = filterByRestaurantAndGoToMenu;
window.setMenuCategory = setMenuCategory;
window.toggleVegFilter = toggleVegFilter;
window.handleMenuSortChange = handleMenuSortChange;
window.resetMenuFilters = resetMenuFilters;
window.handleGlobalSearch = handleGlobalSearch;
window.selectSearchResult = selectSearchResult;
window.toggleCartDrawer = toggleCartDrawer;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.goToCheckout = goToCheckout;
window.selectPaymentMethod = selectPaymentMethod;
window.submitOrder = submitOrder;
window.closeOrderModalAndGoTo = closeOrderModalAndGoTo;
window.applyCouponCode = applyCouponCode;
window.applyCouponFromDrawer = applyCouponFromDrawer;
window.removeCouponCode = removeCouponCode;
window.copyCouponCode = copyCouponCode;
window.loadUserOrders = loadUserOrders;
window.handleProfileUpdate = handleProfileUpdate;
