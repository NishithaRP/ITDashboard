// ============================================================
// MAIN APP CONTROLLER
// ============================================================

let currentLocation = LOCATIONS[0];
let currentModule = MODULES[0].id;

function appInit() {
  renderApp();
}

function renderApp() {
  const app = document.getElementById('main-app');
  app.innerHTML = `
    <div class="app-header">
      <div class="header-left">
        <div class="header-brand">POLYDIME IT</div>
        <div class="header-divider"></div>
        <div class="location-badge">${currentLocation}</div>
      </div>
      <div class="header-right">
        <span class="user-info" id="user-display"></span>
        <button class="btn-logout" onclick="doLogout()">Sign Out</button>
      </div>
    </div>

    <div class="location-tabs">
      ${LOCATIONS.map(loc => `
        <div class="loc-tab ${loc === currentLocation ? 'active' : ''}"
          onclick="switchLocation('${loc}')">${loc}</div>`).join('')}
    </div>

    <div class="module-nav">
      ${MODULES.map(m => `
        <div class="mod-tab ${m.id === currentModule ? 'active' : ''}"
          onclick="switchModule('${m.id}')">${m.icon} ${m.label}</div>`).join('')}
    </div>

    <div class="content-area" id="module-content"></div>
  `;
  document.getElementById('user-display').textContent = currentUser ? currentUser.name : '';
  renderCurrentModule();
}

function renderCurrentModule() {
  const el = document.getElementById('module-content');
  if (!el) return;
  switch(currentModule) {
    case 'wifi':      el.innerHTML = wifiRender(currentLocation); break;
    case 'inventory': el.innerHTML = inventoryRender(currentLocation); break;
    case 'printers':  el.innerHTML = printersRender(currentLocation); break;
    case 'mobiles':   el.innerHTML = mobilesRender(currentLocation); break;
    case 'ip':        el.innerHTML = ipRender(currentLocation); break;
    case 'systems':   el.innerHTML = systemsRender(currentLocation); break;
  }
}

function switchLocation(loc) {
  currentLocation = loc;
  renderApp();
}

function switchModule(mod) {
  currentModule = mod;
  renderCurrentModule();
  // Re-render header badge
  document.querySelector('.location-badge').textContent = currentLocation;
  // Update module tabs
  document.querySelectorAll('.mod-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mod-tab').forEach(t => {
    if (t.textContent.trim().includes(MODULES.find(m => m.id === mod).label)) {
      t.classList.add('active');
    }
  });
  // Update location tabs
  document.querySelectorAll('.loc-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.trim() === currentLocation);
  });
}

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', () => {
  // Inject login HTML
  document.getElementById('app').innerHTML = `
    ${renderLogin()}
    <div id="main-app" style="display:none;"></div>
  `;
  authInit();
});
