// ============================================================
// EMPLOYEES MODULE — with Employed / Resigned status
// ============================================================

let empCurrentLocation = '';
let empEditId = null;
let empStatusFilter = 'all'; // 'all' | 'employed' | 'resigned'
let empDeptFilter = 'all';

async function employeesRender(location) {
  empCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const employees = await DB.getEmployees(location);
  if (el) el.innerHTML = empHTML(location, employees) + empModal() + empInvModal();
}

function empHTML(location, employees) {
  const employed = employees.filter(e => (e.status || 'employed') === 'employed');
  const resigned = employees.filter(e => e.status === 'resigned');
  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const byDept = {};
  depts.forEach(d => byDept[d] = employees.filter(e => e.department === d));

  return `<div>
    <div class="section-header">
      <div>
        <div class="section-title">👥 Employees</div>
        <div class="section-subtitle">${location} — ${employees.length} employee(s)</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input id="emp-search" type="text" placeholder="Search name, department..." oninput="empApplyFilters()"/>
        </div>
        <label class="btn btn-import" style="cursor:pointer;">
          📥 Import Excel
          <input type="file" id="emp-excel-input" accept=".xlsx,.xls" style="display:none;" onchange="empImportExcel(this)"/>
        </label>
        <button class="btn btn-secondary" onclick="empOpenAdd()">+ Add Employee</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${employees.length}</div></div>
      <div class="stat-card" style="cursor:pointer;" onclick="empSetStatus('employed')">
        <div class="stat-label">✅ Employed</div>
        <div class="stat-value" style="color:var(--accent)">${employed.length}</div>
      </div>
      <div class="stat-card" style="cursor:pointer;" onclick="empSetStatus('resigned')">
        <div class="stat-label">🚪 Resigned</div>
        <div class="stat-value" style="color:var(--danger)">${resigned.length}</div>
      </div>
      <div class="stat-card"><div class="stat-label">Departments</div><div class="stat-value" style="color:var(--accent2)">${depts.length}</div></div>
    </div>

    <!-- Status filter tabs -->
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--text2);margin-right:4px;">Status:</span>
      <button class="filter-btn ${empStatusFilter==='all'?'active':''}" onclick="empSetStatus('all')">All <span style="background:var(--surface3);border-radius:8px;padding:0 6px;font-size:11px;">${employees.length}</span></button>
      <button class="filter-btn ${empStatusFilter==='employed'?'active':''}" id="sf-employed" onclick="empSetStatus('employed')" style="${empStatusFilter==='employed'?'background:#10b981;border-color:#10b981;color:#fff;':''}">✅ Employed <span style="background:rgba(255,255,255,0.2);border-radius:8px;padding:0 6px;font-size:11px;">${employed.length}</span></button>
      <button class="filter-btn ${empStatusFilter==='resigned'?'active':''}" id="sf-resigned" onclick="empSetStatus('resigned')" style="${empStatusFilter==='resigned'?'background:#ef4444;border-color:#ef4444;color:#fff;':''}">🚪 Resigned <span style="background:rgba(255,255,255,0.2);border-radius:8px;padding:0 6px;font-size:11px;">${resigned.length}</span></button>
    </div>

    <!-- Dept filter tabs -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:13px;color:var(--text2);margin-right:4px;">Dept:</span>
      <button class="filter-btn ${empDeptFilter==='all'?'active':''}" onclick="empSetDept('all',this)">All</button>
      ${depts.map(d => `<button class="filter-btn ${empDeptFilter===d?'active':''}" onclick="empSetDept('${d}',this)">${d} <span style="background:var(--surface3);border-radius:8px;padding:0 6px;font-size:11px;">${byDept[d].length}</span></button>`).join('')}
    </div>

    <div class="bulk-bar" id="emp-bulk-bar">
      <span class="bulk-bar-count" id="emp-bulk-count">0 selected</span>
      <span class="bulk-bar-info">employees</span>
      <button class="btn-bulk-cancel" onclick="empBulkCancel()">✕ Cancel</button>
      <button class="btn-bulk-delete" onclick="empBulkDelete()">🗑 Delete Selected</button>
    </div>
    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="cb-col"><input type="checkbox" class="row-checkbox" id="emp-check-all" onchange="empToggleAll(this)"/></th>
              <th>#</th>
              <th>Name</th>
              <th>Location</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="emp-tbody">
            ${empRows(employees)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Import progress overlay -->
    <div id="emp-import-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:40px;text-align:center;min-width:320px;">
        <div style="font-size:40px;margin-bottom:16px;">📥</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Importing Employees...</div>
        <div id="emp-import-status" style="color:var(--text2);font-size:14px;margin-bottom:20px;">Reading file...</div>
        <div style="background:var(--surface2);border-radius:8px;height:8px;overflow:hidden;">
          <div id="emp-import-bar" style="background:var(--accent);height:100%;width:0%;transition:width 0.3s;"></div>
        </div>
        <div id="emp-import-count" style="margin-top:12px;font-size:13px;color:var(--text2);">0 / 0</div>
      </div>
    </div>
  </div>`;
}

