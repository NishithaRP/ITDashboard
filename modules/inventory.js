// ============================================================
// IT INVENTORY MODULE — with Excel Import & Employee Validation
// ============================================================

let invCurrentLocation = '';
let invEditId = null;

async function inventoryRender(location) {
  invCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const items = await DB.getInventory(location);
  if (el) el.innerHTML = invHTML(location, items) + invModal() + invImportModal();
}

function invHTML(location, items) {
  const pcs = items.filter(i => i.deviceType === 'PC').length;
  const laptops = items.filter(i => i.deviceType === 'Laptop').length;
  return `<div>
    <div class="section-header">
      <div><div class="section-title">💻 IT Inventory</div><div class="section-subtitle">${location} — ${items.length} device(s)</div></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <div class="search-bar"><span class="search-icon">🔍</span><input id="inv-search" type="text" placeholder="Search employee, serial..." oninput="invFilter()"/></div>
        <label class="btn btn-import" style="cursor:pointer;">
          📥 Import Excel
          <input type="file" id="inv-excel-input" accept=".xlsx,.xls" style="display:none;" onchange="invImportExcel(this)"/>
        </label>
        <button class="btn btn-secondary" onclick="invOpenAdd()">+ Add Device</button>
      </div>
    </div>

    <!-- Excel Template hint -->
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:var(--text2);display:flex;align-items:center;gap:10px;">
      <span style="font-size:18px;">📋</span>
      <span><strong style="color:var(--text);">Excel columns:</strong>
        Employee Name | Device Type (PC/Laptop) | Brand | Model | Description | Serial Number | RAM | Storage Type | Storage Size | SSD Serial |
        Extra HDD (Yes/No) | Extra HDD Size | Extra HDD Serial | Mouse (Yes/No) |
        <em style="color:var(--accent2);">PC only:</em> UPS Brand | UPS Model | UPS Size | Keyboard | Monitor Brand | Monitor Model | Monitor Serial | VGA (Yes/No) | VGA Model
      </span>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total Devices</div><div class="stat-value">${items.length}</div></div>
      <div class="stat-card"><div class="stat-label">💻 PCs</div><div class="stat-value" style="color:var(--accent2)">${pcs}</div></div>
      <div class="stat-card"><div class="stat-label">🖥️ Laptops</div><div class="stat-value" style="color:var(--warning)">${laptops}</div></div>
    </div>

    <!-- Bulk Delete Bar -->
    <div class="bulk-bar" id="inv-bulk-bar">
      <span class="bulk-bar-count" id="inv-bulk-count">0 selected</span>
      <span class="bulk-bar-info">devices</span>
      <button class="btn-bulk-cancel" onclick="invBulkCancel()">✕ Cancel</button>
      <button class="btn-bulk-delete" onclick="invBulkDelete()">🗑 Delete Selected</button>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table>
      <thead><tr><th class="cb-col"><input type="checkbox" class="row-checkbox" id="inv-check-all" onchange="invToggleAll(this)" title="Select all"/></th><th>Employee</th><th>Type</th><th>Brand / Model</th><th>Description</th><th>Serial #</th><th>Storage</th><th>RAM</th><th>Monitor</th><th>Mouse</th><th>Actions</th></tr></thead>
      <tbody id="inv-tbody">${invRows(items)}</tbody>
    </table></div></div>
  </div>`;
}

