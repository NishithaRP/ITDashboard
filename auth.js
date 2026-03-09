// ============================================================
// AUTH MODULE
// ============================================================

// Default users - change these passwords after first login
// To add Supabase auth later, replace this with Supabase Auth
const USERS = [
  { username: 'admin',   password: 'Polydime@2024', role: 'admin',    name: 'IT Admin' },
  { username: 'itexec',  password: 'IT@exec2024',   role: 'admin',    name: 'IT Executive' },
  { username: 'viewer',  password: 'View@2024',     role: 'viewer',   name: 'Viewer' }
];

let currentUser = null;

function authInit() {
  const saved = sessionStorage.getItem('polydime_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  document.getElementById('user-display').textContent = currentUser.name;
  appInit();
}

function doLogin() {
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const user = USERS.find(x => x.username === u && x.password === p);
  if (user) {
    currentUser = user;
    sessionStorage.setItem('polydime_user', JSON.stringify(user));
    errEl.style.display = 'none';
    showApp();
  } else {
    errEl.style.display = 'block';
    errEl.textContent = 'Invalid username or password.';
    document.getElementById('login-password').value = '';
  }
}

function doLogout() {
  sessionStorage.removeItem('polydime_user');
  currentUser = null;
  showLogin();
}

function renderLogin() {
  return `
  <div id="login-screen">
    <div class="login-card">
      <div class="login-logo">
        <div class="company">Polydime Plastics International</div>
        <h1>Polydime IT</h1>
        <div class="subtitle">Sign in to your account</div>
      </div>
      <div id="login-error" class="login-error"></div>
      <div class="form-group">
        <label>Username</label>
        <input id="login-username" type="text" placeholder="Enter username" autocomplete="username"/>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input id="login-password" type="password" placeholder="Enter password" autocomplete="current-password"
          onkeydown="if(event.key==='Enter') doLogin()"/>
      </div>
      <button class="btn btn-primary" onclick="doLogin()">Sign In</button>
    </div>
  </div>`;
}
