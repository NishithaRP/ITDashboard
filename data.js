// ============================================================
// DATA LAYER - swap localStorage for Supabase later here
// ============================================================

const LOCATIONS = [
  'Head Office', 'Ambathale', 'Keragala', 'Wattala', 'Kadana', 'India', 'Indonesia'
];

const MODULES = [
  { id: 'wifi',      label: 'WiFi Connections', icon: '📶' },
  { id: 'inventory', label: 'IT Inventory',      icon: '💻' },
  { id: 'printers',  label: 'Printers',           icon: '🖨️' },
  { id: 'mobiles',   label: 'Mobile Phones',      icon: '📱' },
  { id: 'ip',        label: 'IP Manager',          icon: '🌐' },
  { id: 'systems',   label: 'Systems Access',      icon: '🖥️' }
];

// ---- Storage Helpers ----
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  // WIFI
  getWifi(location) { return DB.get(`wifi_${location}`); },
  saveWifi(location, data) { DB.set(`wifi_${location}`, data); },
  // Inventory
  getInventory(location) { return DB.get(`inventory_${location}`); },
  saveInventory(location, data) { DB.set(`inventory_${location}`, data); },
  // Printers
  getPrinters(location) { return DB.get(`printers_${location}`); },
  savePrinters(location, data) { DB.set(`printers_${location}`, data); },
  // Mobiles
  getMobiles(location) { return DB.get(`mobiles_${location}`); },
  saveMobiles(location, data) { DB.set(`mobiles_${location}`, data); },
  // IP
  getIPs(location) { return DB.get(`ips_${location}`); },
  saveIPs(location, data) { DB.set(`ips_${location}`, data); },
};

// ---- ID Generator ----
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- Current Month Helper ----
function currentMonthLabel() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${y}`;
}

function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.borderColor = type === 'error' ? 'var(--danger)' : 'var(--accent)';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
