// ============================================================
// PRINTERS MODULE — Supabase version
// ============================================================
let printerCurrentLocation = '';
let printerEditId = null;

async function printersRender(location) {
  printerCurrentLocation = location;
  const el = document.getElementById('module-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2);">⏳ Loading...</div>';
  const printers = await DB.getPrinters(location);
  if (el) el.innerHTML = printersHTML(location, printers) + printerModal();
}

function printersHTML(location, printers) {
  return `<div>
    <div class="section-header">
      <div><div class="section-title">🖨️ Printers</div><div class="section-subtitle">${location} — ${printers.length} printer(s)</div></div>
      <button class="btn btn-secondary" onclick="printerOpenAdd()">+ Add Printer</button>
    </div>
    <div class="bulk-bar" id="pr-bulk-bar">
      <span class="bulk-bar-count" id="pr-bulk-count">0 selected</span>
      <span class="bulk-bar-info">printers</span>
      <button class="btn-bulk-cancel" onclick="prBulkCancel()">✕ Cancel</button>
      <button class="btn-bulk-delete" onclick="prBulkDelete()">🗑 Delete Selected</button>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table>
      <thead><tr><th class="cb-col"><input type="checkbox" class="row-checkbox" id="pr-check-all" onchange="prToggleAll(this)"/></th><th>Brand / Model</th><th>Serial #</th><th>Color</th><th>Duplex</th><th>Department</th><th>Network</th><th>IP Address</th><th>Actions</th></tr></thead>
      <tbody>${printers.length===0?`<tr><td colspan="9"><div class="empty-state"><div class="icon">🖨️</div><h3>No printers yet</h3></div></td></tr>`:
        printers.map(p=>`<tr>
          <td class="cb-col"><input type="checkbox" class="row-checkbox pr-row-cb" data-id="${p.id}" onchange="prRowCheck()"/></td>
          <td><strong>${p.brand}</strong><br><span style="font-size:12px;color:var(--text2)">${p.model}</span></td>
          <td style="font-family:monospace;font-size:12px;">${p.serialNumber}</td>
          <td><span class="badge ${p.color?'badge-blue':'badge-gray'}">${p.color?'Color':'B&W'}</span></td>
          <td><span class="badge ${p.duplex?'badge-green':'badge-gray'}">${p.duplex?'Yes':'No'}</span></td>
          <td>${p.department}</td>
          <td><span class="badge ${p.network?'badge-green':'badge-gray'}">${p.network?'Network':'Local'}</span></td>
          <td style="font-family:monospace;font-size:12px;">${p.network&&p.ipAddress?p.ipAddress:'—'}</td>
          <td class="action-btns">
            <button class="btn btn-small btn-secondary" onclick="printerOpenEdit('${p.id}')">Edit</button>
            <button class="btn btn-small btn-danger" onclick="printerDelete('${p.id}')">Del</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>
  </div>`;
}

function printerModal() {
  return `<div id="printer-modal" class="modal-overlay" style="display:none;">
    <div class="modal">
      <div class="modal-header"><div class="modal-title" id="printer-modal-title">Add Printer</div><button class="btn-close" onclick="printerCloseModal()">×</button></div>
      <div class="modal-body"><div class="form-grid">
        <div class="form-group"><label>Brand</label><input id="pr-brand" type="text" placeholder="HP, Canon, Epson..."/></div>
        <div class="form-group"><label>Model</label><input id="pr-model" type="text"/></div>
        <div class="form-group"><label>Serial Number</label><input id="pr-serial" type="text"/></div>
        <div class="form-group"><label>Assigned Department</label><input id="pr-dept" type="text"/></div>
        <div class="form-group"><div class="checkbox-group"><input type="checkbox" id="pr-color"/><label for="pr-color">Color Printer</label></div></div>
        <div class="form-group"><div class="checkbox-group"><input type="checkbox" id="pr-duplex"/><label for="pr-duplex">Duplex (Double-sided)</label></div></div>
        <div class="form-group span2"><div class="checkbox-group"><input type="checkbox" id="pr-network" onchange="printerToggleIP()"/><label for="pr-network">Network Printer</label></div></div>
        <div id="pr-ip-field" style="display:none;grid-column:span 2;"><div class="form-group"><label>IP Address</label><input id="pr-ip" type="text" placeholder="192.168.1.100"/></div></div>
      </div></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="printerCloseModal()">Cancel</button>
        <button class="btn btn-primary" onclick="printerSave()" style="width:auto">Save Printer</button>
      </div>
    </div>
  </div>`;
}


function prRowCheck() {
  const cbs = document.querySelectorAll('.pr-row-cb');
  const checked = document.querySelectorAll('.pr-row-cb:checked');
  document.getElementById('pr-bulk-bar').classList.toggle('visible', checked.length > 0);
  document.getElementById('pr-bulk-count').textContent = checked.length + ' selected';
  document.getElementById('pr-check-all').indeterminate = checked.length > 0 && checked.length < cbs.length;
  document.getElementById('pr-check-all').checked = checked.length === cbs.length && cbs.length > 0;
}
function prToggleAll(cb) { document.querySelectorAll('.pr-row-cb').forEach(c => c.checked = cb.checked); prRowCheck(); }
function prBulkCancel() {
  document.querySelectorAll('.pr-row-cb').forEach(c => c.checked = false);
  document.getElementById('pr-check-all').checked = false;
  document.getElementById('pr-bulk-bar').classList.remove('visible');
}
async function prBulkDelete() {
  const ids = [...document.querySelectorAll('.pr-row-cb:checked')].map(c => c.dataset.id);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} printer(s)?`)) return;
  for (const id of ids) await DB.deletePrinter(id);
  toast(`🗑 ${ids.length} printer(s) deleted`);
  printersRender(printerCurrentLocation);
}

