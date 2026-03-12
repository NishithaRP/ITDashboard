// ============================================================
// DATA LAYER — Supabase Backend
// ============================================================

const SUPABASE_URL = 'https://fgobjyvfqloebeyvdlmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2JqeXZmcWxvZWJleXZkbG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzMxOTAsImV4cCI6MjA4ODYwOTE5MH0.WnYV2ixA4ekrXOPk8Uqrt57KS76DNhcRNMG3q_Q08PY';

const LOCATIONS = ['Head Office','Ambathale','Keragala','Wattala','Kadana','India','Indonesia'];

const MODULES = [
  { id:'wifi',      label:'WiFi Connections', icon:'📶' },
  { id:'inventory', label:'IT Inventory',     icon:'💻' },
  { id:'printers',  label:'Printers',          icon:'🖨️' },
  { id:'mobiles',   label:'Mobile Phones',     icon:'📱' },
  { id:'ip',        label:'IP Manager',         icon:'🌐' },
  { id:'systems',   label:'Systems Access',    icon:'🖥️' },
  { id:'employees', label:'Employees',          icon:'👥' }
];

async function sbFetch(path, options={}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = { 'apikey':SUPABASE_ANON_KEY, 'Authorization':`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json', 'Prefer':'return=representation', ...options.headers };
  const res = await fetch(url, {...options, headers});
  if (!res.ok) { console.error('Supabase error:', await res.text()); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const DB = {
  // WIFI
  async getWifi(location) {
    const conns = await sbFetch(`wifi_connections?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    if (!conns) return [];
    for (const c of conns) {
      const months = await sbFetch(`wifi_months?connection_id=eq.${c.id}&order=month.desc`);
      c.months = (months||[]).map(m=>({id:m.id,month:m.month,gbAmount:m.gb_amount,price:m.price,extraGb:m.extra_gb,extraCost:m.extra_cost,notes:m.notes}));
      c.accountNumber=c.account_number; c.subscriptionNumber=c.subscription_number;
      c.defaultGb=c.default_gb; c.defaultPrice=c.default_price;
    }
    return conns;
  },
  async saveWifiConnection(location,conn) {
    await sbFetch('wifi_connections',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:conn.id,location,name:conn.name,account_number:conn.accountNumber,subscription_number:conn.subscriptionNumber,default_gb:conn.defaultGb,default_price:conn.defaultPrice})});
  },
  async deleteWifiConnection(id) { await sbFetch(`wifi_connections?id=eq.${id}`,{method:'DELETE'}); },
  async saveWifiMonth(connId,location,m) {
    await sbFetch('wifi_months',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:m.id,connection_id:connId,location,month:m.month,gb_amount:m.gbAmount,price:m.price,extra_gb:m.extraGb,extra_cost:m.extraCost,notes:m.notes})});
  },
  async deleteWifiMonth(id) { await sbFetch(`wifi_months?id=eq.${id}`,{method:'DELETE'}); },

  // INVENTORY
  async getInventory(location) {
    const rows = await sbFetch(`inventory?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    return (rows||[]).map(r=>({id:r.id,employee:r.employee,deviceType:r.device_type,brand:r.brand,model:r.model,serialNumber:r.serial_number,ram:r.ram,storageType:r.storage_type,storageSize:r.storage_size,ssdSerial:r.ssd_serial,extraHdd:r.extra_hdd,extraHddSize:r.extra_hdd_size,extraHddSerial:r.extra_hdd_serial,mouseGiven:r.mouse_given,upsBrand:r.ups_brand,upsModel:r.ups_model,upsSize:r.ups_size,keyboard:r.keyboard,monitorBrand:r.monitor_brand,monitorModel:r.monitor_model,monitorSerial:r.monitor_serial,vgaAdded:r.vga_added,vgaModel:r.vga_model,notes:r.notes}));
  },
  async saveInventoryItem(location,item) {
    await sbFetch('inventory',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,employee:item.employee,device_type:item.deviceType,brand:item.brand,model:item.model,serial_number:item.serialNumber,ram:item.ram,storage_type:item.storageType,storage_size:item.storageSize,ssd_serial:item.ssdSerial,extra_hdd:item.extraHdd,extra_hdd_size:item.extraHddSize,extra_hdd_serial:item.extraHddSerial,mouse_given:item.mouseGiven,ups_brand:item.upsBrand,ups_model:item.upsModel,ups_size:item.upsSize,keyboard:item.keyboard,monitor_brand:item.monitorBrand,monitor_model:item.monitorModel,monitor_serial:item.monitorSerial,vga_added:item.vgaAdded,vga_model:item.vgaModel,notes:item.notes})});
  },
  async deleteInventoryItem(id) { await sbFetch(`inventory?id=eq.${id}`,{method:'DELETE'}); },

  // PRINTERS
  async getPrinters(location) {
    const rows = await sbFetch(`printers?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    return (rows||[]).map(r=>({id:r.id,brand:r.brand,model:r.model,serialNumber:r.serial_number,department:r.department,color:r.color,duplex:r.duplex,network:r.network,ipAddress:r.ip_address}));
  },
  async savePrinter(location,item) {
    await sbFetch('printers',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,brand:item.brand,model:item.model,serial_number:item.serialNumber,department:item.department,color:item.color,duplex:item.duplex,network:item.network,ip_address:item.ipAddress})});
  },
  async deletePrinter(id) { await sbFetch(`printers?id=eq.${id}`,{method:'DELETE'}); },

  // MOBILES
  async getMobiles(location) {
    const rows = await sbFetch(`mobiles?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    return (rows||[]).map(r=>({id:r.id,employee:r.employee,department:r.department,brand:r.brand,model:r.model,serialNumber:r.serial_number,imei:r.imei,mobileNumber:r.mobile_number}));
  },
  async saveMobile(location,item) {
    await sbFetch('mobiles',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,employee:item.employee,department:item.department,brand:item.brand,model:item.model,serial_number:item.serialNumber,imei:item.imei,mobile_number:item.mobileNumber})});
  },
  async deleteMobile(id) { await sbFetch(`mobiles?id=eq.${id}`,{method:'DELETE'}); },

  // IP MANAGER
  async getIPs(location) {
    const rows = await sbFetch(`ip_assignments?location=eq.${encodeURIComponent(location)}&order=ip_address.asc`);
    return (rows||[]).map(r=>({id:r.id,ipAddress:r.ip_address,employee:r.employee,device:r.device,mac:r.mac,department:r.department,notes:r.notes}));
  },
  async saveIP(location,item) {
    await sbFetch('ip_assignments',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,ip_address:item.ipAddress,employee:item.employee,device:item.device,mac:item.mac,department:item.department,notes:item.notes})});
  },
  async deleteIP(id) { await sbFetch(`ip_assignments?id=eq.${id}`,{method:'DELETE'}); },

  // SYSTEMS - RDP
  async getRDP(location) {
    const rows = await sbFetch(`rdp_accounts?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    return (rows||[]).map(r=>({id:r.id,label:r.label,computerName:r.computer_name,ipAddress:r.ip_address,port:r.port,username:r.username,password:r.password,notes:r.notes}));
  },
  async saveRDP(location,item) {
    await sbFetch('rdp_accounts',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,label:item.label,computer_name:item.computerName,ip_address:item.ipAddress,port:item.port,username:item.username,password:item.password,notes:item.notes})});
  },
  async deleteRDP(id) { await sbFetch(`rdp_accounts?id=eq.${id}`,{method:'DELETE'}); },

  // SYSTEMS - ERP
  async getERP(location) {
    const rows = await sbFetch(`erp_accounts?location=eq.${encodeURIComponent(location)}&order=created_at.asc`);
    return (rows||[]).map(r=>({id:r.id,employee:r.employee,department:r.department,erpSystem:r.erp_system,accessLevel:r.access_level,username:r.username,password:r.password,notes:r.notes}));
  },
  async saveERP(location,item) {
    await sbFetch('erp_accounts',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:item.id,location,employee:item.employee,department:item.department,erp_system:item.erpSystem,access_level:item.accessLevel,username:item.username,password:item.password,notes:item.notes})});
  },
  async deleteERP(id) { await sbFetch(`erp_accounts?id=eq.${id}`,{method:'DELETE'}); },

  // EMPLOYEES
  async getEmployees(location) {
    const rows = await sbFetch(`employees?location=eq.${encodeURIComponent(location)}&order=name.asc`);
    return (rows||[]).map(r=>({id:r.id,name:r.name,location:r.location,department:r.department,designation:r.designation}));
  },
  async saveEmployee(location,emp) {
    await sbFetch('employees',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:emp.id,location,name:emp.name,department:emp.department,designation:emp.designation})});
  },
  async deleteEmployee(id) { await sbFetch(`employees?id=eq.${id}`,{method:'DELETE'}); }
};

function genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function currentMonthLabel() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function formatMonth(ym) {
  if(!ym) return '';
  const [y,m]=ym.split('-');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${y}`;
}

function toast(msg,type='success') {
  const el=document.createElement('div');
  el.className='toast';
  el.style.borderColor=type==='error'?'var(--danger)':'var(--accent)';
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}
