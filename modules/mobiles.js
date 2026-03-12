// ============================================================
// MOBILE PHONES MODULE — Supabase version
// ============================================================
let mobileCurrentLocation = '';
let mobileEditId = null;

async function mobilesRender(location) {
  mobileCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const mobiles = await DB.getMobiles(location);
  if (el) el.innerHTML = mobilesHTML(location, mobiles) + mobileModal();
}

function mobilesHTML(location, mobiles) {
  return `<div>
    <div class="section-header">
      <div><div class="section-title">📱 Mobile Phones</div><div class="section-subtitle">${location} — ${mobiles.length} device(s)</div></div>
      <button class="btn btn-secondary" onclick="mobileOpenAdd()">+ Add Mobile</button>
    </div>
    <div class="bulk-bar" id="mob-bulk-bar">
      <span class="bulk-bar-count" id="mob-bulk-count">0 selected</span>
      <span class="bulk-bar-info">phones</span>
      <button class="btn-bulk-cancel" onclick="mobBulkCancel()">✕ Cancel</button>
      <button class="btn-bulk-delete" onclick="mobBulkDelete()">🗑 Delete Selected</button>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table>
      <thead><tr><th class="cb-col"><input type="checkbox" class="row-checkbox" id="mob-check-all" onchange="mobToggleAll(this)"/></th><th>Employee</th><th>Department</th><th>Brand / Model</th><th>Serial #</th><th>IMEI</th><th>Mobile Number</th><th>Actions</th></tr></thead>
      <tbody>${mobiles.length===0?`<tr><td colspan="8"><div class="empty-state"><div class="icon">📱</div><h3>No mobile phones yet</h3></div></td></tr>`:
        mobiles.map(m=>`<tr>
          <td class="cb-col"><input type="checkbox" class="row-checkbox mob-row-cb" data-id="${m.id}" onchange="mobRowCheck()"/></td>
          <td><strong>${m.employee}</strong></td><td>${m.department}</td>
          <td>${m.brand} ${m.model}</td>
          <td style="font-family:monospace;font-size:12px;">${m.serialNumber}</td>
          <td style="font-family:monospace;font-size:12px;">${m.imei}</td>
          <td><span class="badge badge-blue">${m.mobileNumber}</span></td>
          <td class="action-btns">
            <button class="btn btn-small btn-secondary" onclick="mobileOpenEdit('${m.id}')">Edit</button>
            <button class="btn btn-small btn-danger" onclick="mobileDelete('${m.id}')">Del</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>
  </div>`;
}

function mobileModal() {
  return `<div id="mobile-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header"><div class="modal-title" id="mobile-modal-title">Add Mobile Phone</div><button class="btn-close" onclick="mobileCloseModal()">×</button></div>
      <div class="modal-body"><div class="form-grid">
        <div class="form-group"><label>Employee Name</label><input id="mob-employee" type="text"/></div>
        <div class="form-group"><label>Department</label><input id="mob-dept" type="text"/></div>
        <div class="form-group"><label>Brand</label><input id="mob-brand" type="text"/></div>
        <div class="form-group"><label>Model</label><input id="mob-model" type="text"/></div>
        <div class="form-group"><label>Serial Number</label><input id="mob-serial" type="text"/></div>
        <div class="form-group"><label>IMEI Number</label><input id="mob-imei" type="text"/></div>
        <div class="form-group span2"><label>Mobile Number</label><input id="mob-number" type="text" placeholder="+94 77 ..."/></div>
      </div></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="mobileCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="mobileSave()" style="width:auto">Save</button>
      </div>
    </div>
  </div>`;
}


function mobRowCheck() {
  const cbs = document.querySelectorAll('.mob-row-cb');
  const checked = document.querySelectorAll('.mob-row-cb:checked');
  document.getElementById('mob-bulk-bar').classList.toggle('visible', checked.length > 0);
  document.getElementById('mob-bulk-count').textContent = checked.length + ' selected';
  document.getElementById('mob-check-all').indeterminate = checked.length > 0 && checked.length < cbs.length;
  document.getElementById('mob-check-all').checked = checked.length === cbs.length && cbs.length > 0;
}
function mobToggleAll(cb) { document.querySelectorAll('.mob-row-cb').forEach(c => c.checked = cb.checked); mobRowCheck(); }
function mobBulkCancel() {
  document.querySelectorAll('.mob-row-cb').forEach(c => c.checked = false);
  document.getElementById('mob-check-all').checked = false;
  document.getElementById('mob-bulk-bar').classList.remove('visible');
}
async function mobBulkDelete() {
  const ids = [...document.querySelectorAll('.mob-row-cb:checked')].map(c => c.dataset.id);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} phone(s)?`)) return;
  for (const id of ids) await DB.deleteMobile(id);
  toast(`🗑 ${ids.length} phone(s) deleted`);
  mobilesRender(mobileCurrentLocation);
}

function mobileOpenAdd() {
  mobileEditId = null;
  document.getElementById('mobile-modal-title').textContent = 'Add Mobile Phone';
  ['mob-employee','mob-dept','mob-brand','mob-model','mob-serial','mob-imei','mob-number'].forEach(id => document.getElementById(id).value='');
  document.getElementById('mobile-modal').style.display='flex';
}

async function mobileOpenEdit(id) {
  const mobiles = await DB.getMobiles(mobileCurrentLocation);
  const m = mobiles.find(x => x.id === id);
  if (!m) return;
  mobileEditId = id;
  document.getElementById('mobile-modal-title').textContent = 'Edit Mobile Phone';
  document.getElementById('mob-employee').value = m.employee||'';
  document.getElementById('mob-dept').value = m.department||'';
  document.getElementById('mob-brand').value = m.brand||'';
  document.getElementById('mob-model').value = m.model||'';
  document.getElementById('mob-serial').value = m.serialNumber||'';
  document.getElementById('mob-imei').value = m.imei||'';
  document.getElementById('mob-number').value = m.mobileNumber||'';
  document.getElementById('mobile-modal').style.display='flex';
}

function mobileCloseModal() { document.getElementById('mobile-modal').style.display='none'; }

async function mobileSave() {
  const employee = document.getElementById('mob-employee').value.trim();
  if (!employee) { toast('Employee name is required','error'); return; }
  const item = { id: mobileEditId||genId(), employee, department: document.getElementById('mob-dept').value.trim(), brand: document.getElementById('mob-brand').value.trim(), model: document.getElementById('mob-model').value.trim(), serialNumber: document.getElementById('mob-serial').value.trim(), imei: document.getElementById('mob-imei').value.trim(), mobileNumber: document.getElementById('mob-number').value.trim() };
  toast('Saving...'); await DB.saveMobile(mobileCurrentLocation, item);
  mobileCloseModal(); toast('Mobile phone saved!'); mobilesRender(mobileCurrentLocation);
}

async function mobileDelete(id) {
  if (!confirm('Delete this mobile phone record?')) return;
  await DB.deleteMobile(id); toast('Mobile deleted'); mobilesRender(mobileCurrentLocation);
}