function printerToggleIP() { document.getElementById('pr-ip-field').style.display = document.getElementById('pr-network').checked ? 'grid' : 'none'; }

function printerOpenAdd() {
  printerEditId = null;
  document.getElementById('printer-modal-title').textContent = 'Add Printer';
  ['pr-brand','pr-model','pr-serial','pr-dept','pr-ip'].forEach(id => document.getElementById(id).value='');
  ['pr-color','pr-duplex','pr-network'].forEach(id => document.getElementById(id).checked=false);
  document.getElementById('pr-ip-field').style.display='none';
  document.getElementById('printer-modal').style.display='flex';
}

async function printerOpenEdit(id) {
  const printers = await DB.getPrinters(printerCurrentLocation);
  const p = printers.find(x => x.id === id);
  if (!p) return;
  printerEditId = id;
  document.getElementById('printer-modal-title').textContent = 'Edit Printer';
  document.getElementById('pr-brand').value = p.brand||'';
  document.getElementById('pr-model').value = p.model||'';
  document.getElementById('pr-serial').value = p.serialNumber||'';
  document.getElementById('pr-dept').value = p.department||'';
  document.getElementById('pr-color').checked = !!p.color;
  document.getElementById('pr-duplex').checked = !!p.duplex;
  document.getElementById('pr-network').checked = !!p.network;
  document.getElementById('pr-ip').value = p.ipAddress||'';
  document.getElementById('pr-ip-field').style.display = p.network?'grid':'none';
  document.getElementById('printer-modal').style.display='flex';
}

function printerCloseModal() { document.getElementById('printer-modal').style.display='none'; }

async function printerSave() {
  const brand = document.getElementById('pr-brand').value.trim();
  if (!brand) { toast('Brand is required','error'); return; }
  const item = { id: printerEditId||genId(), brand, model: document.getElementById('pr-model').value.trim(), serialNumber: document.getElementById('pr-serial').value.trim(), department: document.getElementById('pr-dept').value.trim(), color: document.getElementById('pr-color').checked, duplex: document.getElementById('pr-duplex').checked, network: document.getElementById('pr-network').checked, ipAddress: document.getElementById('pr-ip').value.trim() };
  toast('Saving...'); await DB.savePrinter(printerCurrentLocation, item);
  printerCloseModal(); toast('Printer saved!'); printersRender(printerCurrentLocation);
}

async function printerDelete(id) {
  if (!confirm('Delete this printer?')) return;
  await DB.deletePrinter(id); toast('Printer deleted'); printersRender(printerCurrentLocation);
}
