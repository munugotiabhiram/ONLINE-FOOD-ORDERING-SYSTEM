/**
 * FoodVerse 3D - Authentication Handler (Demo Login & Google OAuth 2.0)
 */

let authConfig = {
  isGoogleConfigured: false,
  googleClientId: null
};

async function initAuthPage() {
  try {
    const res = await API.get('/api/auth/config');
    if (res.success) {
      authConfig = res;

      // Update demo credentials display
      if (res.demoCustomer) {
        const emailEl = document.getElementById('demo-display-email');
        const passEl = document.getElementById('demo-display-pass');
        const emailInput = document.getElementById('demo-email-input');
        const passInput = document.getElementById('demo-password-input');

        if (emailEl) emailEl.textContent = res.demoCustomer.email;
        if (passEl) passEl.textContent = res.demoCustomer.password;
        if (emailInput && !emailInput.value) emailInput.value = res.demoCustomer.email;
        if (passInput && !passInput.value) passInput.value = res.demoCustomer.password;
      }

      // Configure Google OAuth
      updateGoogleAuthUI();
    }
  } catch (err) {
    console.error('Failed to load auth config:', err);
  }
}

function updateGoogleAuthUI() {
  const statusTitle = document.getElementById('google-status-title');
  const statusDesc = document.getElementById('google-status-desc');
  const gContainer = document.getElementById('g_id_signin_container');
  const customGoogleBtn = document.getElementById('btn-google-custom');

  if (authConfig.isGoogleConfigured && authConfig.googleClientId) {
    if (statusTitle) statusTitle.innerHTML = '✅ Google OAuth 2.0 Ready';
    if (statusDesc) statusDesc.innerHTML = 'Official Google sign-in is connected and verified with Client ID.';

    // Initialize official Google Identity Services
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        google.accounts.id.initialize({
          client_id: authConfig.googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        if (gContainer) {
          google.accounts.id.renderButton(gContainer, {
            theme: 'filled_black',
            size: 'large',
            shape: 'rectangular',
            text: 'continue_with',
            width: 320,
            logo_alignment: 'left'
          });
          if (customGoogleBtn) customGoogleBtn.style.display = 'none';
        }
      } catch (gErr) {
        console.warn('Google GSI render error:', gErr);
      }
    }
  } else {
    if (statusTitle) statusTitle.innerHTML = '⚙️ Google OAuth Setup Instruction';
    if (statusDesc) {
      statusDesc.innerHTML = `
        To enable signing in with your personal Google account:
        <br>1. Open <b style="color:#ffffff;">.env</b> file in project root.
        <br>2. Set <code style="color:#ff9900; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px;">GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com</code>
        <br>3. Restart the server with <code style="color:#ff9900; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px;">npm start</code>.
      `;
    }
  }
}

// Callback when user completes official Google One Tap / Google Button sign-in
async function handleGoogleCredentialResponse(response) {
  try {
    API.showToast('Verifying Google account credential...', 'info');

    const res = await API.post('/api/auth/google', {
      credential: response.credential
    });

    if (res.success && res.token) {
      API.setToken(res.token);
      API.setUser(res.user);
      API.showToast(`Welcome ${res.user.name}! Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } else {
      API.showToast(res.message || 'Google authentication failed.', 'error');
    }
  } catch (err) {
    API.showToast(err.message || 'Google authentication error.', 'error');
  }
}

// Fallback trigger when user clicks the custom Google button
function triggerGoogleOAuth() {
  if (authConfig.isGoogleConfigured && window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.prompt();
  } else {
    // Show a helpful popup modal with instant 1-click option to Demo Login
    showGoogleSetupModal();
  }
}

function showGoogleSetupModal() {
  let modal = document.getElementById('google-help-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'google-help-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" style="text-align: center; max-width: 480px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔑</div>
        <h3 style="font-size: 22px; color: #ffffff; margin-bottom: 8px;">Google OAuth 2.0 Setup</h3>
        <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.5;">
          To sign in with your personal Google account, your <code style="color:#ff9900;">GOOGLE_CLIENT_ID</code> must be configured in the <code style="color:#ff9900;">.env</code> file.
        </p>
        <div style="background: rgba(255, 94, 58, 0.08); border: 1px solid rgba(255, 94, 58, 0.25); border-radius: var(--radius-md); padding: 14px; text-align: left; margin-bottom: 22px; font-size: 13px;">
          <div style="font-weight: 700; color: #ff8b6e; margin-bottom: 6px;">Want to explore the complete dashboard right now?</div>
          <p style="color: #cbd5e1; margin: 0;">You can enter the entire 3D food ordering dashboard instantly using <b>Option 1: Demo Login</b>!</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-primary-3d" onclick="closeGoogleHelpModalAndDemoLogin()" style="width: 100%;">
            <span>🚀 Enter Dashboard Now (Demo Account)</span>
          </button>
          <button class="btn-secondary-3d" onclick="closeGoogleHelpModal()" style="width: 100%;">
            <span>Close</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.add('active');
}

function closeGoogleHelpModal() {
  const modal = document.getElementById('google-help-modal');
  if (modal) modal.classList.remove('active');
}

function closeGoogleHelpModalAndDemoLogin() {
  closeGoogleHelpModal();
  switchLoginTab('demo');
  handleDemoSubmit();
}

// Handle Option 1: Demo Customer Login form submit
async function handleDemoSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('demo-email-input');
  const passwordInput = document.getElementById('demo-password-input');
  const submitBtn = document.getElementById('demo-submit-btn');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!email || !password) {
    API.showToast('Please enter demo email and password.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Authenticating...</span>';
  }

  try {
    const res = await API.post('/api/auth/demo', { email, password });
    if (res.success && res.token) {
      API.setToken(res.token);
      API.setUser(res.user);
      API.showToast(res.message || 'Welcome to FoodVerse 3D!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 600);
    } else {
      API.showToast(res.message || 'Authentication failed.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🚀 Enter Dashboard (Demo Customer)</span>';
      }
    }
  } catch (err) {
    API.showToast(err.message || 'Error logging in.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀 Enter Dashboard (Demo Customer)</span>';
    }
  }
}

// Quick Demo Admin Login
async function loginAsDemoAdmin() {
  try {
    API.showToast('Authenticating Demo Admin...', 'info');
    const res = await API.post('/api/auth/demo', { role: 'admin' });
    if (res.success && res.token) {
      API.setToken(res.token);
      API.setUser(res.user);
      API.showToast('Welcome Administrator! Loading Admin Portal...', 'success');
      setTimeout(() => {
        window.location.href = '/admin.html';
      }, 700);
    }
  } catch (err) {
    API.showToast(err.message || 'Admin authentication failed.', 'error');
  }
}

// Logout
async function handleLogout() {
  try {
    await API.post('/api/auth/logout', {});
  } catch (e) {
    // Ignore error
  }
  API.clearAuth();
  API.showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 500);
}

window.initAuthPage = initAuthPage;
window.handleDemoSubmit = handleDemoSubmit;
window.loginAsDemoAdmin = loginAsDemoAdmin;
window.triggerGoogleOAuth = triggerGoogleOAuth;
window.handleLogout = handleLogout;
window.closeGoogleHelpModal = closeGoogleHelpModal;
window.closeGoogleHelpModalAndDemoLogin = closeGoogleHelpModalAndDemoLogin;
