// ============================================================
// WIFI MODULE — Supabase version
// ============================================================

let wifiEditId = null;
let wifiCurrentLocation = '';

async function wifiRender(location) {
  wifiCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const connections = await DB.getWifi(location);
  if (el) el.innerHTML = wifiHTML(location, connections) + wifiModal();
}

function wifiHTML(location, connections) {
  return `<div>
    <div class="section-header">
      <div><div class="section-title">📶 WiFi Connections</div>
      <div class="section-subtitle">${location} — ${connections.length} connection(s)</div></div>
      <button class="btn btn-secondary" onclick="wifiOpenAdd()">+ Add Connection</button>
    </div>
    ${connections.length === 0 ? `<div class="empty-state"><div class="icon">📶</div><h3>No connections yet</h3><p>Add a WiFi connection to get started</p></div>` :
      connections.map(c => wifiConnectionCard(c)).join('')}
  </div>`;
}

function wifiConnectionCard(conn) {
  const months = (conn.months || []).slice().sort((a,b) => b.month.localeCompare(a.month));
  const latest = months[0];
  return `
  <div class="wifi-connection-card card" style="padding:0;margin-bottom:16px;">
    <div class="wifi-connection-header">
      <div>
        <div class="wifi-conn-name">${conn.name}</div>
        <div class="wifi-conn-meta">Acc# ${conn.accountNumber} &nbsp;|&nbsp; ${conn.subscriptionNumber} &nbsp;|&nbsp;
          ${latest ? `<span class="badge badge-green">${latest.gbAmount} GB</span> &nbsp; LKR ${parseFloat(latest.price).toLocaleString()}` : 'No monthly data'}</div>
      </div>
      <div class="action-btns">
        <button class="btn btn-small btn-secondary" onclick="wifiAddMonth('${conn.id}')">+ Month</button>
        <button class="btn btn-small btn-secondary" onclick="wifiOpenEdit('${conn.id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="wifiDelete('${conn.id}')">Del</button>
      </div>
    </div>
    <div class="table-wrap">
      <table class="wifi-months-table">
        <thead><tr><th>Month</th><th>GB Package</th><th>Base Price</th><th>Extra GB</th><th>Extra Cost</th><th>Total</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          ${months.length === 0 ? `<tr><td colspan="8" style="text-align:center;color:var(--text2);padding:16px;">No monthly records</td></tr>` :
            months.map(m => `<tr>
              <td><strong>${formatMonth(m.month)}</strong></td>
              <td><span class="badge badge-blue">${m.gbAmount} GB</span></td>
              <td>LKR ${parseFloat(m.price).toLocaleString()}</td>
              <td>${m.extraGb ? m.extraGb+' GB' : '—'}</td>
              <td>${m.extraCost ? 'LKR '+parseFloat(m.extraCost).toLocaleString() : '—'}</td>
              <td><strong>LKR ${(parseFloat(m.price)+parseFloat(m.extraCost||0)).toLocaleString()}</strong></td>
              <td style="color:var(--text2);font-size:12px;">${m.notes||'—'}</td>
              <td><button class="btn btn-small btn-danger" onclick="wifiDeleteMonth('${conn.id}','${m.id}')">×</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function wifiModal() {
  return `
  <div id="wifi-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header"><div class="modal-title" id="wifi-modal-title">Add Connection</div><button class="btn-close" onclick="wifiCloseModal()">×</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Connection Name</label><input id="wf-name" type="text" placeholder="e.g. Dialog Fiber Office"/></div>
          <div class="form-group"><label>Account Number</label><input id="wf-acc" type="text" placeholder="Account #"/></div>
          <div class="form-group"><label>Subscription Number</label><input id="wf-sub" type="text" placeholder="Subscription #"/></div>
          <div class="form-group"><label>Default GB Package</label><input id="wf-gb" type="number" placeholder="e.g. 100"/></div>
          <div class="form-group span2"><label>Fixed Monthly Price (LKR)</label><input id="wf-price" type="number" placeholder="e.g. 4500"/></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="wifiCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="wifiSave()" style="width:auto">Save Connection</button>
      </div>
    </div>
  </div>
  <div id="wifi-month-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header"><div class="modal-title">Add Monthly Record</div><button class="btn-close" onclick="document.getElementById('wifi-month-modal').style.display='none'">×</button></div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text2);margin-bottom:16px;">Base GB and price are auto-filled. Edit if package changed this month.</p>
        <input type="hidden" id="wm-conn-id"/>
        <div class="form-grid">
          <div class="form-group"><label>Month</label><input id="wm-month" type="month"/></div>
          <div class="form-group"><label>GB Package</label><input id="wm-gb" type="number"/></div>
          <div class="form-group"><label>Base Price (LKR)</label><input id="wm-price" type="number"/></div>
          <div class="form-group"><label>Extra GB Added</label><input id="wm-extra-gb" type="number" placeholder="0"/></div>
          <div class="form-group"><label>Extra Cost (LKR)</label><input id="wm-extra-cost" type="number" placeholder="0"/></div>
          <div class="form-group span2"><label>Notes</label><input id="wm-notes" type="text" placeholder="Package upgrade, extra top-up..."/></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('wifi-month-modal').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="wifiSaveMonth()" style="width:auto">Save Month</button>
      </div>
    </div>
  </div>`;
}

// Store connections in memory for edit lookups
let _wifiConnCache = [];

async function wifiOpenAdd() {
  wifiEditId = null;
  document.getElementById('wifi-modal-title').textContent = 'Add Connection';
  ['wf-name','wf-acc','wf-sub','wf-gb','wf-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('wifi-modal').style.display = 'flex';
}

async function wifiOpenEdit(id) {
  const connections = await DB.getWifi(wifiCurrentLocation);
  const conn = connections.find(c => c.id === id);
  if (!conn) return;
  wifiEditId = id;
  document.getElementById('wifi-modal-title').textContent = 'Edit Connection';
  document.getElementById('wf-name').value = conn.name;
  document.getElementById('wf-acc').value = conn.accountNumber;
  document.getElementById('wf-sub').value = conn.subscriptionNumber;
  document.getElementById('wf-gb').value = conn.defaultGb;
  document.getElementById('wf-price').value = conn.defaultPrice;
  document.getElementById('wifi-modal').style.display = 'flex';
}

function wifiCloseModal() { document.getElementById('wifi-modal').style.display = 'none'; }

async function wifiSave() {
  const name = document.getElementById('wf-name').value.trim();
  if (!name) { toast('Connection name is required', 'error'); return; }
  const conn = {
    id: wifiEditId || genId(),
    name, accountNumber: document.getElementById('wf-acc').value.trim(),
    subscriptionNumber: document.getElementById('wf-sub').value.trim(),
    defaultGb: document.getElementById('wf-gb').value,
    defaultPrice: document.getElementById('wf-price').value
  };
  toast('Saving...');
  await DB.saveWifiConnection(wifiCurrentLocation, conn);
  wifiCloseModal();
  toast('Connection saved!');
  wifiRender(wifiCurrentLocation);
}

async function wifiDelete(id) {
  if (!confirm('Delete this connection and all its monthly records?')) return;
  await DB.deleteWifiConnection(id);
  toast('Connection deleted');
  wifiRender(wifiCurrentLocation);
}

async function wifiAddMonth(connId) {
  const connections = await DB.getWifi(wifiCurrentLocation);
  const conn = connections.find(c => c.id === connId);
  if (!conn) return;
  document.getElementById('wm-conn-id').value = connId;
  document.getElementById('wm-month').value = currentMonthLabel();
  document.getElementById('wm-gb').value = conn.defaultGb;
  document.getElementById('wm-price').value = conn.defaultPrice;
  document.getElementById('wm-extra-gb').value = '';
  document.getElementById('wm-extra-cost').value = '';
  document.getElementById('wm-notes').value = '';
  document.getElementById('wifi-month-modal').style.display = 'flex';
}

async function wifiSaveMonth() {
  const connId = document.getElementById('wm-conn-id').value;
  const month = document.getElementById('wm-month').value;
  if (!month) { toast('Select a month', 'error'); return; }
  const record = {
    id: genId(), month,
    gbAmount: document.getElementById('wm-gb').value,
    price: document.getElementById('wm-price').value,
    extraGb: document.getElementById('wm-extra-gb').value,
    extraCost: document.getElementById('wm-extra-cost').value,
    notes: document.getElementById('wm-notes').value.trim()
  };
  toast('Saving...');
  await DB.saveWifiMonth(connId, wifiCurrentLocation, record);
  document.getElementById('wifi-month-modal').style.display = 'none';
  toast('Monthly record saved!');
  wifiRender(wifiCurrentLocation);
}

async function wifiDeleteMonth(connId, monthId) {
  await DB.deleteWifiMonth(monthId);
  toast('Month deleted');
  wifiRender(wifiCurrentLocation);
}
