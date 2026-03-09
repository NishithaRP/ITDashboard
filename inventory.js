// ============================================================
// IT INVENTORY MODULE
// ============================================================

let invCurrentLocation = '';
let invEditId = null;

function inventoryRender(location) {
  invCurrentLocation = location;
  const items = DB.getInventory(location);
  const pcs = items.filter(i => i.deviceType === 'PC').length;
  const laptops = items.filter(i => i.deviceType === 'Laptop').length;

  return `
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">💻 IT Inventory</div>
        <div class="section-subtitle">${location} — ${items.length} device(s)</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input id="inv-search" type="text" placeholder="Search employee, serial..." oninput="invFilter()"/>
        </div>
        <button class="btn btn-secondary" onclick="invOpenAdd()">+ Add Device</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Total Devices</div><div class="stat-value">${items.length}</div></div>
      <div class="stat-card"><div class="stat-label">PCs</div><div class="stat-value" style="color:var(--accent2)">${pcs}</div></div>
      <div class="stat-card"><div class="stat-label">Laptops</div><div class="stat-value" style="color:var(--warning)">${laptops}</div></div>
    </div>

    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table id="inv-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Brand/Model</th>
              <th>Serial #</th>
              <th>Storage</th>
              <th>RAM</th>
              <th>Mouse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="inv-tbody">
            ${invRows(items)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ${invModal()}`;
}

function invRows(items) {
  if (items.length === 0) return `<tr><td colspan="8"><div class="empty-state"><div class="icon">💻</div><h3>No devices yet</h3><p>Add a device to get started</p></div></td></tr>`;
  return items.map(item => `
    <tr>
      <td><strong>${item.employee}</strong></td>
      <td><span class="badge ${item.deviceType==='PC'?'badge-blue':'badge-green'}">${item.deviceType}</span></td>
      <td>${item.brand} ${item.model}</td>
      <td style="font-family:monospace;font-size:12px;">${item.serialNumber}</td>
      <td>
        ${item.storageType} ${item.storageSize}GB
        ${item.ssdSerial ? `<br><span style="font-size:11px;color:var(--text2)">S/N: ${item.ssdSerial}</span>` : ''}
        ${item.extraHdd ? `<br><span class="badge badge-yellow" style="font-size:10px;">+HDD ${item.extraHddSize}GB</span>` : ''}
      </td>
      <td>${item.ram} GB</td>
      <td><span class="badge ${item.mouseGiven?'badge-green':'badge-gray'}">${item.mouseGiven?'Yes':'No'}</span></td>
      <td class="action-btns">
        <button class="btn btn-small btn-secondary" onclick="invOpenEdit('${item.id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="invDelete('${item.id}')">Del</button>
      </td>
    </tr>`).join('');
}

function invFilter() {
  const q = document.getElementById('inv-search').value.toLowerCase();
  const items = DB.getInventory(invCurrentLocation).filter(i =>
    i.employee.toLowerCase().includes(q) ||
    i.serialNumber.toLowerCase().includes(q) ||
    i.brand.toLowerCase().includes(q) ||
    i.model.toLowerCase().includes(q)
  );
  document.getElementById('inv-tbody').innerHTML = invRows(items);
}