function invRows(items) {
  if (items.length === 0) return `<tr><td colspan="10"><div class="empty-state"><div class="icon">💻</div><h3>No devices yet</h3><p>Add manually or import from Excel</p></div></td></tr>`;
  return items.map(item => `<tr>
    <td class="cb-col"><input type="checkbox" class="row-checkbox inv-row-cb" data-id="${item.id}" onchange="invRowCheck()"/></td>
    <td><strong>${item.employee}</strong></td>
    <td><span class="badge ${item.deviceType==='PC'?'badge-blue':'badge-green'}">${item.deviceType}</span></td>
    <td>${item.brand} ${item.model}</td>
    <td style="font-size:12px;color:var(--text2);max-width:200px;">${item.description||'—'}</td>
    <td style="font-family:monospace;font-size:12px;">${item.serialNumber||'—'}</td>
    <td>${item.storageType||''} ${item.storageSize?item.storageSize+'GB':'—'}${item.extraHdd?`<br><span class="badge badge-yellow" style="font-size:10px;">+HDD ${item.extraHddSize}GB</span>`:''}</td>
    <td>${item.ram?item.ram+' GB':'—'}</td>
    <td style="font-size:12px;">${item.deviceType==='PC'&&item.monitorBrand?`${item.monitorBrand} ${item.monitorModel||''}`:'—'}</td>
    <td><span class="badge ${item.mouseGiven?'badge-green':'badge-gray'}">${item.mouseGiven?'Yes':'No'}</span></td>
    <td class="action-btns">
      <button class="btn btn-small btn-secondary" onclick="invOpenEdit('${item.id}')">Edit</button>
      <button class="btn btn-small btn-danger" onclick="invDelete('${item.id}')">Del</button>
    </td>
  </tr>`).join('');
}


