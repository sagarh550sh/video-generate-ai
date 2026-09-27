const API_BASE = '/api';

let currentUser = null;

// Initialize app
async function init() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`);
    if (response.ok) {
      currentUser = await response.json();
      showAuthenticatedUI();
    } else {
      showUnauthenticatedUI();
    }
  } catch (error) {
    console.error('Init error:', error);
    showUnauthenticatedUI();
  }
}

// ===== UI Rendering =====

function showUnauthenticatedUI() {
  const navMenu = document.getElementById('nav-menu');
  navMenu.innerHTML = `
    <button class="nav-btn" onclick="showLoginForm()">Sign In</button>
    <button class="nav-btn" onclick="showRegisterForm()">Sign Up</button>
  `;

  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="panel" style="max-width: 400px; margin: 40px auto;">
      <h2>Welcome</h2>
      <p>Sign in or create an account to generate AI videos.</p>
      <button onclick="showLoginForm()" style="width: 100%; margin-top: 20px;">Sign In</button>
      <button onclick="showRegisterForm()" style="width: 100%; margin-top: 10px; background: rgba(139, 92, 246, 0.2); color: var(--text);">Create Account</button>
    </div>
  `;
}

function showLoginForm() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="panel" style="max-width: 400px; margin: 40px auto;">
      <h2>Sign In</h2>
      <form onsubmit="handleLogin(event)">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" required />
        
        <label for="login-password">Password</label>
        <input type="password" id="login-password" required />
        
        <button type="submit">Sign In</button>
        <div id="login-status" class="status" style="display: none;"></div>
      </form>
      <p style="text-align: center; color: var(--muted);">New user? <a href="#" onclick="showRegisterForm()" style="color: var(--primary-2);">Sign up here</a></p>
    </div>
  `;
}

function showRegisterForm() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="panel" style="max-width: 400px; margin: 40px auto;">
      <h2>Create Account</h2>
      <form onsubmit="handleRegister(event)">
        <label for="register-name">Name</label>
        <input type="text" id="register-name" />
        
        <label for="register-email">Email</label>
        <input type="email" id="register-email" required />
        
        <label for="register-password">Password</label>
        <input type="password" id="register-password" required />
        
        <button type="submit">Create Account</button>
        <div id="register-status" class="status" style="display: none;"></div>
      </form>
      <p style="text-align: center; color: var(--muted);">Already have an account? <a href="#" onclick="showLoginForm()" style="color: var(--primary-2);">Sign in here</a></p>
    </div>
  `;
}

function showAuthenticatedUI() {
  const navMenu = document.getElementById('nav-menu');
  navMenu.innerHTML = `
    <button class="nav-btn" onclick="showGeneratorUI()">Generate</button>
    <button class="nav-btn" onclick="showGalleryUI()">Gallery</button>
    <button class="nav-btn" onclick="handleLogout()">Logout</button>
  `;

  showGeneratorUI();
}

function showGeneratorUI() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="section">
      <div class="panel">
        <div class="panel-title">Create Video</div>
        <form id="generate-form">
          <label for="prompt">Prompt</label>
          <textarea id="prompt" placeholder="Describe the video you want to generate..." required></textarea>
          
          <label for="style">Style</label>
          <select id="style">
            <option value="cinematic">Cinematic</option>
            <option value="nature">Nature</option>
            <option value="futuristic">Futuristic</option>
            <option value="fantasy">Fantasy</option>
            <option value="product">Product</option>
          </select>
          
          <label for="duration">Duration (seconds)</label>
          <input type="number" id="duration" value="8" min="3" max="20" />
          
          <button type="submit">Generate Video</button>
          <div id="gen-status" class="status" style="display: none;"></div>
        </form>
      </div>
      
      <div class="panel">
        <div class="panel-title">Preview</div>
        <div class="video-frame">
          <video id="video-player" controls playsinline muted></video>
          <div id="preview-empty" class="empty-state">Your video will appear here</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('generate-form').addEventListener('submit', handleGenerate);
}

function showGalleryUI() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="panel">
      <div class="panel-title">Your Videos</div>
      <div id="gallery-list" class="video-grid">Loading...</div>
    </div>
  `;

  loadGallery();
}

// ===== Auth Handlers =====

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const statusEl = document.getElementById('login-status');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      showAuthenticatedUI();
    } else {
      statusEl.textContent = data.error || 'Login failed';
      statusEl.classList.add('error');
      statusEl.style.display = 'block';
    }
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
    statusEl.style.display = 'block';
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const statusEl = document.getElementById('register-status');

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = { id: data.userId, email };
      showAuthenticatedUI();
    } else {
      statusEl.textContent = data.error || 'Registration failed';
      statusEl.classList.add('error');
      statusEl.style.display = 'block';
    }
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
    statusEl.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    currentUser = null;
    showUnauthenticatedUI();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ===== Video Generation Handler =====

async function handleGenerate(event) {
  event.preventDefault();
  const prompt = document.getElementById('prompt').value;
  const style = document.getElementById('style').value;
  const duration = Number(document.getElementById('duration').value);
  const statusEl = document.getElementById('gen-status');
  const btn = event.target.querySelector('button[type="submit"]');

  if (!prompt.trim()) {
    statusEl.textContent = 'Please enter a prompt';
    statusEl.classList.add('error');
    statusEl.style.display = 'block';
    return;
  }

  statusEl.textContent = '<span class="loader"></span>Generating...';
  statusEl.classList.remove('error');
  statusEl.style.display = 'block';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/videos/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style, duration })
    });

    const data = await response.json();

    if (response.ok) {
      statusEl.innerHTML = '<span class="loader"></span>Processing... Check back soon';
      statusEl.classList.remove('error');
      // Poll for completion
      pollVideoStatus(data.videoId);
    } else {
      statusEl.textContent = data.error || 'Generation failed';
      statusEl.classList.add('error');
    }
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
  } finally {
    btn.disabled = false;
  }
}

// Poll for video completion
async function pollVideoStatus(videoId) {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        const statusEl = document.getElementById('gen-status');

        if (data.video.status === 'completed') {
          clearInterval(interval);
          document.getElementById('video-player').src = data.video.video_url;
          document.getElementById('preview-empty').style.display = 'none';
          statusEl.textContent = '✅ Video ready!';
          statusEl.classList.add('success');
          document.getElementById('prompt').value = '';
        } else if (data.video.status === 'failed') {
          clearInterval(interval);
          statusEl.textContent = '❌ Generation failed';
          statusEl.classList.add('error');
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 5000); // Poll every 5 seconds
}

// ===== Gallery =====

async function loadGallery() {
  try {
    const response = await fetch(`${API_BASE}/videos`);
    if (!response.ok) throw new Error('Failed to load videos');

    const data = await response.json();
    const listEl = document.getElementById('gallery-list');

    if (data.videos.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No videos yet. Create one!</div>';
      return;
    }

    listEl.innerHTML = data.videos
      .map(
        (v) => `
      <div class="video-card">
        <div class="video-card-header">
          <div><span class="video-card-status ${v.status}">${v.status}</span></div>
        </div>
        <div class="video-card-prompt">${v.prompt}</div>
        ${v.video_url ? `<video style="max-height: 200px; width: 100%; border-radius: 8px;" controls><source src="${v.video_url}" type="video/mp4"></video>` : ''}
        <div class="video-card-meta">
          <span>📹 ${v.duration}s</span>
          <span>🎨 ${v.style}</span>
          <span>⏰ ${new Date(v.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    document.getElementById('gallery-list').innerHTML =
      `<div class="empty-state">Error loading videos: ${error.message}</div>`;
  }
}

// Start app
init();