function invModal() {
  return `
  <div id="inv-modal" class="modal-overlay" style="display:none;">
    <div class="modal" style="max-width:780px;">
      <div class="modal-header">
        <div class="modal-title" id="inv-modal-title">Add Device</div>
        <button class="btn-close" onclick="invCloseModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <!-- Basic Info -->
          <div class="form-section-label">Basic Information</div>
          <div class="form-group">
            <label>Employee Name</label>
            <input id="inv-employee" type="text" placeholder="Full name"/>
          </div>
          <div class="form-group">
            <label>Device Type</label>
            <select id="inv-type" onchange="invTogglePCFields()">
              <option value="Laptop">Laptop</option>
              <option value="PC">PC (Desktop)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Brand</label>
            <input id="inv-brand" type="text" placeholder="Dell, HP, Lenovo..."/>
          </div>
          <div class="form-group">
            <label>Model</label>
            <input id="inv-model" type="text" placeholder="Model name"/>
          </div>
          <div class="form-group">
            <label>Serial Number</label>
            <input id="inv-serial" type="text" placeholder="Device serial #"/>
          </div>
          <div class="form-group">
            <label>RAM (GB)</label>
            <input id="inv-ram" type="number" placeholder="8, 16, 32..."/>
          </div>

          <hr class="form-section-divider"/>
          <div class="form-section-label">Primary Storage</div>
          <div class="form-group">
            <label>Storage Type</label>
            <select id="inv-storage-type">
              <option value="SSD">SSD</option>
              <option value="HDD">HDD</option>
              <option value="NVMe">NVMe</option>
            </select>
          </div>
          <div class="form-group">
            <label>Storage Size (GB)</label>
            <input id="inv-storage-size" type="number" placeholder="256, 512, 1000..."/>
          </div>
          <div class="form-group span2">
            <label>SSD/HDD Serial Number</label>
            <input id="inv-ssd-serial" type="text" placeholder="Storage serial #"/>
          </div>

          <hr class="form-section-divider"/>
          <div class="form-section-label">Extra Storage</div>
          <div class="form-group span2">
            <div class="checkbox-group">
              <input type="checkbox" id="inv-extra-hdd" onchange="invToggleExtraHdd()"/>
              <label for="inv-extra-hdd">Extra HDD Added</label>
            </div>
          </div>
          <div id="inv-extra-hdd-fields" style="display:none;grid-column:span 2;">
            <div class="form-grid">
              <div class="form-group">
                <label>Extra HDD Size (GB)</label>
                <input id="inv-extra-hdd-size" type="number" placeholder="Size in GB"/>
              </div>
              <div class="form-group">
                <label>Extra HDD Serial</label>
                <input id="inv-extra-hdd-serial" type="text" placeholder="Serial #"/>
              </div>
            </div>
          </div>

          <hr class="form-section-divider"/>
          <div class="form-section-label">Peripherals</div>
          <div class="form-group span2">
            <div class="checkbox-group">
              <input type="checkbox" id="inv-mouse"/>
              <label for="inv-mouse">Mouse Given</label>
            </div>
          </div>

          <!-- PC-only fields -->
          <div id="inv-pc-fields" style="display:none;grid-column:span 2;">
            <div class="form-grid">
              <div class="form-section-label">PC Peripherals</div>
              
              <div class="form-group">
                <label>UPS Brand</label>
                <input id="inv-ups-brand" type="text" placeholder="APC, Microtek..."/>
              </div>
              <div class="form-group">
                <label>UPS Model</label>
                <input id="inv-ups-model" type="text" placeholder="Model"/>
              </div>
              <div class="form-group span2">
                <label>UPS Size (VA)</label>
                <input id="inv-ups-size" type="text" placeholder="e.g. 650VA"/>
              </div>

              <div class="form-group">
                <label>Keyboard Model</label>
                <input id="inv-keyboard" type="text" placeholder="Keyboard model"/>
              </div>
              <div class="form-group">
                <label>Monitor Brand</label>
                <input id="inv-monitor-brand" type="text" placeholder="Brand"/>
              </div>
              <div class="form-group">
                <label>Monitor Model</label>
                <input id="inv-monitor-model" type="text" placeholder="Model"/>
              </div>
              <div class="form-group">
                <label>Monitor Serial #</label>
                <input id="inv-monitor-serial" type="text" placeholder="Serial #"/>
              </div>

              <div class="form-group span2">
                <div class="checkbox-group">
                  <input type="checkbox" id="inv-vga" onchange="invToggleVga()"/>
                  <label for="inv-vga">VGA Card Added</label>
                </div>
              </div>
              <div id="inv-vga-fields" style="display:none;grid-column:span 2;">
                <div class="form-group">
                  <label>VGA Model</label>
                  <input id="inv-vga-model" type="text" placeholder="GPU model"/>
                </div>
              </div>
            </div>
          </div>

          <hr class="form-section-divider"/>
          <div class="form-group span2">
            <label>Additional Notes</label>
            <textarea id="inv-notes" rows="2" placeholder="Any other details..."></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="invCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="invSave()" style="width:auto">Save Device</button>
      </div>
    </div>
  </div>`;
}

function invTogglePCFields() {
  const isPc = document.getElementById('inv-type').value === 'PC';
  document.getElementById('inv-pc-fields').style.display = isPc ? 'grid' : 'none';
}

function invToggleExtraHdd() {
  const checked = document.getElementById('inv-extra-hdd').checked;
  document.getElementById('inv-extra-hdd-fields').style.display = checked ? 'grid' : 'none';
}

