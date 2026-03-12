// ============================================================
// SYSTEMS ACCESS MODULE — RDP & ERP Credentials
// ============================================================

let sysCurrentLocation = '';
let sysEditId = null;
let sysType = 'rdp'; // 'rdp' or 'erp'

function systemsRender(location) {
  sysCurrentLocation = location;
  const rdpList = DB.get(`rdp_${location}`);
  const erpList = DB.get(`erp_${location}`);

  return `
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">🖥️ Systems Access</div>
        <div class="section-subtitle">${location} — RDP & ERP Credentials</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">RDP Accounts</div><div class="stat-value" style="color:var(--accent2)">${rdpList.length}</div></div>
      <div class="stat-card"><div class="stat-label">ERP Accounts</div><div class="stat-value" style="color:var(--warning)">${erpList.length}</div></div>
    </div>

    <!-- RDP SECTION -->
    <div class="card" style="padding:0;margin-bottom:20px;">
      <div style="background:var(--surface2);padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:700;font-size:15px;">🖥️ RDP (Remote Desktop) Accounts</div>
        <button class="btn btn-secondary" onclick="sysOpenAdd('rdp')">+ Add RDP</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee / Label</th>
              <th>Computer / Server Name</th>
              <th>IP Address</th>
              <th>Username</th>
              <th>Password</th>
              <th>Port</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rdpList.length === 0 ? `<tr><td colspan="8"><div class="empty-state" style="padding:24px;"><div class="icon">🖥️</div><h3>No RDP accounts yet</h3></div></td></tr>` :
              rdpList.map(r => `
              <tr>
                <td><strong>${r.label}</strong></td>
                <td>${r.computerName || '—'}</td>
                <td style="font-family:monospace;font-size:12px;">${r.ipAddress || '—'}</td>
                <td style="font-family:monospace;">${r.username}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span id="rdp-pw-${r.id}" style="font-family:monospace;filter:blur(4px);cursor:pointer;" onclick="sysTogglePw('rdp-pw-${r.id}','${r.password}')">${'•'.repeat(r.password.length)}</span>
                    <button class="btn btn-small btn-secondary" onclick="sysTogglePw('rdp-pw-${r.id}','${r.password}')" style="padding:2px 8px;font-size:11px;">👁</button>
                    <button class="btn btn-small btn-secondary" onclick="sysCopy('${r.password}')" style="padding:2px 8px;font-size:11px;">📋</button>
                  </div>
                </td>
                <td>${r.port || '3389'}</td>
                <td style="font-size:12px;color:var(--text2);">${r.notes || '—'}</td>
                <td class="action-btns">
                  <button class="btn btn-small btn-secondary" onclick="sysOpenEdit('rdp','${r.id}')">Edit</button>
                  <button class="btn btn-small btn-danger" onclick="sysDelete('rdp','${r.id}')">Del</button>
                </td>
              </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- ERP SECTION -->
    <div class="card" style="padding:0;">
      <div style="background:var(--surface2);padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:700;font-size:15px;">📊 ERP Accounts</div>
        <button class="btn btn-secondary" onclick="sysOpenAdd('erp')">+ Add ERP</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>ERP System</th>
              <th>Username / ID</th>
              <th>Password</th>
              <th>Access Level</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${erpList.length === 0 ? `<tr><td colspan="8"><div class="empty-state" style="padding:24px;"><div class="icon">📊</div><h3>No ERP accounts yet</h3></div></td></tr>` :
              erpList.map(e => `
              <tr>
                <td><strong>${e.employee}</strong></td>
                <td>${e.department || '—'}</td>
                <td><span class="badge badge-blue">${e.erpSystem || '—'}</span></td>
                <td style="font-family:monospace;">${e.username}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span id="erp-pw-${e.id}" style="font-family:monospace;filter:blur(4px);cursor:pointer;" onclick="sysTogglePw('erp-pw-${e.id}','${e.password}')">${'•'.repeat(e.password.length)}</span>
                    <button class="btn btn-small btn-secondary" onclick="sysTogglePw('erp-pw-${e.id}','${e.password}')" style="padding:2px 8px;font-size:11px;">👁</button>
                    <button class="btn btn-small btn-secondary" onclick="sysCopy('${e.password}')" style="padding:2px 8px;font-size:11px;">📋</button>
                  </div>
                </td>
                <td><span class="badge ${e.accessLevel==='Admin'?'badge-red':e.accessLevel==='Manager'?'badge-yellow':'badge-green'}">${e.accessLevel || 'User'}</span></td>
                <td style="font-size:12px;color:var(--text2);">${e.notes || '—'}</td>
                <td class="action-btns">
                  <button class="btn btn-small btn-secondary" onclick="sysOpenEdit('erp','${e.id}')">Edit</button>
                  <button class="btn btn-small btn-danger" onclick="sysDelete('erp','${e.id}')">Del</button>
                </td>
              </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ${sysModal()}`;
}

function sysTogglePw(elId, pw) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (el.style.filter === 'none') {
    el.style.filter = 'blur(4px)';
    el.textContent = '•'.repeat(pw.length);
  } else {
    el.style.filter = 'none';
    el.textContent = pw;
  }
}

function sysCopy(text) {
  navigator.clipboard.writeText(text).then(() => toast('Password copied!'));
}

function sysModal() {
  return `
  <div id="sys-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="sys-modal-title">Add RDP Account</div>
        <button class="btn-close" onclick="sysCloseModal()">×</button>
      </div>
      <div class="modal-body">

        <!-- RDP Fields -->
        <div id="sys-rdp-fields">
          <div class="form-grid">
            <div class="form-group">
              <label>Label / Employee Name</label>
              <input id="sys-label" type="text" placeholder="e.g. Server Room PC, John's PC"/>
            </div>
            <div class="form-group">
              <label>Computer / Server Name</label>
              <input id="sys-computer" type="text" placeholder="DESKTOP-ABC123"/>
            </div>
            <div class="form-group">
              <label>IP Address</label>
              <input id="sys-ip" type="text" placeholder="192.168.1.x"/>
            </div>
            <div class="form-group">
              <label>RDP Port</label>
              <input id="sys-port" type="text" placeholder="3389" value="3389"/>
            </div>
            <div class="form-group">
              <label>Username</label>
              <input id="sys-username" type="text" placeholder="Windows username"/>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input id="sys-password" type="text" placeholder="Password"/>
            </div>
            <div class="form-group span2">
              <label>Notes</label>
              <input id="sys-notes" type="text" placeholder="Any notes..."/>
            </div>
          </div>
        </div>

        <!-- ERP Fields -->
        <div id="sys-erp-fields" style="display:none;">
          <div class="form-grid">
            <div class="form-group">
              <label>Employee Name</label>
              <input id="erp-employee" type="text" placeholder="Full name"/>
            </div>
            <div class="form-group">
              <label>Department</label>
              <input id="erp-dept" type="text" placeholder="Finance, HR, Sales..."/>
            </div>
            <div class="form-group">
              <label>ERP System Name</label>
              <input id="erp-system" type="text" placeholder="SAP, Oracle, Tally, Custom..."/>
            </div>
            <div class="form-group">
              <label>Access Level</label>
              <select id="erp-access">
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="View Only">View Only</option>
              </select>
            </div>
            <div class="form-group">
              <label>Username / User ID</label>
              <input id="erp-username" type="text" placeholder="ERP username or ID"/>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input id="erp-password" type="text" placeholder="ERP password"/>
            </div>
            <div class="form-group span2">
              <label>Notes</label>
              <input id="erp-notes" type="text" placeholder="Module access, restrictions..."/>
            </div>
          </div>
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="sysCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="sysSave()" style="width:auto">Save</button>
      </div>
    </div>
  </div>`;
}

function sysOpenAdd(type) {
  sysEditId = null;
  sysType = type;
  document.getElementById('sys-modal-title').textContent = type === 'rdp' ? 'Add RDP Account' : 'Add ERP Account';
  document.getElementById('sys-rdp-fields').style.display = type === 'rdp' ? 'block' : 'none';
  document.getElementById('sys-erp-fields').style.display = type === 'erp' ? 'block' : 'none';
  ['sys-label','sys-computer','sys-ip','sys-username','sys-password','sys-notes',
   'erp-employee','erp-dept','erp-system','erp-username','erp-password','erp-notes']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('sys-port').value = '3389';
  document.getElementById('sys-modal').style.display = 'flex';
}

function sysOpenEdit(type, id) {
  sysType = type;
  sysEditId = id;
  const list = DB.get(`${type}_${sysCurrentLocation}`);
  const item = list.find(x => x.id === id);
  if (!item) return;
  document.getElementById('sys-modal-title').textContent = type === 'rdp' ? 'Edit RDP Account' : 'Edit ERP Account';
  document.getElementById('sys-rdp-fields').style.display = type === 'rdp' ? 'block' : 'none';
  document.getElementById('sys-erp-fields').style.display = type === 'erp' ? 'block' : 'none';
  if (type === 'rdp') {
    document.getElementById('sys-label').value = item.label || '';
    document.getElementById('sys-computer').value = item.computerName || '';
    document.getElementById('sys-ip').value = item.ipAddress || '';
    document.getElementById('sys-port').value = item.port || '3389';
    document.getElementById('sys-username').value = item.username || '';
    document.getElementById('sys-password').value = item.password || '';
    document.getElementById('sys-notes').value = item.notes || '';
  } else {
    document.getElementById('erp-employee').value = item.employee || '';
    document.getElementById('erp-dept').value = item.department || '';
    document.getElementById('erp-system').value = item.erpSystem || '';
    document.getElementById('erp-access').value = item.accessLevel || 'User';
    document.getElementById('erp-username').value = item.username || '';
    document.getElementById('erp-password').value = item.password || '';
    document.getElementById('erp-notes').value = item.notes || '';
  }
  document.getElementById('sys-modal').style.display = 'flex';
}

function sysCloseModal() {
  document.getElementById('sys-modal').style.display = 'none';
}

function sysSave() {
  const key = `${sysType}_${sysCurrentLocation}`;
  const list = DB.get(key);
  let item = {};

  if (sysType === 'rdp') {
    const label = document.getElementById('sys-label').value.trim();
    if (!label) { toast('Label is required', 'error'); return; }
    item = {
      label,
      computerName: document.getElementById('sys-computer').value.trim(),
      ipAddress: document.getElementById('sys-ip').value.trim(),
      port: document.getElementById('sys-port').value.trim() || '3389',
      username: document.getElementById('sys-username').value.trim(),
      password: document.getElementById('sys-password').value.trim(),
      notes: document.getElementById('sys-notes').value.trim(),
    };
  } else {
    const employee = document.getElementById('erp-employee').value.trim();
    if (!employee) { toast('Employee name is required', 'error'); return; }
    item = {
      employee,
      department: document.getElementById('erp-dept').value.trim(),
      erpSystem: document.getElementById('erp-system').value.trim(),
      accessLevel: document.getElementById('erp-access').value,
      username: document.getElementById('erp-username').value.trim(),
      password: document.getElementById('erp-password').value.trim(),
      notes: document.getElementById('erp-notes').value.trim(),
    };
  }

  if (sysEditId) {
    const idx = list.findIndex(x => x.id === sysEditId);
    if (idx > -1) list[idx] = { ...list[idx], ...item };
  } else {
    list.push({ id: genId(), ...item });
  }
  DB.set(key, list);
  sysCloseModal();
  toast(`${sysType.toUpperCase()} account saved!`);
  renderCurrentModule();
}

function sysDelete(type, id) {
  if (!confirm('Delete this account?')) return;
  const key = `${type}_${sysCurrentLocation}`;
  DB.set(key, DB.get(key).filter(x => x.id !== id));
  toast('Deleted');
  renderCurrentModule();
}
