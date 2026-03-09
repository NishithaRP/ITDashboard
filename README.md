# Polydime IT

A full IT management web app for all branch locations of Polydime Plastics International.

## Features
- **7 Location Tabs**: Head Office, Ambathale, Keragala, Wattala, Kadana, India, Indonesia
- **WiFi Connections**: Track accounts, subscriptions, monthly GB & billing with auto-fill
- **IT Inventory**: PCs & Laptops with full peripheral details (UPS, monitors, VGA, etc.)
- **Printers**: Color, duplex, network printers with IP addresses
- **Mobile Phones**: Employee mobile inventory with IMEI tracking
- **IP Manager**: IP address assignment per employee/device

## Default Login Credentials
| Username | Password       | Role   |
|----------|---------------|--------|
| admin    | Polydime@2024 | Admin  |
| itexec   | IT@exec2024   | Admin  |
| viewer   | View@2024     | Viewer |

⚠️ **Change these passwords** in `auth.js` before deploying.

---

## Deploying to Vercel (Recommended — FREE, access from anywhere)

### Option A — Direct Upload (no Git needed)
1. Go to https://vercel.com and sign up
2. Click **Add New → Project**
3. Choose **"Deploy without connecting to Git"**
4. Upload your entire `polydime-it` folder
5. Click **Deploy**
6. Live at: `https://polydime-it.vercel.app` in ~30 seconds

### Option B — Via GitHub (best for updates)
1. Push all files to a GitHub repo (keep the `modules/` folder structure)
2. Go to vercel.com → **Add New → Project**
3. Import your GitHub repository
4. Click **Deploy**
5. Every future push to GitHub auto-redeploys

### Custom Domain (optional)
In Vercel project settings → Domains → add `it.polydime.com` (or any domain you own)

---

## Deploying to GitHub Pages (FREE alternative)

### Step 1: Create GitHub Repository
1. Go to https://github.com and sign in
2. Click **New Repository**
3. Name it: `polydime-it-manager`
4. Set to **Private** (recommended for company data)
5. Click **Create Repository**

### Step 2: Upload Files
Option A - via GitHub website:
1. Open your repository
2. Click **Add file → Upload files**
3. Drag and drop ALL files from this folder
4. Click **Commit changes**

Option B - via Git (if installed):
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/polydime-it-manager.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repository **Settings**
2. Click **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch, **/ (root)** folder
5. Click **Save**
6. Your app will be live at: `https://YOUR_USERNAME.github.io/polydime-it-manager`

> ⚠️ **Note**: GitHub Pages repos must be PUBLIC for free accounts. If you need private hosting, use **Netlify** instead (see below).

---

## Alternative: Netlify (supports private, free tier)
1. Go to https://netlify.com
2. Sign up with your GitHub account
3. Click **Add new site → Import an existing project**
4. Connect GitHub → select your repository
5. Click **Deploy site**
6. You'll get a URL like `https://your-site.netlify.app`
7. You can set a custom domain in Netlify settings

---

## Upgrading to Supabase (for multi-user real-time data)

### Using a DIFFERENT email for Supabase
Yes — you can create a new Supabase account at https://supabase.com with any email.
Each account gets its own free tier (500MB database, unlimited API calls).

### Steps to add Supabase:
1. Create account at supabase.com (use a new email if needed)
2. Create a new project
3. Create tables: `wifi_connections`, `wifi_months`, `inventory`, `printers`, `mobiles`, `ip_assignments`
   - Each table should have: `id`, `location`, and all relevant fields
4. In `data.js`, replace the `DB` object methods with Supabase client calls:

```javascript
// Install: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

// Replace DB.getWifi with:
async function getWifi(location) {
  const { data } = await supabase.from('wifi_connections').select('*').eq('location', location);
  return data || [];
}
```

5. Replace `auth.js` login with Supabase Auth:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

---

## File Structure
```
polydime-it-manager/
├── index.html          # Main entry point
├── style.css           # All styles
├── data.js             # Data layer (swap for Supabase here)
├── auth.js             # Authentication
├── app.js              # Main controller
└── modules/
    ├── wifi.js         # WiFi management
    ├── inventory.js    # IT inventory
    ├── printers.js     # Printer management
    ├── mobiles.js      # Mobile phones
    └── ipmanager.js    # IP address manager
```

## Data Storage
Currently uses **browser localStorage** — data is stored in the browser.
For shared access across multiple users/devices, upgrade to Supabase.