// ---- BULK DELETE ----
function invRowCheck() {
  const cbs = document.querySelectorAll('.inv-row-cb');
  const checked = document.querySelectorAll('.inv-row-cb:checked');
  document.getElementById('inv-bulk-bar').classList.toggle('visible', checked.length > 0);
  document.getElementById('inv-bulk-count').textContent = checked.length + ' selected';
  document.getElementById('inv-check-all').indeterminate = checked.length > 0 && checked.length < cbs.length;
  document.getElementById('inv-check-all').checked = checked.length === cbs.length && cbs.length > 0;
}
function invToggleAll(cb) {
  document.querySelectorAll('.inv-row-cb').forEach(c => c.checked = cb.checked);
  invRowCheck();
}
function invBulkCancel() {
  document.querySelectorAll('.inv-row-cb').forEach(c => c.checked = false);
  document.getElementById('inv-check-all').checked = false;
  document.getElementById('inv-bulk-bar').classList.remove('visible');
}
async function invBulkDelete() {
  const ids = [...document.querySelectorAll('.inv-row-cb:checked')].map(c => c.dataset.id);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} selected device(s)?`)) return;
  toast('Deleting...');
  for (const id of ids) await DB.deleteInventoryItem(id);
  toast(`🗑 ${ids.length} device(s) deleted`);
  inventoryRender(invCurrentLocation);
}


// ======================================================
// EMPLOYEE NAME SMART MATCH
// ======================================================
let invEmpList = [];   // loaded when modal opens
let invEmpConfirmed = false;

async function invLoadEmpList() {
  invEmpList = await DB.getEmployees(invCurrentLocation);
}

function invSimilarity(a, b) {
  a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
  if (a === b) return 1;
  const aWords = a.split(/\s+/); const bWords = b.split(/\s+/);
  // First or last name exact match = high score
  for (const aw of aWords) for (const bw of bWords) {
    if (aw === bw && aw.length > 2) return 0.85;
  }
  // Starts-with
  if (b.startsWith(a) || a.startsWith(b)) return 0.8;
  // Character overlap (simple)
  const setA = new Set(a.replace(/\s/g,'')); const setB = new Set(b.replace(/\s/g,''));
  let inter = 0; setA.forEach(ch => { if(setB.has(ch)) inter++; });
  return inter / Math.max(setA.size, setB.size) * 0.7;
}

function invEmpSearch(query) {
  invEmpConfirmed = false;
  document.getElementById('inv-emp-confirm').style.display = 'none';
  const dd = document.getElementById('inv-emp-dropdown');
  if (!query || query.length < 1) { dd.style.display = 'none'; return; }
  const q = query.toLowerCase().trim();
  const scored = invEmpList
    .map(e => ({ e, score: invSimilarity(q, e.name) }))
    .filter(x => x.score > 0.2)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6);
  if (!scored.length) {
    dd.innerHTML = '<div style="padding:10px 14px;color:var(--text2);font-size:13px;">No matching employees found</div>';
    dd.style.display = 'block'; return;
  }
  dd.innerHTML = scored.map(({e, score}) => {
    const tag = score === 1 ? '✅ Exact match' : score >= 0.85 ? '🔵 Name match' : '🟡 Similar';
    return `<div onclick="invEmpSelect('${e.name.replace(/'/g,"\\'")}','${e.department||''}','${e.designation||''}')"
      style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;"
      onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background=''">
      <div>
        <strong style="font-size:13px;">${e.name}</strong>
        <span style="color:var(--text2);font-size:12px;margin-left:8px;">${e.department||''} ${e.designation?'· '+e.designation:''}</span>
      </div>
      <span style="font-size:11px;color:var(--text2);">${tag}</span>
    </div>`;
  }).join('');
  dd.style.display = 'block';
}

function invEmpSelect(name, dept, desig) {
  document.getElementById('inv-employee').value = name;
  document.getElementById('inv-emp-dropdown').style.display = 'none';
  invEmpConfirmed = true;
  const confirm = document.getElementById('inv-emp-confirm');
  confirm.style.display = 'block';
  confirm.innerHTML = `<span style="color:#38bdf8;">✅ Linked to <strong>${name}</strong>${dept ? ' · ' + dept : ''}${desig ? ' · ' + desig : ''}</span>
    <button onclick="invEmpClear()" style="float:right;background:none;border:none;color:var(--text2);cursor:pointer;font-size:12px;">✕ Change</button>`;
}

function invEmpClear() {
  document.getElementById('inv-employee').value = '';
  document.getElementById('inv-emp-confirm').style.display = 'none';
  document.getElementById('inv-emp-dropdown').style.display = 'none';
  invEmpConfirmed = false;
  document.getElementById('inv-employee').focus();
}

function invEmpHideDropdown() {
  // If typed name exactly matches an employee, auto-confirm
  const val = (document.getElementById('inv-employee').value||'').trim();
  if (!invEmpConfirmed && val) {
    const exact = invEmpList.find(e => e.name.toLowerCase() === val.toLowerCase());
    if (exact) {
      invEmpSelect(exact.name, exact.department||'', exact.designation||'');
      return;
    }
  }
  document.getElementById('inv-emp-dropdown').style.display = 'none';
}

async function invFilter() {
  const q = document.getElementById('inv-search').value.toLowerCase();
  const items = (await DB.getInventory(invCurrentLocation)).filter(i =>
    (i.employee||'').toLowerCase().includes(q) || (i.serialNumber||'').toLowerCase().includes(q) ||
    (i.brand||'').toLowerCase().includes(q) || (i.model||'').toLowerCase().includes(q)
  );
  document.getElementById('inv-tbody').innerHTML = invRows(items);
}

// ============================================================
// EXCEL IMPORT
// ============================================================

async function invImportExcel(input) {
  const file = input.files[0];
  if (!file) return;

  // Show progress overlay
  document.getElementById('inv-import-overlay').style.display = 'flex';
  document.getElementById('inv-import-status').textContent = 'Reading Excel file...';
  document.getElementById('inv-import-bar').style.width = '5%';
  document.getElementById('inv-import-count').textContent = '';
  document.getElementById('inv-import-warnings').innerHTML = '';

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'arraybuffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Auto-detect header row — skip label rows until 'Employee Name' is found
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length > 0) {
      const firstKey = Object.keys(rows[0])[0] || '';
      if (firstKey !== 'Employee Name' && firstKey !== 'Employee') {
        // Header is on row 2 (template has a top label row)
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '', range: 1 });
      }
    }

    if (rows.length === 0) {
      invImportDone(); toast('Excel file is empty', 'error'); input.value=''; return;
    }

    // Load existing employees for name validation
    document.getElementById('inv-import-status').textContent = 'Loading employee list for validation...';
    const employees = await DB.getEmployees(invCurrentLocation);
    const employeeNames = new Set(employees.map(e => e.name.trim().toLowerCase()));

    // Load existing inventory to check duplicates
    const existing = await DB.getInventory(invCurrentLocation);
    const existingEmployees = new Set(existing.map(i => i.employee.trim().toLowerCase()));

    const warnings = [];
    const toSave = [];

    // ---- VALIDATE EACH ROW ----
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1=header)
      const rowWarnings = [];

      const employeeName = val(row, 'Employee Name', 'Employee', 'Name');
      const deviceType   = val(row, 'Device Type', 'Type');
      const brand        = val(row, 'Brand');
      const model        = val(row, 'Model');
      const serial       = val(row, 'Serial Number', 'Serial');
      const description  = val(row, 'Description', 'Desc');

      // --- SKIP instruction/notes rows silently ---
      if (!employeeName ||
          employeeName.toLowerCase().includes('write ') ||
          employeeName.toLowerCase().includes('required') ||
          employeeName.startsWith('📋') ||
          employeeName.toUpperCase().startsWith('NOTE')) {
        if (!employeeName) { warnings.push({ row: rowNum, name: '(blank)', type:'error', msgs: ['Employee Name is required — row skipped'] }); }
        continue;
      }

      // --- MUST-HAVE FIELDS ---
      if (!deviceType)   { rowWarnings.push('⚠️ Device Type is required (PC or Laptop)'); }
      if (!brand)        { rowWarnings.push('⚠️ Brand is required'); }
      if (!model)        { rowWarnings.push('⚠️ Model is required'); }

      const devType = deviceType.toString().trim();
      const isLaptop = devType.toLowerCase().includes('laptop');
      const isPC = devType.toLowerCase().includes('pc') || devType.toLowerCase().includes('desktop');

      if (!isLaptop && !isPC && deviceType) rowWarnings.push(`⚠️ Unknown Device Type "${deviceType}" — expected PC or Laptop`);

      // Laptop: serial number is MUST
      if (isLaptop && !serial) rowWarnings.push('❌ Serial Number is required for Laptops');

      // Employee name validation against employees list
      if (employeeName && employees.length > 0) {
        if (!employeeNames.has(employeeName.toLowerCase())) {
          rowWarnings.push(`🔴 "${employeeName}" not found in Employees list for ${invCurrentLocation}`);
        }
      }

      // Duplicate check
      if (existingEmployees.has(employeeName.toLowerCase())) {
        rowWarnings.push(`⏭️ Already has a device in inventory — will be skipped`);
        warnings.push({ row: rowNum, name: employeeName, type: 'skip', msgs: rowWarnings });
        continue;
      }

      // Skip row if critical missing (device type, brand, model)
      if (!deviceType || !brand || !model || (isLaptop && !serial)) {
        if (rowWarnings.length > 0) warnings.push({ row: rowNum, name: employeeName, type: 'error', msgs: rowWarnings });
        continue;
      }

      if (rowWarnings.length > 0) warnings.push({ row: rowNum, name: employeeName, type: 'warning', msgs: rowWarnings });

      // Build item
      const item = {
        id: genId(),
        employee: employeeName,
        deviceType: isPC ? 'PC' : 'Laptop',
        brand, model,
        description,
        serialNumber: serial,
        ram: val(row, 'RAM', 'RAM (GB)'),
        storageType: val(row, 'Storage Type') || 'SSD',
        storageSize: val(row, 'Storage Size', 'Storage Size (GB)'),
        ssdSerial: val(row, 'SSD Serial', 'Storage Serial'),
        extraHdd: yesNo(val(row, 'Extra HDD')),
        extraHddSize: val(row, 'Extra HDD Size'),
        extraHddSerial: val(row, 'Extra HDD Serial'),
        mouseGiven: yesNo(val(row, 'Mouse', 'Mouse Given')),
        notes: val(row, 'Notes'),
      };

      if (isPC) {
        item.upsBrand     = val(row, 'UPS Brand');
        item.upsModel     = val(row, 'UPS Model');
        item.upsSize      = val(row, 'UPS Size');
        item.keyboard     = val(row, 'Keyboard', 'Keyboard Model');
        item.monitorBrand = val(row, 'Monitor Brand');
        item.monitorModel = val(row, 'Monitor Model');
        item.monitorSerial= val(row, 'Monitor Serial', 'Monitor Serial Number');
        item.vgaAdded     = yesNo(val(row, 'VGA', 'VGA Added'));
        item.vgaModel     = val(row, 'VGA Model');
      }

      toSave.push(item);
    }

    // ---- SHOW WARNINGS BEFORE SAVING ----
    if (warnings.length > 0) {
      document.getElementById('inv-import-status').textContent = `Found ${warnings.length} issue(s). Review below then confirm.`;
      const warnHTML = warnings.map(w => `
        <div class="import-warn-row import-warn-${w.type}">
          <div class="import-warn-header">
            <span>${w.type==='error'?'❌':w.type==='skip'?'⏭️':'⚠️'} Row ${w.row}: <strong>${w.name}</strong></span>
          </div>
          ${w.msgs.map(m => `<div class="import-warn-msg">${m}</div>`).join('')}
        </div>`).join('');
      document.getElementById('inv-import-warnings').innerHTML = warnHTML;
      document.getElementById('inv-import-confirm-area').style.display = 'flex';
      document.getElementById('inv-import-confirm-text').textContent =
        toSave.length > 0
          ? `Proceed to import ${toSave.length} valid device(s)? (Issues above will be skipped)`
          : 'No valid rows to import. Please fix the Excel file and try again.';
      document.getElementById('inv-import-confirm-btn').style.display = toSave.length > 0 ? 'inline-block' : 'none';

      // Store toSave for after confirmation
      window._invPendingImport = toSave;
      input.value = '';
      return;
    }

    // No warnings — save directly
    await invDoSave(toSave, input);

  } catch (err) {
    invImportDone();
    toast('Error reading file: ' + err.message, 'error');
    input.value = '';
    console.error(err);
  }
}

async function invConfirmImport() {
  const toSave = window._invPendingImport || [];
  document.getElementById('inv-import-confirm-area').style.display = 'none';
  document.getElementById('inv-import-warnings').innerHTML = '';
  await invDoSave(toSave, null);
}

async function invDoSave(toSave, input) {
  if (toSave.length === 0) { invImportDone(); toast('Nothing to import', 'error'); return; }
  document.getElementById('inv-import-status').textContent = `Saving ${toSave.length} devices...`;
  document.getElementById('inv-import-bar').style.width = '10%';

  for (let i = 0; i < toSave.length; i++) {
    const item = toSave[i];
    await DB.saveInventoryItem(invCurrentLocation, item);
    const pct = Math.round(((i+1)/toSave.length)*100);
    document.getElementById('inv-import-bar').style.width = pct+'%';
    document.getElementById('inv-import-count').textContent = `${i+1} / ${toSave.length}`;
    document.getElementById('inv-import-status').textContent = `✅ Saved: ${item.employee}`;
  }

  invImportDone();
  toast(`✅ ${toSave.length} device(s) imported!`);
  if (input) input.value = '';
  window._invPendingImport = [];
  inventoryRender(invCurrentLocation);
}

function invImportDone() {
  document.getElementById('inv-import-overlay').style.display = 'none';
}

// ---- Helpers ----
function val(row, ...keys) {
  for (const k of keys) {
    const v = (row[k] || '').toString().trim();
    if (v) return v;
  }
  return '';
}

function yesNo(v) {
  return v.toLowerCase() === 'yes' || v === '1' || v.toLowerCase() === 'true';
}

// ============================================================
// IMPORT OVERLAY MODAL
// ============================================================
function invImportModal() {
  return `
  <div id="inv-import-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;align-items:center;justify-content:center;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;width:90%;max-width:640px;max-height:80vh;overflow-y:auto;">
      <div style="font-size:32px;text-align:center;margin-bottom:12px;">📥</div>
      <div style="font-size:17px;font-weight:700;text-align:center;margin-bottom:6px;" id="inv-import-status">Reading...</div>
      <div style="background:var(--surface2);border-radius:8px;height:8px;overflow:hidden;margin-bottom:8px;">
        <div id="inv-import-bar" style="background:var(--accent);height:100%;width:0%;transition:width 0.3s;"></div>
      </div>
      <div id="inv-import-count" style="text-align:center;font-size:13px;color:var(--text2);margin-bottom:16px;"></div>

      <!-- Warnings list -->
      <div id="inv-import-warnings" style="margin-bottom:16px;"></div>

      <!-- Confirm area -->
      <div id="inv-import-confirm-area" style="display:none;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:16px;">
        <div id="inv-import-confirm-text" style="font-size:13px;color:var(--text2);text-align:center;width:100%;"></div>
        <button class="btn btn-secondary" onclick="invImportDone()">Cancel</button>
        <button id="inv-import-confirm-btn" class="btn btn-primary" onclick="invConfirmImport()" style="width:auto;">Import Valid Rows</button>
      </div>

      <div style="text-align:center;margin-top:12px;">
        <button class="btn btn-secondary" onclick="invImportDone()" style="font-size:12px;padding:6px 16px;">Close</button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// ADD / EDIT MODAL