function empRows(employees) {
  // Apply current filters
  let filtered = employees;
  const q = document.getElementById('emp-search') ? document.getElementById('emp-search').value.toLowerCase() : '';
  if (q) filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || (e.department||'').toLowerCase().includes(q) || (e.designation||'').toLowerCase().includes(q));
  if (empStatusFilter !== 'all') filtered = filtered.filter(e => (e.status||'employed') === empStatusFilter);
  if (empDeptFilter !== 'all') filtered = filtered.filter(e => e.department === empDeptFilter);

  if (filtered.length === 0) return `<tr><td colspan="8"><div class="empty-state" style="padding:32px;"><div class="icon">👥</div><h3>No employees found</h3></div></td></tr>`;

  return filtered.map((e, i) => {
    const status = e.status || 'employed';
    const isResigned = status === 'resigned';
    return `<tr data-dept="${e.department||''}" data-status="${status}" style="${isResigned?'opacity:0.55;':''}">
      <td class="cb-col"><input type="checkbox" class="row-checkbox emp-row-cb" data-id="${e.id}" onchange="empRowCheck()"/></td>
      <td style="color:var(--text2);font-size:13px;">${i+1}</td>
      <td><strong style="${isResigned?'text-decoration:line-through;':''} cursor:pointer;color:var(--accent2);" onclick="empViewInventory('${e.name.replace(/'/g,'&#39;')}','${e.id}')" title="View IT Inventory">${e.name} <span style="font-size:10px;opacity:0.6;">💻</span></strong></td>
      <td><span class="badge badge-blue" style="font-size:11px;">${e.location||empCurrentLocation}</span></td>
      <td><span class="dept-pill">${e.department||'—'}</span></td>
      <td style="font-size:13px;">${e.designation||'—'}</td>
      <td>
        <span class="status-badge ${isResigned?'status-resigned':'status-employed'}" onclick="empToggleStatus('${e.id}','${status}')" title="Click to change status" style="cursor:pointer;">
          ${isResigned?'🚪 Resigned':'✅ Employed'}
        </span>
      </td>
      <td class="action-btns">
        <button class="btn btn-small btn-secondary" onclick="empOpenEdit('${e.id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="empDelete('${e.id}')">Del</button>
      </td>
    </tr>`;
  }).join('');
}


