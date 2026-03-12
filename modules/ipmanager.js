// ============================================================
// IP MANAGER MODULE — Supabase version
// ============================================================
let ipCurrentLocation = '';
let ipEditId = null;

async function ipRender(location) {
  ipCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const ips = await DB.getIPs(location);
  if (el) el.innerHTML = ipHTML(location, ips) + ipModal();
}

function ipHTML(location, ips) {
  const used = ips.filter(i => i.employee).length;
  return `<div>
    <div class="section-header">
      <div><div class="section-title">🌐 IP Manager</div><div class="section-subtitle">${location} — ${used} assigned / ${ips.length} total</div></div>
      <div style="display:flex;gap:10px;">
        <div class="search-bar"><span class="search-icon">🔍</span><input id="ip-search" type="text" placeholder="Search IP, employee..." oninput="ipFilter()"/></div>
        <button class="btn btn-secondary" onclick="ipOpenAdd()">+ Assign IP</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total IPs</div><div class="stat-value">${ips.length}</div></div>
      <div class="stat-card"><div class="stat-label">Assigned</div><div class="stat-value" style="color:var(--accent)">${used}</div></div>
      <div class="stat-card"><div class="stat-label">Available</div><div class="stat-value" style="color:var(--warning)">${ips.filter(i=>!i.employee).length}</div></div>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table>
      <thead><tr><th>IP Address</th><th>Employee</th><th>Device</th><th>MAC Address</th><th>Department</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
      <tbody id="ip-tbody">${ipRows(ips)}</tbody>
    </table></div></div>
  </div>`;
}

function ipRows(ips) {
  if (ips.length === 0) return `<tr><td colspan="8"><div class="empty-state"><div class="icon">🌐</div><h3>No IPs assigned yet</h3></div></td></tr>`;
  return ips.map(i=>`<tr>
    <td style="font-family:monospace;font-weight:700;color:var(--accent)">${i.ipAddress}</td>
    <td>${i.employee||'—'}</td><td>${i.device||'—'}</td>
    <td style="font-family:monospace;font-size:12px;">${i.mac||'—'}</td>
    <td>${i.department||'—'}</td>
    <td><span class="badge ${i.employee?'badge-green':'badge-gray'}">${i.employee?'Assigned':'Free'}</span></td>
    <td style="font-size:12px;color:var(--text2)">${i.notes||'—'}</td>
    <td class="action-btns">
      <button class="btn btn-small btn-secondary" onclick="ipOpenEdit('${i.id}')">Edit</button>
      <button class="btn btn-small btn-danger" onclick="ipDelete('${i.id}')">Del</button>
    </td>
  </tr>`).join('');
}

async function ipFilter() {
  const q = document.getElementById('ip-search').value.toLowerCase();
  const ips = (await DB.getIPs(ipCurrentLocation)).filter(i =>
    i.ipAddress.includes(q)||(i.employee||'').toLowerCase().includes(q)||(i.department||'').toLowerCase().includes(q)
  );
  document.getElementById('ip-tbody').innerHTML = ipRows(ips);
}

function ipModal() {
  return `<div id="ip-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header"><div class="modal-title" id="ip-modal-title">Assign IP</div><button class="btn-close" onclick="ipCloseModal()">×</button></div>
      <div class="modal-body"><div class="form-grid">
        <div class="form-group"><label>IP Address</label><input id="ip-addr" type="text" placeholder="192.168.1.x"/></div>
        <div class="form-group"><label>Employee Name</label><input id="ip-employee" type="text" placeholder="Leave blank if unassigned"/></div>
        <div class="form-group"><label>Device / Hostname</label><input id="ip-device" type="text"/></div>
        <div class="form-group"><label>MAC Address</label><input id="ip-mac" type="text" placeholder="AA:BB:CC:DD:EE:FF"/></div>
        <div class="form-group span2"><label>Department</label><input id="ip-dept" type="text"/></div>
        <div class="form-group span2"><label>Notes</label><input id="ip-notes" type="text"/></div>
      </div></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="ipCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="ipSave()" style="width:auto">Save</button>
      </div>
    </div>
  </div>`;
}

function ipOpenAdd() {
  ipEditId = null;
  ['ip-addr','ip-employee','ip-device','ip-mac','ip-dept','ip-notes'].forEach(id => document.getElementById(id).value='');
  document.getElementById('ip-modal').style.display='flex';
}

async function ipOpenEdit(id) {
  const ips = await DB.getIPs(ipCurrentLocation);
  const i = ips.find(x => x.id === id);
  if (!i) return;
  ipEditId = id;
  document.getElementById('ip-addr').value = i.ipAddress||'';
  document.getElementById('ip-employee').value = i.employee||'';
  document.getElementById('ip-device').value = i.device||'';
  document.getElementById('ip-mac').value = i.mac||'';
  document.getElementById('ip-dept').value = i.department||'';
  document.getElementById('ip-notes').value = i.notes||'';
  document.getElementById('ip-modal').style.display='flex';
}

function ipCloseModal() { document.getElementById('ip-modal').style.display='none'; }

async function ipSave() {
  const ipAddress = document.getElementById('ip-addr').value.trim();
  if (!ipAddress) { toast('IP address is required','error'); return; }
  const item = { id: ipEditId||genId(), ipAddress, employee: document.getElementById('ip-employee').value.trim(), device: document.getElementById('ip-device').value.trim(), mac: document.getElementById('ip-mac').value.trim(), department: document.getElementById('ip-dept').value.trim(), notes: document.getElementById('ip-notes').value.trim() };
  toast('Saving...'); await DB.saveIP(ipCurrentLocation, item);
  ipCloseModal(); toast('IP saved!'); ipRender(ipCurrentLocation);
}

async function ipDelete(id) {
  if (!confirm('Delete this IP assignment?')) return;
  await DB.deleteIP(id); toast('IP deleted'); ipRender(ipCurrentLocation);
}