// ============================================================
function invModal() {
  return `<div id="inv-modal" class="modal-overlay" style="display:none;">
    <div class="modal" style="max-width:780px;">
      <div class="modal-header"><div class="modal-title" id="inv-modal-title">Add Device</div><button class="btn-close" onclick="invCloseModal()">×</button></div>
      <div class="modal-body"><div class="form-grid">
        <div class="form-section-label">Basic Information</div>
        <div class="form-group span2" style="position:relative;">
          <label>Employee Name</label>
          <input id="inv-employee" type="text" placeholder="Start typing a name..." autocomplete="off"
            oninput="invEmpSearch(this.value)" onblur="setTimeout(invEmpHideDropdown,200)"/>
          <div id="inv-emp-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface2);border:1px solid var(--border);border-radius:8px;z-index:999;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4);"></div>
          <div id="inv-emp-confirm" style="display:none;margin-top:8px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:8px;padding:10px 14px;font-size:13px;"></div>
        </div>
        <div class="form-group"><label>Device Type</label><select id="inv-type" onchange="invTogglePCFields()"><option value="Laptop">Laptop</option><option value="PC">PC (Desktop)</option></select></div>
        <div class="form-group"><label>Brand</label><input id="inv-brand" type="text" placeholder="Dell, HP, Lenovo..."/></div>
        <div class="form-group"><label>Model</label><input id="inv-model" type="text" placeholder="Model name"/></div>
        <div class="form-group span2"><label>Description</label><input id="inv-description" type="text" placeholder="e.g. Dell Inspiron 15 3511 Core i3-1115G4 3.00GHz"/></div>
        <div class="form-group"><label>Serial Number <span id="inv-serial-hint" style="color:var(--danger);font-size:11px;">(required for Laptop)</span></label><input id="inv-serial" type="text" placeholder="Device serial #"/></div>
        <div class="form-group"><label>RAM (GB)</label><input id="inv-ram" type="number" placeholder="8, 16, 32..."/></div>
        <hr class="form-section-divider"/><div class="form-section-label">Primary Storage</div>
        <div class="form-group"><label>Storage Type</label><select id="inv-storage-type"><option value="SSD">SSD</option><option value="HDD">HDD</option><option value="NVMe">NVMe</option></select></div>
        <div class="form-group"><label>Storage Size (GB)</label><input id="inv-storage-size" type="number" placeholder="256, 512, 1000..."/></div>
        <div class="form-group span2"><label>SSD/HDD Serial Number</label><input id="inv-ssd-serial" type="text" placeholder="Storage serial #"/></div>
        <hr class="form-section-divider"/><div class="form-section-label">Extra Storage</div>
        <div class="form-group span2"><div class="checkbox-group"><input type="checkbox" id="inv-extra-hdd" onchange="invToggleExtraHdd()"/><label for="inv-extra-hdd">Extra HDD Added</label></div></div>
        <div id="inv-extra-hdd-fields" style="display:none;grid-column:span 2;"><div class="form-grid">
          <div class="form-group"><label>Extra HDD Size (GB)</label><input id="inv-extra-hdd-size" type="number"/></div>
          <div class="form-group"><label>Extra HDD Serial</label><input id="inv-extra-hdd-serial" type="text"/></div>
        </div></div>
        <hr class="form-section-divider"/><div class="form-section-label">Peripherals</div>
        <div class="form-group span2"><div class="checkbox-group"><input type="checkbox" id="inv-mouse"/><label for="inv-mouse">Mouse Given</label></div></div>
        <div id="inv-pc-fields" style="display:none;grid-column:span 2;"><div class="form-grid">
          <div class="form-section-label">PC Peripherals</div>
          <div class="form-group"><label>UPS Brand</label><input id="inv-ups-brand" type="text" placeholder="APC, Microtek..."/></div>
          <div class="form-group"><label>UPS Model</label><input id="inv-ups-model" type="text"/></div>
          <div class="form-group span2"><label>UPS Size (VA)</label><input id="inv-ups-size" type="text" placeholder="e.g. 650VA"/></div>
          <div class="form-group"><label>Keyboard Model</label><input id="inv-keyboard" type="text"/></div>
          <div class="form-group"><label>Monitor Brand</label><input id="inv-monitor-brand" type="text"/></div>
          <div class="form-group"><label>Monitor Model</label><input id="inv-monitor-model" type="text"/></div>
          <div class="form-group"><label>Monitor Serial #</label><input id="inv-monitor-serial" type="text"/></div>
          <div class="form-group span2"><div class="checkbox-group"><input type="checkbox" id="inv-vga" onchange="invToggleVga()"/><label for="inv-vga">VGA Card Added</label></div></div>
          <div id="inv-vga-fields" style="display:none;grid-column:span 2;"><div class="form-group"><label>VGA Model</label><input id="inv-vga-model" type="text"/></div></div>
        </div></div>
        <hr class="form-section-divider"/>
        <div class="form-group span2"><label>Additional Notes</label><textarea id="inv-notes" rows="2"></textarea></div>
      </div></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="invCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="invSave()" style="width:auto">Save Device</button>
      </div>
    </div>
  </div>`;
}