// ---- BULK DELETE ----
function empRowCheck() {
  const cbs = document.querySelectorAll('.emp-row-cb');
  const checked = document.querySelectorAll('.emp-row-cb:checked');
  document.getElementById('emp-bulk-bar').classList.toggle('visible', checked.length > 0);
  document.getElementById('emp-bulk-count').textContent = checked.length + ' selected';
  document.getElementById('emp-check-all').indeterminate = checked.length > 0 && checked.length < cbs.length;
  document.getElementById('emp-check-all').checked = checked.length === cbs.length && cbs.length > 0;
}
function empToggleAll(cb) {
  document.querySelectorAll('.emp-row-cb').forEach(c => c.checked = cb.checked);
  empRowCheck();
}
function empBulkCancel() {
  document.querySelectorAll('.emp-row-cb').forEach(c => c.checked = false);
  document.getElementById('emp-check-all').checked = false;
  document.getElementById('emp-bulk-bar').classList.remove('visible');
}
async function empBulkDelete() {
  const ids = [...document.querySelectorAll('.emp-row-cb:checked')].map(c => c.dataset.id);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} selected employee(s)?`)) return;
  toast('Deleting...');
  for (const id of ids) await DB.deleteEmployee(id);
  toast(`🗑 ${ids.length} employee(s) deleted`);
  employeesRender(empCurrentLocation);
}

// ---- FILTER FUNCTIONS ----
function empSetStatus(status) {
  empStatusFilter = status;
  empRefreshRows();
}

function empSetDept(dept, btn) {
  empDeptFilter = dept;
  empRefreshRows();
}

async function empRefreshRows() {
  const employees = await DB.getEmployees(empCurrentLocation);
  document.getElementById('emp-tbody').innerHTML = empRows(employees);
}

async function empApplyFilters() {
  empRefreshRows();
}

// ---- TOGGLE STATUS (quick click) ----
async function empToggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'employed' ? 'resigned' : 'employed';
  const label = newStatus === 'resigned' ? 'Mark as Resigned?' : 'Mark as Employed?';
  if (!confirm(label)) return;
  const employees = await DB.getEmployees(empCurrentLocation);
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  emp.status = newStatus;
  await DB.saveEmployee(empCurrentLocation, emp);
  toast(newStatus === 'resigned' ? '🚪 Marked as Resigned' : '✅ Marked as Employed');
  employeesRender(empCurrentLocation);
}

// ---- EXCEL IMPORT ----
async function empImportExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const overlay = document.getElementById('emp-import-overlay');
  overlay.style.display = 'flex';
  document.getElementById('emp-import-status').textContent = 'Reading Excel file...';
  document.getElementById('emp-import-bar').style.width = '5%';
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'arraybuffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const toImport = rows.filter(r => {
      const loc = (r['Location'] || r['location'] || '').toString().trim();
      return loc === '' || loc.toLowerCase() === empCurrentLocation.toLowerCase();
    });
    if (toImport.length === 0) {
      overlay.style.display = 'none';
      toast(`No rows found for ${empCurrentLocation}.`, 'error');
      input.value = ''; return;
    }
    document.getElementById('emp-import-status').textContent = 'Checking for duplicates...';
    document.getElementById('emp-import-count').textContent = `0 / ${toImport.length}`;
    const existing = await DB.getEmployees(empCurrentLocation);
    const existingNames = new Set(existing.map(e => e.name.trim().toLowerCase()));
    let saved = 0, skipped = 0;
    for (const row of toImport) {
      const name = (row['Name'] || row['name'] || '').toString().trim();
      if (!name) continue;
      if (existingNames.has(name.toLowerCase())) {
        skipped++;
        const pct = Math.round(((saved+skipped)/toImport.length)*100);
        document.getElementById('emp-import-bar').style.width = pct+'%';
        document.getElementById('emp-import-count').textContent = `${saved+skipped} / ${toImport.length}`;
        document.getElementById('emp-import-status').textContent = `⏭ Skipped: ${name}`;
        continue;
      }
      const emp = {
        id: genId(), name,
        location: (row['Location']||row['location']||empCurrentLocation).toString().trim(),
        department: (row['Department']||row['department']||'').toString().trim(),
        designation: (row['Designation']||row['designation']||'').toString().trim(),
        status: 'employed'
      };
      await DB.saveEmployee(empCurrentLocation, emp);
      existingNames.add(name.toLowerCase());
      saved++;
      const pct = Math.round(((saved+skipped)/toImport.length)*100);
      document.getElementById('emp-import-bar').style.width = pct+'%';
      document.getElementById('emp-import-count').textContent = `${saved+skipped} / ${toImport.length}`;
      document.getElementById('emp-import-status').textContent = `✅ Saving: ${emp.name}`;
    }
    overlay.style.display = 'none';
    toast(skipped > 0 ? `✅ ${saved} imported, ${skipped} skipped (duplicates)` : `✅ ${saved} employees imported!`);
    input.value = '';
    employeesRender(empCurrentLocation);
  } catch (err) {
    overlay.style.display = 'none';
    toast('Error: ' + err.message, 'error');
    input.value = '';
  }
}

// ---- MODAL ----

// ======================================================
// EMPLOYEE → IT INVENTORY VIEWER
// ======================================================
function empInvModal() {
  return `<div id="emp-inv-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;">
    <div class="modal-box" style="max-width:860px;width:95%;max-height:88vh;overflow-y:auto;">
      <div class="modal-header">
        <div class="modal-title" id="emp-inv-modal-title">💻 IT Inventory</div>
        <button class="btn-close" onclick="document.getElementById('emp-inv-modal').style.display='none'">×</button>
      </div>
      <div id="emp-inv-modal-body" style="padding:20px;">
        <div style="text-align:center;padding:32px;color:var(--text2);">⏳ Loading...</div>
      </div>
    </div>
  </div>`;
}

async function empViewInventory(name, empId) {
  const modal = document.getElementById('emp-inv-modal');
  modal.style.display = 'flex';
  document.getElementById('emp-inv-modal-title').textContent = '💻 ' + name + ' — IT Inventory';
  document.getElementById('emp-inv-modal-body').innerHTML = '<div style="text-align:center;padding:32px;color:var(--text2);">⏳ Loading...</div>';

  // Get all inventory for this location and filter by name (flexible match)
  const allInv = await DB.getInventory(empCurrentLocation);
  const nameLower = name.toLowerCase().trim();
  const items = allInv.filter(i => {
    const n = (i.employee||'').toLowerCase().trim();
    if (n === nameLower) return true;
    // first name match
    const firstName = nameLower.split(' ')[0];
    return n.split(' ')[0] === firstName && firstName.length > 2;
  });

  const body = document.getElementById('emp-inv-modal-body');
  if (!items.length) {
    body.innerHTML = \`<div style="text-align:center;padding:40px;">
      <div style="font-size:48px;margin-bottom:12px;">📭</div>
      <div style="color:var(--text2);font-size:15px;">No IT inventory found for <strong style="color:var(--text)">\${name}</strong></div>
      <div style="color:var(--text2);font-size:13px;margin-top:8px;">Go to IT Inventory tab to add a device for this employee.</div>
    </div>\`;
    return;
  }

  body.innerHTML = items.map(item => {
    const isPC = item.deviceType === 'PC';
    const storage = \`\${item.storageType||''} \${item.storageSize||''}GB\${item.extraHdd?'+HDD':''}\`;
    return \`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <div>
          <span style="font-size:18px;">\${isPC?'🖥️':'💻'}</span>
          <strong style="font-size:16px;margin-left:6px;">\${item.brand} \${item.model}</strong>
          <span style="margin-left:10px;background:\${isPC?'rgba(168,85,247,0.15)':'rgba(56,189,248,0.15)'};color:\${isPC?'#a855f7':'#38bdf8'};padding:2px 10px;border-radius:20px;font-size:12px;">\${item.deviceType}</span>
        </div>
        \${item.serialNumber ? \`<span style="font-family:monospace;font-size:13px;color:var(--text2);">SN: \${item.serialNumber}</span>\` : ''}
      </div>
      \${item.description ? \`<div style="color:var(--text2);font-size:13px;margin-bottom:10px;">📄 \${item.description}</div>\` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
        \${item.ram ? empInvChip('🧠 RAM', item.ram+'GB') : ''}
        \${storage.trim() ? empInvChip('💾 Storage', storage) : ''}
        \${item.mouse ? empInvChip('🖱️ Mouse', item.mouse==='Yes'||item.mouse===true?'Yes':'No') : ''}
        \${isPC && item.keyboard ? empInvChip('⌨️ Keyboard', item.keyboard) : ''}
        \${isPC && item.monitorBrand ? empInvChip('🖥️ Monitor', item.monitorBrand+(item.monitorModel?' '+item.monitorModel:'')) : ''}
        \${isPC && item.upsBrand ? empInvChip('🔋 UPS', item.upsBrand+(item.upsModel?' '+item.upsModel:'')+(item.upsSize?' ('+item.upsSize+')':'')) : ''}
        \${item.vga && item.vga!=='No' ? empInvChip('🎮 VGA', item.vgaModel||'Yes') : ''}
      </div>
      \${item.notes ? \`<div style="margin-top:10px;color:var(--text2);font-size:12px;font-style:italic;">📝 \${item.notes}</div>\` : ''}
    </div>\`;
  }).join('');
}

function empInvChip(label, value) {
  if (!value || value === 'No' || value === 'false') return '';
  return \`<div style="background:var(--surface3,var(--surface));border:1px solid var(--border);border-radius:8px;padding:7px 10px;">
    <div style="font-size:11px;color:var(--text2);">\${label}</div>
    <div style="font-size:13px;font-weight:600;margin-top:2px;">\${value}</div>
  </div>\`;
}

function empModal() {
  return `<div id="emp-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="emp-modal-title">Add Employee</div>
        <button class="btn-close" onclick="empCloseModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group span2">
            <label>Full Name</label>
            <input id="emp-name" type="text" placeholder="Employee full name"/>
          </div>
          <div class="form-group">
            <label>Location</label>
            <input id="emp-location" type="text" readonly style="opacity:0.7;"/>
          </div>
          <div class="form-group">
            <label>Department</label>
            <input id="emp-dept" type="text" placeholder="Finance, HR, IT..."/>
          </div>
          <div class="form-group span2">
            <label>Designation</label>
            <input id="emp-designation" type="text" placeholder="Job title / designation"/>
          </div>
          <div class="form-group span2">
            <label>Employment Status</label>
            <div style="display:flex;gap:12px;margin-top:6px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 20px;border-radius:8px;border:2px solid var(--border);flex:1;justify-content:center;transition:all 0.2s;" id="status-employed-label">
                <input type="radio" name="emp-status" id="emp-status-employed" value="employed" checked onchange="empStatusRadioChange()" style="display:none;"/>
                <span>✅ Employed</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 20px;border-radius:8px;border:2px solid var(--border);flex:1;justify-content:center;transition:all 0.2s;" id="status-resigned-label">
                <input type="radio" name="emp-status" id="emp-status-resigned" value="resigned" onchange="empStatusRadioChange()" style="display:none;"/>
                <span>🚪 Resigned</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="empCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="empSave()" style="width:auto">Save Employee</button>
      </div>
    </div>
  </div>`;
}

function empStatusRadioChange() {
  const employed = document.getElementById('emp-status-employed').checked;
  document.getElementById('status-employed-label').style.borderColor = employed ? 'var(--accent)' : 'var(--border)';
  document.getElementById('status-employed-label').style.background = employed ? 'rgba(0,255,163,0.08)' : '';
  document.getElementById('status-resigned-label').style.borderColor = !employed ? '#ef4444' : 'var(--border)';
  document.getElementById('status-resigned-label').style.background = !employed ? 'rgba(239,68,68,0.08)' : '';
}

function empOpenAdd() {
  empEditId = null;
  document.getElementById('emp-modal-title').textContent = 'Add Employee';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-dept').value = '';
  document.getElementById('emp-designation').value = '';
  document.getElementById('emp-location').value = empCurrentLocation;
  document.getElementById('emp-status-employed').checked = true;
  empStatusRadioChange();
  document.getElementById('emp-modal').style.display = 'flex';
}

async function empOpenEdit(id) {
  const employees = await DB.getEmployees(empCurrentLocation);
  const e = employees.find(x => x.id === id);
  if (!e) return;
  empEditId = id;
  document.getElementById('emp-modal-title').textContent = 'Edit Employee';
  document.getElementById('emp-name').value = e.name || '';
  document.getElementById('emp-dept').value = e.department || '';
  document.getElementById('emp-designation').value = e.designation || '';
  document.getElementById('emp-location').value = e.location || empCurrentLocation;
  const isResigned = e.status === 'resigned';
  document.getElementById('emp-status-employed').checked = !isResigned;
  document.getElementById('emp-status-resigned').checked = isResigned;
  empStatusRadioChange();
  document.getElementById('emp-modal').style.display = 'flex';
}

function empCloseModal() { document.getElementById('emp-modal').style.display = 'none'; }

async function empSave() {
  const name = document.getElementById('emp-name').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }
  const emp = {
    id: empEditId || genId(),
    name,
    location: empCurrentLocation,
    department: document.getElementById('emp-dept').value.trim(),
    designation: document.getElementById('emp-designation').value.trim(),
    status: document.getElementById('emp-status-resigned').checked ? 'resigned' : 'employed'
  };
  toast('Saving...');
  await DB.saveEmployee(empCurrentLocation, emp);
  empCloseModal();
  toast('Employee saved!');
  employeesRender(empCurrentLocation);
}

async function empDelete(id) {
  if (!confirm('Delete this employee?')) return;
  await DB.deleteEmployee(id);
  toast('Employee deleted');
  employeesRender(empCurrentLocation);
}
