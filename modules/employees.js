// ============================================================
// EMPLOYEES MODULE — Supabase version with Excel Import
// ============================================================

let empCurrentLocation = '';
let empEditId = null;

async function employeesRender(location) {
  empCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const employees = await DB.getEmployees(location);
  if (el) el.innerHTML = empHTML(location, employees) + empModal();
}

function empHTML(location, employees) {
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
          <input id="emp-search" type="text" placeholder="Search name, department..." oninput="empFilter()"/>
        </div>
        <label class="btn btn-import" style="cursor:pointer;">
          📥 Import Excel
          <input type="file" id="emp-excel-input" accept=".xlsx,.xls" style="display:none;" onchange="empImportExcel(this)"/>
        </label>
        <button class="btn btn-secondary" onclick="empOpenAdd()">+ Add Employee</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total Employees</div><div class="stat-value">${employees.length}</div></div>
      <div class="stat-card"><div class="stat-label">Departments</div><div class="stat-value" style="color:var(--accent2)">${depts.length}</div></div>
      ${depts.slice(0,3).map(d => `<div class="stat-card"><div class="stat-label">${d}</div><div class="stat-value" style="color:var(--warning);font-size:20px;">${byDept[d].length}</div></div>`).join('')}
    </div>

    <!-- Filter bar -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:13px;color:var(--text2);">Filter:</span>
      <button class="filter-btn active" onclick="empFilterDept('all',this)">All</button>
      ${depts.map(d => `<button class="filter-btn" onclick="empFilterDept('${d}',this)">${d} <span style="background:var(--surface3);border-radius:8px;padding:0 6px;font-size:11px;">${byDept[d].length}</span></button>`).join('')}
    </div>

    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Location</th>
              <th>Department</th>
              <th>Designation</th>
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
  if (employees.length === 0) return `<tr><td colspan="6"><div class="empty-state"><div class="icon">👥</div><h3>No employees yet</h3><p>Add manually or import an Excel file</p></div></td></tr>`;
  return employees.map((e, i) => `<tr data-dept="${e.department||''}">
    <td style="color:var(--text2);font-size:13px;">${i+1}</td>
    <td><strong>${e.name}</strong></td>
    <td><span class="badge badge-blue" style="font-size:11px;">${e.location||empCurrentLocation}</span></td>
    <td><span class="dept-pill">${e.department||'—'}</span></td>
    <td style="font-size:13px;">${e.designation||'—'}</td>
    <td class="action-btns">
      <button class="btn btn-small btn-secondary" onclick="empOpenEdit('${e.id}')">Edit</button>
      <button class="btn btn-small btn-danger" onclick="empDelete('${e.id}')">Del</button>
    </td>
  </tr>`).join('');
}

async function empFilter() {
  const q = document.getElementById('emp-search').value.toLowerCase();
  const all = await DB.getEmployees(empCurrentLocation);
  const filtered = all.filter(e =>
    e.name.toLowerCase().includes(q) ||
    (e.department||'').toLowerCase().includes(q) ||
    (e.designation||'').toLowerCase().includes(q)
  );
  document.getElementById('emp-tbody').innerHTML = empRows(filtered);
}

function empFilterDept(dept, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const rows = document.querySelectorAll('#emp-tbody tr[data-dept]');
  rows.forEach(r => {
    r.style.display = (dept === 'all' || r.dataset.dept === dept) ? '' : 'none';
  });
}

// ---- EXCEL IMPORT ----
async function empImportExcel(input) {
  const file = input.files[0];
  if (!file) return;

  // Show overlay
  const overlay = document.getElementById('emp-import-overlay');
  overlay.style.display = 'flex';
  document.getElementById('emp-import-status').textContent = 'Reading Excel file...';
  document.getElementById('emp-import-bar').style.width = '5%';

  try {
    const data = await file.arrayBuffer();
    // Use SheetJS (XLSX) loaded via CDN in index.html
    const workbook = XLSX.read(data, { type: 'arraybuffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Filter rows matching current location (or import all)
    const toImport = rows.filter(r => {
      const loc = (r['Location'] || r['location'] || '').toString().trim();
      return loc === '' || loc.toLowerCase() === empCurrentLocation.toLowerCase() || loc === empCurrentLocation;
    });

    if (toImport.length === 0) {
      overlay.style.display = 'none';
      toast(`No rows found for ${empCurrentLocation}. Check Location column matches exactly.`, 'error');
      input.value = '';
      return;
    }

    document.getElementById('emp-import-status').textContent = `Checking for existing employees...`;
    document.getElementById('emp-import-count').textContent = `0 / ${toImport.length}`;

    // Load existing employees to check for duplicates
    const existing = await DB.getEmployees(empCurrentLocation);
    const existingNames = new Set(existing.map(e => e.name.trim().toLowerCase()));

    let saved = 0, skipped = 0;
    for (const row of toImport) {
      const name = (row['Name'] || row['name'] || '').toString().trim();
      if (!name) continue;

      // Skip if already exists (case-insensitive match)
      if (existingNames.has(name.toLowerCase())) {
        skipped++;
        const pct = Math.round(((saved + skipped) / toImport.length) * 100);
        document.getElementById('emp-import-bar').style.width = pct + '%';
        document.getElementById('emp-import-count').textContent = `${saved + skipped} / ${toImport.length}`;
        document.getElementById('emp-import-status').textContent = `⏭ Skipped (duplicate): ${name}`;
        continue;
      }

      const emp = {
        id: genId(),
        name,
        location: (row['Location'] || row['location'] || empCurrentLocation).toString().trim(),
        department: (row['Department'] || row['department'] || '').toString().trim(),
        designation: (row['Designation'] || row['designation'] || '').toString().trim(),
      };
      await DB.saveEmployee(empCurrentLocation, emp);
      existingNames.add(name.toLowerCase()); // prevent duplicates within same file too
      saved++;
      const pct = Math.round(((saved + skipped) / toImport.length) * 100);
      document.getElementById('emp-import-bar').style.width = pct + '%';
      document.getElementById('emp-import-count').textContent = `${saved + skipped} / ${toImport.length}`;
      document.getElementById('emp-import-status').textContent = `✅ Saving: ${emp.name}`;
    }

    overlay.style.display = 'none';
    if (skipped > 0) {
      toast(`✅ ${saved} imported, ${skipped} skipped (already exist)`);
    } else {
      toast(`✅ ${saved} employees imported successfully!`);
    }
    input.value = '';
    employeesRender(empCurrentLocation);

  } catch (err) {
    overlay.style.display = 'none';
    toast('Error reading Excel file: ' + err.message, 'error');
    input.value = '';
    console.error(err);
  }
}

// ---- MODAL ----
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
            <input id="emp-location" type="text" value="${empCurrentLocation}" readonly style="opacity:0.7;"/>
          </div>
          <div class="form-group">
            <label>Department</label>
            <input id="emp-dept" type="text" placeholder="Finance, HR, IT..."/>
          </div>
          <div class="form-group span2">
            <label>Designation</label>
            <input id="emp-designation" type="text" placeholder="Job title / designation"/>
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

function empOpenAdd() {
  empEditId = null;
  document.getElementById('emp-modal-title').textContent = 'Add Employee';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-dept').value = '';
  document.getElementById('emp-designation').value = '';
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