function invToggleVga() {
  const checked = document.getElementById('inv-vga').checked;
  document.getElementById('inv-vga-fields').style.display = checked ? 'block' : 'none';
}

function invOpenAdd() {
  invEditId = null;
  document.getElementById('inv-modal-title').textContent = 'Add Device';
  // Clear all fields
  ['inv-employee','inv-brand','inv-model','inv-serial','inv-ram','inv-storage-size',
   'inv-ssd-serial','inv-extra-hdd-size','inv-extra-hdd-serial','inv-ups-brand',
   'inv-ups-model','inv-ups-size','inv-keyboard','inv-monitor-brand','inv-monitor-model',
   'inv-monitor-serial','inv-vga-model','inv-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['inv-extra-hdd','inv-mouse','inv-vga'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  document.getElementById('inv-extra-hdd-fields').style.display = 'none';
  document.getElementById('inv-vga-fields').style.display = 'none';
  document.getElementById('inv-type').value = 'Laptop';
  invTogglePCFields();
  document.getElementById('inv-modal').style.display = 'flex';
}

function invOpenEdit(id) {
  const item = DB.getInventory(invCurrentLocation).find(i => i.id === id);
  if (!item) return;
  invEditId = id;
  document.getElementById('inv-modal-title').textContent = 'Edit Device';
  document.getElementById('inv-employee').value = item.employee || '';
  document.getElementById('inv-type').value = item.deviceType || 'Laptop';
  document.getElementById('inv-brand').value = item.brand || '';
  document.getElementById('inv-model').value = item.model || '';
  document.getElementById('inv-serial').value = item.serialNumber || '';
  document.getElementById('inv-ram').value = item.ram || '';
  document.getElementById('inv-storage-type').value = item.storageType || 'SSD';
  document.getElementById('inv-storage-size').value = item.storageSize || '';
  document.getElementById('inv-ssd-serial').value = item.ssdSerial || '';
  document.getElementById('inv-extra-hdd').checked = !!item.extraHdd;
  document.getElementById('inv-extra-hdd-fields').style.display = item.extraHdd ? 'grid' : 'none';
  document.getElementById('inv-extra-hdd-size').value = item.extraHddSize || '';
  document.getElementById('inv-extra-hdd-serial').value = item.extraHddSerial || '';
  document.getElementById('inv-mouse').checked = !!item.mouseGiven;
  document.getElementById('inv-ups-brand').value = item.upsBrand || '';
  document.getElementById('inv-ups-model').value = item.upsModel || '';
  document.getElementById('inv-ups-size').value = item.upsSize || '';
  document.getElementById('inv-keyboard').value = item.keyboard || '';
  document.getElementById('inv-monitor-brand').value = item.monitorBrand || '';
  document.getElementById('inv-monitor-model').value = item.monitorModel || '';
  document.getElementById('inv-monitor-serial').value = item.monitorSerial || '';
  document.getElementById('inv-vga').checked = !!item.vgaAdded;
  document.getElementById('inv-vga-fields').style.display = item.vgaAdded ? 'block' : 'none';
  document.getElementById('inv-vga-model').value = item.vgaModel || '';
  document.getElementById('inv-notes').value = item.notes || '';
  invTogglePCFields();
  document.getElementById('inv-modal').style.display = 'flex';
}

function invCloseModal() {
  document.getElementById('inv-modal').style.display = 'none';
}

function invSave() {
  const employee = document.getElementById('inv-employee').value.trim();
  if (!employee) { toast('Employee name is required', 'error'); return; }
  const deviceType = document.getElementById('inv-type').value;

  const item = {
    employee,
    deviceType,
    brand: document.getElementById('inv-brand').value.trim(),
    model: document.getElementById('inv-model').value.trim(),
    serialNumber: document.getElementById('inv-serial').value.trim(),
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

  const items = DB.getInventory(invCurrentLocation);
  if (invEditId) {
    const idx = items.findIndex(i => i.id === invEditId);
    if (idx > -1) items[idx] = { ...items[idx], ...item };
  } else {
    items.push({ id: genId(), ...item });
  }
  DB.saveInventory(invCurrentLocation, items);
  invCloseModal();
  toast('Device saved!');
  renderCurrentModule();
}

function invDelete(id) {
  if (!confirm('Delete this device record?')) return;
  const items = DB.getInventory(invCurrentLocation).filter(i => i.id !== id);
  DB.saveInventory(invCurrentLocation, items);
  toast('Device deleted');
  renderCurrentModule();
}
