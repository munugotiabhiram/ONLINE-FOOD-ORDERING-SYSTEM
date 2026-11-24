/**
 * FoodVerse 3D - Admin Dashboard Controller
 */

let AdminState = {
  user: null,
  stats: null,
  orders: [],
  foodItems: [],
  categories: [],
  customers: [],
  currentTab: 'overview'
};

document.addEventListener('DOMContentLoaded', async () => {
  await initAdminPortal();
});

async function initAdminPortal() {
  const token = API.getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await API.get('/api/auth/me');
    if (!res.success || !res.user) {
      window.location.href = '/login.html';
      return;
    }

    AdminState.user = res.user;

    // Check if role is admin
    if (res.user.role !== 'admin') {
      document.getElementById('access-denied-box').style.display = 'block';
      document.getElementById('admin-authorized-content').style.display = 'none';
      return;
    }

    // User is authorized admin
    document.getElementById('access-denied-box').style.display = 'none';
    document.getElementById('admin-authorized-content').style.display = 'block';

    // Populate admin profile
    const adminName = document.getElementById('admin-user-name');
    const adminAvatar = document.getElementById('admin-user-avatar');
    if (adminName) adminName.textContent = res.user.name;
    if (adminAvatar) adminAvatar.src = res.user.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80';

    // Load initial data
    await Promise.all([
      loadAdminCategories(),
      loadAdminStats()
    ]);
  } catch (err) {
    console.error('Admin Auth Check Failed:', err);
    window.location.href = '/login.html';
  }
}

async function switchLoginAsAdmin() {
  try {
    API.showToast('Switching to Demo Admin account...', 'info');
    const res = await API.post('/api/auth/demo', { role: 'admin' });
    if (res.success && res.token) {
      API.setToken(res.token);
      API.setUser(res.user);
      API.showToast('Authorized as Admin! Reloading...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to switch to admin.', 'error');
  }
}

function switchAdminTab(tabName, event) {
  if (event) event.preventDefault();

  AdminState.currentTab = tabName;
  window.location.hash = tabName;

  // Toggle active tab sections
  document.querySelectorAll('.admin-tab-section').forEach(sec => sec.style.display = 'none');
  const target = document.getElementById(`tab-${tabName}`);
  if (target) target.style.display = 'block';

  // Toggle sidebar active nav
  document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Tab hooks
  if (tabName === 'overview') loadAdminStats();
  if (tabName === 'orders') loadAdminOrders();
  if (tabName === 'food') loadAdminFoodCatalog();
  if (tabName === 'customers') loadAdminCustomers();
}

/* ====================================================================
   OVERVIEW & ANALYTICS
   ==================================================================== */
async function loadAdminStats() {
  try {
    const res = await API.get('/api/admin/stats');
    if (res.success && res.stats) {
      AdminState.stats = res.stats;

      const s = res.stats;
      const revEl = document.getElementById('stat-revenue');
      const ordEl = document.getElementById('stat-orders');
      const cusEl = document.getElementById('stat-customers');
      const disEl = document.getElementById('stat-dishes');

      if (revEl) revEl.textContent = `$${s.totalRevenue.toFixed(2)}`;
      if (ordEl) ordEl.textContent = s.totalOrders;
      if (cusEl) cusEl.textContent = s.totalCustomers;
      if (disEl) disEl.textContent = s.availableFoodItems;

      // Render Charts
      renderOrderStatusChart(s.statusBreakdown);
      renderCategoryDistChart(s.categoryStats);

      // Render Recent Orders preview
      renderOverviewRecentOrders(s.recentOrders);
    }
  } catch (err) {
    console.error('Error loading admin stats:', err);
  }
}

function renderOverviewRecentOrders(orders) {
  const tbody = document.getElementById('overview-recent-orders-tbody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No recent orders.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusClass = o.order_status.replace(/\s+/g, '-');
    return `
      <tr>
        <td style="font-family: monospace; font-weight: 700; color: #ffffff;">#${o.order_code}</td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td style="font-weight: 700; color: var(--secondary);">$${parseFloat(o.total).toFixed(2)}</td>
        <td>${escapeHtml(o.payment_method)}</td>
        <td><span class="order-status-pill ${statusClass}">${o.order_status}</span></td>
        <td>
          <button class="btn-secondary-3d" style="font-size: 11px; padding: 4px 10px;" onclick="switchAdminTab('orders')">
            Manage
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ====================================================================
   CUSTOM HTML5 CANVAS CHARTS
   ==================================================================== */
function renderOrderStatusChart(statusMap) {
  const canvas = document.getElementById('chart-order-status');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 240 * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = 240;

  ctx.clearRect(0, 0, width, height);

  const statuses = [
    { label: 'Pending', count: statusMap['Pending'] || 0, color: '#fbbf24' },
    { label: 'Preparing', count: statusMap['Preparing'] || 0, color: '#60a5fa' },
    { label: 'Out for Delivery', count: statusMap['Out for Delivery'] || 0, color: '#c084fc' },
    { label: 'Delivered', count: statusMap['Delivered'] || 0, color: '#34d399' },
    { label: 'Cancelled', count: statusMap['Cancelled'] || 0, color: '#f87171' }
  ];

  const total = statuses.reduce((acc, s) => acc + s.count, 0);

  if (total === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No order data recorded yet', width / 2, height / 2);
    return;
  }

  // Draw Donut Chart
  const centerX = width * 0.35;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  const innerRadius = radius * 0.58;

  let startAngle = -Math.PI / 2;

  statuses.forEach(s => {
    if (s.count === 0) return;
    const sliceAngle = (s.count / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();

    startAngle = endAngle;
  });

  // Inner center text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, centerX, centerY - 6);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Orders', centerX, centerY + 14);

  // Draw Legend on right side
  let legendY = 35;
  statuses.forEach(s => {
    const pct = ((s.count / total) * 100).toFixed(0);

    // Color dot
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(width * 0.68, legendY + 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Label & count
    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${s.label}: ${s.count} (${pct}%)`, width * 0.68 + 12, legendY + 9);

    legendY += 34;
  });
}

