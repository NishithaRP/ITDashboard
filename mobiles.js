// ============================================================
// MOBILE PHONES MODULE
// ============================================================

let mobileCurrentLocation = '';
let mobileEditId = null;

function mobilesRender(location) {
  mobileCurrentLocation = location;
  const mobiles = DB.getMobiles(location);

  return `
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">📱 Mobile Phones</div>
        <div class="section-subtitle">${location} — ${mobiles.length} device(s)</div>
      </div>
      <button class="btn btn-secondary" onclick="mobileOpenAdd()">+ Add Mobile</button>
    </div>

    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Brand / Model</th>
              <th>Serial #</th>
              <th>IMEI</th>
              <th>Mobile Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${mobiles.length === 0 ? `<tr><td colspan="7"><div class="empty-state"><div class="icon">📱</div><h3>No mobile phones yet</h3></div></td></tr>` :
              mobiles.map(m => `
              <tr>
                <td><strong>${m.employee}</strong></td>
                <td>${m.department}</td>
                <td>${m.brand} ${m.model}</td>
                <td style="font-family:monospace;font-size:12px;">${m.serialNumber}</td>
                <td style="font-family:monospace;font-size:12px;">${m.imei}</td>
                <td><span class="badge badge-blue">${m.mobileNumber}</span></td>
                <td class="action-btns">
                  <button class="btn btn-small btn-secondary" onclick="mobileOpenEdit('${m.id}')">Edit</button>
                  <button class="btn btn-small btn-danger" onclick="mobileDelete('${m.id}')">Del</button>
                </td>
              </tr>`).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ${mobileModal()}`;
}

function mobileModal() {
  return `
  <div id="mobile-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="mobile-modal-title">Add Mobile Phone</div>
        <button class="btn-close" onclick="mobileCloseModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Employee Name</label>
            <input id="mob-employee" type="text" placeholder="Full name"/>
          </div>
          <div class="form-group">
            <label>Department</label>
            <input id="mob-dept" type="text" placeholder="Finance, IT, HR..."/>
          </div>
          <div class="form-group">
            <label>Brand</label>
            <input id="mob-brand" type="text" placeholder="Samsung, Apple..."/>
          </div>
          <div class="form-group">
            <label>Model</label>
            <input id="mob-model" type="text" placeholder="Model name"/>
          </div>
          <div class="form-group">
            <label>Serial Number</label>
            <input id="mob-serial" type="text" placeholder="Serial #"/>
          </div>
          <div class="form-group">
            <label>IMEI Number</label>
            <input id="mob-imei" type="text" placeholder="IMEI"/>
          </div>
          <div class="form-group span2">
            <label>Mobile Number</label>
            <input id="mob-number" type="text" placeholder="+94 77 ..."/>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="mobileCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="mobileSave()" style="width:auto">Save</button>
      </div>
    </div>
  </div>`;
}

function mobileOpenAdd() {
  mobileEditId = null;
  document.getElementById('mobile-modal-title').textContent = 'Add Mobile Phone';
  ['mob-employee','mob-dept','mob-brand','mob-model','mob-serial','mob-imei','mob-number']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('mobile-modal').style.display = 'flex';
}

function mobileOpenEdit(id) {
  const m = DB.getMobiles(mobileCurrentLocation).find(x => x.id === id);
  if (!m) return;
  mobileEditId = id;
  document.getElementById('mobile-modal-title').textContent = 'Edit Mobile Phone';
  document.getElementById('mob-employee').value = m.employee || '';
  document.getElementById('mob-dept').value = m.department || '';
  document.getElementById('mob-brand').value = m.brand || '';
  document.getElementById('mob-model').value = m.model || '';
  document.getElementById('mob-serial').value = m.serialNumber || '';
  document.getElementById('mob-imei').value = m.imei || '';
  document.getElementById('mob-number').value = m.mobileNumber || '';
  document.getElementById('mobile-modal').style.display = 'flex';
}

function mobileCloseModal() {
  document.getElementById('mobile-modal').style.display = 'none';
}

function mobileSave() {
  const employee = document.getElementById('mob-employee').value.trim();
  if (!employee) { toast('Employee name is required', 'error'); return; }
  const m = {
    employee,
    department: document.getElementById('mob-dept').value.trim(),
    brand: document.getElementById('mob-brand').value.trim(),
    model: document.getElementById('mob-model').value.trim(),
    serialNumber: document.getElementById('mob-serial').value.trim(),
    imei: document.getElementById('mob-imei').value.trim(),
    mobileNumber: document.getElementById('mob-number').value.trim(),
  };
  const mobiles = DB.getMobiles(mobileCurrentLocation);
  if (mobileEditId) {
    const idx = mobiles.findIndex(x => x.id === mobileEditId);
    if (idx > -1) mobiles[idx] = { ...mobiles[idx], ...m };
  } else {
    mobiles.push({ id: genId(), ...m });
  }
  DB.saveMobiles(mobileCurrentLocation, mobiles);
  mobileCloseModal();
  toast('Mobile phone saved!');
  renderCurrentModule();
}

function mobileDelete(id) {
  if (!confirm('Delete this mobile phone record?')) return;
  DB.saveMobiles(mobileCurrentLocation, DB.getMobiles(mobileCurrentLocation).filter(m => m.id !== id));
  toast('Mobile deleted');
  renderCurrentModule();
}