function invTogglePCFields() {
  const isPC = document.getElementById('inv-type').value === 'PC';
  document.getElementById('inv-pc-fields').style.display = isPC ? 'grid' : 'none';
  document.getElementById('inv-serial-hint').textContent = isPC ? '(optional for PC)' : '(required for Laptop)';
  document.getElementById('inv-serial-hint').style.color = isPC ? 'var(--text2)' : 'var(--danger)';
}
function invToggleExtraHdd() { document.getElementById('inv-extra-hdd-fields').style.display = document.getElementById('inv-extra-hdd').checked ? 'grid' : 'none'; }
function invToggleVga() { document.getElementById('inv-vga-fields').style.display = document.getElementById('inv-vga').checked ? 'block' : 'none'; }

function invOpenAdd() {
  invEditId = null;
  invEmpConfirmed = false;
  invLoadEmpList();
  document.getElementById('inv-modal-title').textContent = 'Add Device';
  ['inv-employee','inv-brand','inv-model','inv-description','inv-serial','inv-ram','inv-storage-size','inv-ssd-serial','inv-extra-hdd-size','inv-extra-hdd-serial','inv-ups-brand','inv-ups-model','inv-ups-size','inv-keyboard','inv-monitor-brand','inv-monitor-model','inv-monitor-serial','inv-vga-model','inv-notes'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['inv-extra-hdd','inv-mouse','inv-vga'].forEach(id => { const el=document.getElementById(id); if(el) el.checked=false; });
  document.getElementById('inv-extra-hdd-fields').style.display='none';
  document.getElementById('inv-vga-fields').style.display='none';
  document.getElementById('inv-type').value='Laptop'; invTogglePCFields();
  document.getElementById('inv-modal').style.display='flex';
}

async function invOpenEdit(id) {
  await invLoadEmpList();
  const items = await DB.getInventory(invCurrentLocation);
  const item = items.find(i => i.id === id);
  if (!item) return;
  invEditId = id;
  document.getElementById('inv-modal-title').textContent = 'Edit Device';
  document.getElementById('inv-employee').value = item.employee||'';
  if (item.employee) { const e = invEmpList.find(x=>x.name===item.employee); invEmpSelect(item.employee, e?e.department:'', e?e.designation:''); }
  document.getElementById('inv-type').value = item.deviceType||'Laptop';
  document.getElementById('inv-brand').value = item.brand||'';
  document.getElementById('inv-model').value = item.model||'';
  document.getElementById('inv-serial').value = item.serialNumber||'';
  document.getElementById('inv-description').value = item.description||'';
  document.getElementById('inv-ram').value = item.ram||'';
  document.getElementById('inv-storage-type').value = item.storageType||'SSD';
  document.getElementById('inv-storage-size').value = item.storageSize||'';
  document.getElementById('inv-ssd-serial').value = item.ssdSerial||'';
  document.getElementById('inv-extra-hdd').checked = !!item.extraHdd;
  document.getElementById('inv-extra-hdd-fields').style.display = item.extraHdd?'grid':'none';
  document.getElementById('inv-extra-hdd-size').value = item.extraHddSize||'';
  document.getElementById('inv-extra-hdd-serial').value = item.extraHddSerial||'';
  document.getElementById('inv-mouse').checked = !!item.mouseGiven;
  document.getElementById('inv-ups-brand').value = item.upsBrand||'';
  document.getElementById('inv-ups-model').value = item.upsModel||'';
  document.getElementById('inv-ups-size').value = item.upsSize||'';
  document.getElementById('inv-keyboard').value = item.keyboard||'';
  document.getElementById('inv-monitor-brand').value = item.monitorBrand||'';
  document.getElementById('inv-monitor-model').value = item.monitorModel||'';
  document.getElementById('inv-monitor-serial').value = item.monitorSerial||'';
  document.getElementById('inv-vga').checked = !!item.vgaAdded;
  document.getElementById('inv-vga-fields').style.display = item.vgaAdded?'block':'none';
  document.getElementById('inv-vga-model').value = item.vgaModel||'';
  document.getElementById('inv-notes').value = item.notes||'';
  invTogglePCFields();
  document.getElementById('inv-modal').style.display='flex';
}

function invCloseModal() { document.getElementById('inv-modal').style.display='none'; }

async function invSave() {
  const employee = document.getElementById('inv-employee').value.trim();
  // Warn if employee not linked
  if (!invEmpConfirmed && employee) {
    const exact = invEmpList.find(e => e.name.toLowerCase() === employee.toLowerCase());
    if (!exact) {
      const top = invEmpList.map(e=>({e,s:invSimilarity(employee,e.name)})).sort((a,b)=>b.s-a.s)[0];
      const hint = top && top.s > 0.3 ? `\nDid you mean: "${top.e.name}"?` : '';
      if (!confirm(`"${employee}" was not found in the Employees list.${hint}\n\nSave anyway?`)) return;
    }
  }
  const deviceType = document.getElementById('inv-type').value;
  const brand = document.getElementById('inv-brand').value.trim();
  const model = document.getElementById('inv-model').value.trim();
  const serial = document.getElementById('inv-serial').value.trim();

  if (!employee) { toast('Employee name is required','error'); return; }
  if (!brand)    { toast('Brand is required','error'); return; }
  if (!model)    { toast('Model is required','error'); return; }
  if (deviceType === 'Laptop' && !serial) { toast('Serial number is required for Laptops','error'); return; }

  const item = {
    id: invEditId||genId(), employee, deviceType, brand, model,
    serialNumber: serial,
    description: document.getElementById('inv-description').value.trim(),
    ram: document.getElementById('inv-ram').value,
    storageType: document.getElementById('inv-storage-type').value,
    storageSize: document.getElementById('inv-storage-size').value,
    ssdSerial: document.getElementById('inv-ssd-serial').value.trim(),
    extraHdd: document.getElementById('inv-extra-hdd').checked,
    extraHddSize: document.getElementById('inv-extra-hdd-size').value,
    extraHddSerial: document.getElementById('inv-extra-hdd-serial').value.trim(),
    mouseGiven: document.getElementById('inv-mouse').checked,
    notes: document.getElementById('inv-notes').value.trim(),
  };
  if (deviceType === 'PC') {
    item.upsBrand = document.getElementById('inv-ups-brand').value.trim();
    item.upsModel = document.getElementById('inv-ups-model').value.trim();
    item.upsSize = document.getElementById('inv-ups-size').value.trim();
    item.keyboard = document.getElementById('inv-keyboard').value.trim();
    item.monitorBrand = document.getElementById('inv-monitor-brand').value.trim();
    item.monitorModel = document.getElementById('inv-monitor-model').value.trim();
    item.monitorSerial = document.getElementById('inv-monitor-serial').value.trim();
    item.vgaAdded = document.getElementById('inv-vga').checked;
    item.vgaModel = item.vgaAdded ? document.getElementById('inv-vga-model').value.trim() : '';
  }
  toast('Saving...'); await DB.saveInventoryItem(invCurrentLocation, item);
  invCloseModal(); toast('Device saved!'); inventoryRender(invCurrentLocation);
}

async function invDelete(id) {
  if (!confirm('Delete this device record?')) return;
  await DB.deleteInventoryItem(id); toast('Device deleted'); inventoryRender(invCurrentLocation);
}