function renderCategoryDistChart(catStats) {
  const canvas = document.getElementById('chart-category-dist');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 240 * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = 240;

  ctx.clearRect(0, 0, width, height);

  if (!catStats || catStats.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No categories available', width / 2, height / 2);
    return;
  }

  const items = catStats.slice(0, 6);
  const maxVal = Math.max(...items.map(i => i.count), 1);

  const startX = 110;
  const barWidthMax = width - startX - 45;
  let barY = 24;
  const barHeight = 16;
  const gap = 34;

  items.forEach((item, index) => {
    const currentBarWidth = Math.max(8, (item.count / maxVal) * barWidthMax);

    // Label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 12.5px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.name, startX - 12, barY + 12);

    // Gradient bar
    const grad = ctx.createLinearGradient(startX, barY, startX + currentBarWidth, barY);
    grad.addColorStop(0, '#ff5e3a');
    grad.addColorStop(1, '#ff9900');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(startX, barY, currentBarWidth, barHeight, 6);
    ctx.fill();

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.count, startX + currentBarWidth + 8, barY + 13);

    barY += gap;
  });
}

/* ====================================================================
   MANAGE ORDERS
   ==================================================================== */
async function loadAdminOrders(status = 'all') {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading orders...</td></tr>`;

  try {
    const url = status && status !== 'all' ? `/api/admin/orders?status=${encodeURIComponent(status)}` : '/api/admin/orders';
    const res = await API.get(url);
    if (res.success) {
      AdminState.orders = res.orders;

      if (res.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No orders found matching status "${status}".</td></tr>`;
        return;
      }

      tbody.innerHTML = res.orders.map(o => {
        const statusClass = o.order_status.replace(/\s+/g, '-');
        const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${escapeHtml(i.item_name)}`).join(', ');

        return `
          <tr>
            <td>
              <div style="font-family: monospace; font-weight: 700; color: #ffffff;">#${o.order_code}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${formatAdminDate(o.created_at)}</div>
            </td>
            <td>
              <div style="font-weight: 600; color: #ffffff;">${escapeHtml(o.customer_name)}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(o.customer_phone)}</div>
              <div style="font-size: 11px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(o.delivery_address)}</div>
            </td>
            <td style="font-size: 12.5px; max-width: 220px;">${itemsSummary || '1x Food Order'}</td>
            <td style="font-family: Outfit; font-weight: 700; color: var(--secondary); font-size: 16px;">$${parseFloat(o.total).toFixed(2)}</td>
            <td><span class="order-status-pill ${statusClass}">${o.order_status}</span></td>
            <td>
              <select class="filter-select" style="padding: 6px 10px; font-size: 12px;" onchange="updateOrderStatus(${o.id}, this.value)">
                <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Preparing" ${o.order_status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--accent-red); text-align: center; padding: 24px;">Failed to load orders: ${err.message}</td></tr>`;
  }
}

function filterAdminOrders(status) {
  loadAdminOrders(status);
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await API.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
    if (res.success) {
      API.showToast(res.message, 'success');
      loadAdminOrders(document.getElementById('admin-orders-filter').value);
      loadAdminStats();
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to update order status.', 'error');
  }
}

/* ====================================================================
   FOOD CATALOG MANAGEMENT (CRUD)
   ==================================================================== */
async function loadAdminCategories() {
  try {
    const res = await API.get('/api/categories');
    if (res.success) {
      AdminState.categories = res.categories;
      const select = document.getElementById('food-form-category');
      if (select) {
        select.innerHTML = res.categories.map(c => `
          <option value="${c.id}">${c.icon_3d} ${escapeHtml(c.name)}</option>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading categories for admin:', err);
  }
}

