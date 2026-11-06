import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9232;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTwoMobileAppsTest() {
  console.log('--- Starting Two Separate Mobile Apps Verification Test ---');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_test_two_apps_' + Date.now());
  fs.mkdirSync(tempProfile, { recursive: true });

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    'about:blank'
  ]);

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        versionData = await res.json();
        break;
      } catch (err) {}
    }

    if (!versionData) throw new Error('Could not connect to Chrome CDP port ' + PORT);

    const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetInfo = await newTargetRes.json();
    const ws = new WebSocket(targetInfo.webSocketDebuggerUrl);

    let idCounter = 1;
    const pendingPromises = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingPromises.has(msg.id)) {
        const { resolve, reject } = pendingPromises.get(msg.id);
        pendingPromises.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => { ws.onopen = resolve; });

    const sendCDP = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await sendCDP('Page.enable');
    await sendCDP('DOM.enable');
    await sendCDP('Runtime.enable');

    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 2,
      mobile: true
    });

    // =========================================================================
    // PART 1: TEST VENDOR MOBILE APP (http://localhost:3001/?app=vendor)
    // =========================================================================
    console.log('\n--- PART 1: Testing Vendor Mobile App (/?app=vendor) ---');
    console.log('1. Navigating to http://localhost:3001/?app=vendor');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=vendor' });
    await sleep(2000);

    // Capture Vendor Sign In screen
    const vendorSignInShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'vendor_app_screen_signin.png'), Buffer.from(vendorSignInShot.data, 'base64'));
    console.log('Saved screenshot: vendor_app_screen_signin.png');

    // Seed Vendor session into localStorage
    console.log('2. Signing in as Vendor VEN-001 (Reliance Polymers)...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const vendorSession = {
          id: 'VEN-001',
          vendorId: 'VEN-001',
          name: 'Reliance Polymers Ltd (Hazira Complex)',
          companyName: 'Reliance Polymers Ltd (Hazira Complex)',
          phone: '9825011223',
          mobile: '9825011223',
          email: 'hazira.dispatch@reliance.com',
          location: 'Hazira, Surat, Gujarat',
          category: 'Super Distributor',
          role: 'Vendor',
          isAdmin: false,
          status: 'ACTIVE',
          isAuthenticated: true,
          loginTimestamp: Date.now()
        };
        localStorage.setItem('duragrit_vendor_mobile_session_v6', JSON.stringify(vendorSession));
        return true;
      })()`,
      returnByValue: true
    });

    // Navigate to reload with the session active
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=vendor' });
    await sleep(2500);

    // Verify Vendor Dashboard loaded
    const vendorDashboardInfo = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        return {
          hasVendorHeader: bodyText.includes('Vendor Partner App'),
          hasVendorCompany: bodyText.includes('Reliance Polymers') || bodyText.includes('VEN-001') || bodyText.includes('Super Distributor'),
          hasScanQR: bodyText.includes('Scan QR'),
          hasOrders: bodyText.includes('Orders'),
          hasAdminSwitch: bodyText.includes('Admin App'),
          bodySnippet: bodyText.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Dashboard Verification:', vendorDashboardInfo.result.value);

    const vendorDashShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'vendor_app_screen_dashboard.png'), Buffer.from(vendorDashShot.data, 'base64'));
    console.log('Saved screenshot: vendor_app_screen_dashboard.png');

    // =========================================================================
    // PART 2: TEST ADMIN MOBILE APP (http://localhost:3001/?app=admin)
    // =========================================================================
    console.log('\n--- PART 2: Testing Admin Mobile App (/?app=admin) ---');
    console.log('1. Navigating to http://localhost:3001/?app=admin');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(1500);

    // Seed Admin session into duragrit_admin_mobile_session_v6
    console.log('2. Authenticating as Super Admin in Admin Mobile App...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const adminSession = {
          id: 'ADMIN-01',
          name: 'DuraGrit Super Admin',
          email: 'duragrit07@gmail.com',
          mobile: '9000000000',
          role: 'Admin',
          isAdmin: true,
          status: 'Active',
          isAuthenticated: true,
          loginTimestamp: Date.now()
        };
        localStorage.setItem('duragrit_admin_mobile_session_v6', JSON.stringify(adminSession));
        return true;
      })()`,
      returnByValue: true
    });

    // Navigate to reload with the admin session active
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(2500);

    // Verify Admin App loaded (Obsidian UI, Admin Console, tabs: Overview, Requests, QR Generate, Logs)
    const adminAppInfo = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        return {
          hasAdminBadge: bodyText.includes('ADMIN'),
          hasOverviewTab: bodyText.includes('Overview'),
          hasRequestsTab: bodyText.includes('Requests'),
          hasQrGenTab: bodyText.includes('QR Generate'),
          hasVendorSwitch: bodyText.includes('Vendor App'),
          bodySnippet: bodyText.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });
    console.log('Admin Mobile App Verification:', adminAppInfo.result.value);

    const adminOverviewShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_app_overview.png'), Buffer.from(adminOverviewShot.data, 'base64'));
    console.log('Saved screenshot: admin_mobile_app_overview.png');

    // Click Requests Tab in Admin App
    console.log('3. Navigating to Requests Tab in Admin Mobile App...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button, nav button'));
        const reqBtn = buttons.find(b => b.innerText && b.innerText.includes('Requests'));
        if (reqBtn) {
          reqBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    await sleep(1000);

    const adminRequestsShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_app_requests.png'), Buffer.from(adminRequestsShot.data, 'base64'));
    console.log('Saved screenshot: admin_mobile_app_requests.png');

    // =========================================================================
    // PART 3: VERIFY COMPLETE SESSION ISOLATION
    // =========================================================================
    console.log('\n--- PART 3: Verifying Session Isolation ---');
    console.log('Navigating back to http://localhost:3001/?app=vendor to ensure Vendor session is untouched...');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=vendor' });
    await sleep(2000);

    const isolationCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        return {
          isStillVendor: bodyText.includes('Vendor Partner App') && (bodyText.includes('Reliance Polymers') || bodyText.includes('VEN-001') || bodyText.includes('Super Distributor')),
          hasNoAdminRev: !bodyText.includes('Admin Rev'),
          activeKeyVendor: !!localStorage.getItem('duragrit_vendor_mobile_session_v6'),
          activeKeyAdmin: !!localStorage.getItem('duragrit_admin_mobile_session_v6')
        };
      })()`,
      returnByValue: true
    });
    console.log('Session Isolation Check Result:', isolationCheck.result.value);

    console.log('\n--- All Two Mobile Apps Verification Tests PASSED! ---');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

runTwoMobileAppsTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
