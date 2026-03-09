// ============================================================
// IP MANAGER MODULE
// ============================================================

let ipCurrentLocation = '';
let ipEditId = null;

function ipRender(location) {
  ipCurrentLocation = location;
  const ips = DB.getIPs(location);
  const used = ips.filter(i => i.employee).length;

  return `
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">🌐 IP Manager</div>
        <div class="section-subtitle">${location} — ${used} assigned / ${ips.length} total</div>
      </div>
      <div style="display:flex;gap:10px;">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input id="ip-search" type="text" placeholder="Search IP, employee..." oninput="ipFilter()"/>
        </div>
        <button class="btn btn-secondary" onclick="ipOpenAdd()">+ Assign IP</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total IPs</div><div class="stat-value">${ips.length}</div></div>
      <div class="stat-card"><div class="stat-label">Assigned</div><div class="stat-value" style="color:var(--accent)">${used}</div></div>
      <div class="stat-card"><div class="stat-label">Available</div><div class="stat-value" style="color:var(--warning)">${ips.filter(i => !i.employee).length}</div></div>
    </div>

    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Employee</th>
              <th>Device</th>
              <th>MAC Address</th>
              <th>Department</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ip-tbody">
            ${ipRows(ips)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ${ipModal()}`;
}

function ipRows(ips) {
  if (ips.length === 0) return `<tr><td colspan="8"><div class="empty-state"><div class="icon">🌐</div><h3>No IPs assigned yet</h3></div></td></tr>`;
  return ips.slice().sort((a, b) => {
    const toNum = ip => ip.split('.').map(Number).reduce((acc, v) => acc * 256 + v, 0);
    return toNum(a.ipAddress) - toNum(b.ipAddress);
  }).map(i => `
    <tr>
      <td style="font-family:monospace;font-weight:700;color:var(--accent)">${i.ipAddress}</td>
      <td>${i.employee || '—'}</td>
      <td>${i.device || '—'}</td>
      <td style="font-family:monospace;font-size:12px;">${i.mac || '—'}</td>
      <td>${i.department || '—'}</td>
      <td><span class="badge ${i.employee ? 'badge-green' : 'badge-gray'}">${i.employee ? 'Assigned' : 'Free'}</span></td>
      <td style="font-size:12px;color:var(--text2)">${i.notes || '—'}</td>
      <td class="action-btns">
        <button class="btn btn-small btn-secondary" onclick="ipOpenEdit('${i.id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="ipDelete('${i.id}')">Del</button>
      </td>
    </tr>`).join('');
}

function ipFilter() {
  const q = document.getElementById('ip-search').value.toLowerCase();
  const ips = DB.getIPs(ipCurrentLocation).filter(i =>
    i.ipAddress.includes(q) ||
    (i.employee||'').toLowerCase().includes(q) ||
    (i.department||'').toLowerCase().includes(q) ||
    (i.device||'').toLowerCase().includes(q)
  );
  document.getElementById('ip-tbody').innerHTML = ipRows(ips);
}

function ipModal() {
  return `
  <div id="ip-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="ip-modal-title">Assign IP</div>
        <button class="btn-close" onclick="ipCloseModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>IP Address</label>
            <input id="ip-addr" type="text" placeholder="192.168.1.x"/>
          </div>
          <div class="form-group">
            <label>Employee Name</label>
            <input id="ip-employee" type="text" placeholder="Leave blank if unassigned"/>
          </div>
          <div class="form-group">
            <label>Device / Hostname</label>
            <input id="ip-device" type="text" placeholder="PC, Printer, Router..."/>
          </div>
          <div class="form-group">
            <label>MAC Address</label>
            <input id="ip-mac" type="text" placeholder="AA:BB:CC:DD:EE:FF"/>
          </div>
          <div class="form-group span2">
            <label>Department</label>
            <input id="ip-dept" type="text" placeholder="Department"/>
          </div>
          <div class="form-group span2">
            <label>Notes</label>
            <input id="ip-notes" type="text" placeholder="Any notes..."/>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="ipCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="ipSave()" style="width:auto">Save</button>
      </div>
    </div>
  </div>`;
}

function ipOpenAdd() {
  ipEditId = null;
  document.getElementById('ip-modal-title').textContent = 'Assign IP';
  ['ip-addr','ip-employee','ip-device','ip-mac','ip-dept','ip-notes']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('ip-modal').style.display = 'flex';
}

function ipOpenEdit(id) {
  const i = DB.getIPs(ipCurrentLocation).find(x => x.id === id);
  if (!i) return;
  ipEditId = id;
  document.getElementById('ip-modal-title').textContent = 'Edit IP Assignment';
  document.getElementById('ip-addr').value = i.ipAddress || '';
  document.getElementById('ip-employee').value = i.employee || '';
  document.getElementById('ip-device').value = i.device || '';
  document.getElementById('ip-mac').value = i.mac || '';
  document.getElementById('ip-dept').value = i.department || '';
  document.getElementById('ip-notes').value = i.notes || '';
  document.getElementById('ip-modal').style.display = 'flex';
}

function ipCloseModal() {
  document.getElementById('ip-modal').style.display = 'none';
}

function ipSave() {
  const ipAddress = document.getElementById('ip-addr').value.trim();
  if (!ipAddress) { toast('IP address is required', 'error'); return; }
  const entry = {
    ipAddress,
    employee: document.getElementById('ip-employee').value.trim(),
    device: document.getElementById('ip-device').value.trim(),
    mac: document.getElementById('ip-mac').value.trim(),
    department: document.getElementById('ip-dept').value.trim(),
    notes: document.getElementById('ip-notes').value.trim(),
  };
  const ips = DB.getIPs(ipCurrentLocation);
  // Check duplicate IP
  const dupIdx = ips.findIndex(x => x.ipAddress === ipAddress && x.id !== ipEditId);
  if (dupIdx > -1) { toast('This IP is already registered!', 'error'); return; }

  if (ipEditId) {
    const idx = ips.findIndex(x => x.id === ipEditId);
    if (idx > -1) ips[idx] = { ...ips[idx], ...entry };
  } else {
    ips.push({ id: genId(), ...entry });
  }
  DB.saveIPs(ipCurrentLocation, ips);
  ipCloseModal();
  toast('IP assignment saved!');
  renderCurrentModule();
}

function ipDelete(id) {
  if (!confirm('Delete this IP assignment?')) return;
  DB.saveIPs(ipCurrentLocation, DB.getIPs(ipCurrentLocation).filter(x => x.id !== id));
  toast('IP deleted');
  renderCurrentModule();
}