async function loadAdminFoodCatalog() {
  const tbody = document.getElementById('admin-food-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading food catalog...</td></tr>`;

  try {
    const res = await API.get('/api/admin/food');
    if (res.success) {
      AdminState.foodItems = res.foodItems;

      tbody.innerHTML = res.foodItems.map(item => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.image_url}" alt="${escapeHtml(item.name)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;">
              <div>
                <div style="font-weight: 700; color: #ffffff;">${escapeHtml(item.name)}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(item.prep_time || '20 min')}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(item.category_name || '')}</td>
          <td style="font-family: Outfit; font-weight: 700; color: var(--secondary);">$${parseFloat(item.price).toFixed(2)}</td>
          <td>⭐ ${item.rating}</td>
          <td>
            <span style="font-size: 12px; font-weight: 700; color: ${item.is_veg ? '#34d399' : '#f87171'};">
              ${item.is_veg ? '🌱 Veg' : '🍖 Non-Veg'}
            </span>
          </td>
          <td>
            <span style="font-size: 12px; color: ${item.is_available ? '#34d399' : '#f87171'};">
              ${item.is_available ? '● Active' : '○ Inactive'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn-secondary-3d" style="font-size: 11px; padding: 4px 10px;" onclick="openEditFoodModal(${item.id})">
                ✏️ Edit
              </button>
              <button class="btn-secondary-3d" style="font-size: 11px; padding: 4px 10px; color: #f87171;" onclick="deleteFoodItem(${item.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--accent-red); text-align: center; padding: 24px;">Failed to load food: ${err.message}</td></tr>`;
  }
}

function openAddFoodModal() {
  document.getElementById('food-modal-title').textContent = 'Add New Food Item';
  document.getElementById('food-form-id').value = '';
  document.getElementById('food-form-name').value = '';
  document.getElementById('food-form-price').value = '';
  document.getElementById('food-form-prep').value = '20-25 min';
  document.getElementById('food-form-image').value = '';
  document.getElementById('food-form-desc').value = '';
  document.getElementById('food-form-veg').value = '0';
  document.getElementById('food-form-badge').value = 'New';

  const modal = document.getElementById('food-modal');
  if (modal) modal.classList.add('active');
}

function openEditFoodModal(id) {
  const item = AdminState.foodItems.find(f => f.id === id);
  if (!item) return;

  document.getElementById('food-modal-title').textContent = `Edit "${item.name}"`;
  document.getElementById('food-form-id').value = item.id;
  document.getElementById('food-form-name').value = item.name;
  document.getElementById('food-form-category').value = item.category_id;
  document.getElementById('food-form-price').value = item.price;
  document.getElementById('food-form-prep').value = item.prep_time || '20-25 min';
  document.getElementById('food-form-image').value = item.image_url;
  document.getElementById('food-form-desc').value = item.description || '';
  document.getElementById('food-form-veg').value = item.is_veg ? '1' : '0';
  document.getElementById('food-form-badge').value = item.badge || '';

  const modal = document.getElementById('food-modal');
  if (modal) modal.classList.add('active');
}

function closeFoodModal() {
  const modal = document.getElementById('food-modal');
  if (modal) modal.classList.remove('active');
}

async function handleFoodFormSubmit(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('food-form-id').value;
  const name = document.getElementById('food-form-name').value.trim();
  const category_id = document.getElementById('food-form-category').value;
  const price = document.getElementById('food-form-price').value;
  const prep_time = document.getElementById('food-form-prep').value.trim();
  const image_url = document.getElementById('food-form-image').value.trim();
  const description = document.getElementById('food-form-desc').value.trim();
  const is_veg = document.getElementById('food-form-veg').value === '1';
  const badge = document.getElementById('food-form-badge').value.trim();

  const payload = {
    name,
    category_id,
    price,
    prep_time,
    image_url,
    description,
    is_veg,
    badge
  };

  const saveBtn = document.getElementById('btn-save-food');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Saving...</span>';
  }

  try {
    let res;
    if (id) {
      res = await API.put(`/api/admin/food/${id}`, payload);
    } else {
      res = await API.post('/api/admin/food', payload);
    }

    if (res.success) {
      API.showToast(res.message, 'success');
      closeFoodModal();
      loadAdminFoodCatalog();
      loadAdminStats();
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to save food item.', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>💾 Save Food Item</span>';
    }
  }
}

async function deleteFoodItem(id) {
  const item = AdminState.foodItems.find(f => f.id === id);
  const name = item ? item.name : 'this item';

  if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
    return;
  }

  try {
    const res = await API.delete(`/api/admin/food/${id}`);
    if (res.success) {
      API.showToast(res.message, 'success');
      loadAdminFoodCatalog();
      loadAdminStats();
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to delete food item.', 'error');
  }
}

/* ====================================================================
   CUSTOMERS DIRECTORY
   ==================================================================== */
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading customer list...</td></tr>`;

  try {
    const res = await API.get('/api/admin/customers');
    if (res.success) {
      AdminState.customers = res.customers;

      if (res.customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No registered customers yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = res.customers.map(c => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${c.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
              <div style="font-weight: 600; color: #ffffff;">${escapeHtml(c.name)}</div>
            </div>
          </td>
          <td>${escapeHtml(c.email)}</td>
          <td>${escapeHtml(c.phone || 'N/A')}</td>
          <td>
            <span style="font-size: 11px; padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.08); color: #ffffff;">
              ${c.auth_provider === 'google' ? '🌐 Google OAuth' : '🔑 Demo'}
            </span>
          </td>
          <td style="font-weight: 700; color: #ffffff;">${c.orders_count} orders</td>
          <td style="font-family: Outfit; font-weight: 700; color: var(--secondary);">$${parseFloat(c.total_spend).toFixed(2)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--accent-red); text-align: center; padding: 24px;">Failed to load customers: ${err.message}</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAdminDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Global exposes
window.switchAdminTab = switchAdminTab;
window.switchLoginAsAdmin = switchLoginAsAdmin;
window.filterAdminOrders = filterAdminOrders;
window.loadAdminOrders = loadAdminOrders;
window.updateOrderStatus = updateOrderStatus;
window.openAddFoodModal = openAddFoodModal;
window.openEditFoodModal = openEditFoodModal;
window.closeFoodModal = closeFoodModal;
window.handleFoodFormSubmit = handleFoodFormSubmit;
window.deleteFoodItem = deleteFoodItem;
