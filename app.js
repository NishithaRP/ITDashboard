// ============================================================
// MAIN APP CONTROLLER
// ============================================================

let currentLocation = LOCATIONS[0];
let currentModule = MODULES[0].id;

function appInit() { renderApp(); }

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
      ${LOCATIONS.map(loc=>`<div class="loc-tab ${loc===currentLocation?'active':''}" onclick="switchLocation('${loc}')">${loc}</div>`).join('')}
    </div>
    <div class="module-nav">
      ${MODULES.map(m=>`<div class="mod-tab ${m.id===currentModule?'active':''}" onclick="switchModule('${m.id}')">${m.icon} ${m.label}</div>`).join('')}
    </div>
    <div class="content-area" id="module-content"></div>
  `;
  const ud = document.getElementById('user-display');
  if (ud) ud.textContent = currentUser ? currentUser.name : '';
  renderCurrentModule();
}

function renderCurrentModule() {
  const el = document.getElementById('module-content');
  if (!el) return;
  switch(currentModule) {
    case 'wifi':      wifiRender(currentLocation); break;
    case 'inventory': inventoryRender(currentLocation); break;
    case 'printers':  printersRender(currentLocation); break;
    case 'mobiles':   mobilesRender(currentLocation); break;
    case 'ip':        ipRender(currentLocation); break;
    case 'systems':   systemsRender(currentLocation); break;
    case 'employees': employeesRender(currentLocation); break;
  }
}

function switchLocation(loc) { currentLocation=loc; renderApp(); }

function switchModule(mod) {
  currentModule=mod;
  document.querySelectorAll('.mod-tab').forEach(t=>t.classList.toggle('active',t.textContent.trim().includes(MODULES.find(m=>m.id===mod).label)));
  document.querySelectorAll('.loc-tab').forEach(t=>t.classList.toggle('active',t.textContent.trim()===currentLocation));
  document.querySelector('.location-badge').textContent=currentLocation;
  renderCurrentModule();
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('app').innerHTML=`${renderLogin()}<div id="main-app" style="display:none;"></div>`;
  authInit();
});
