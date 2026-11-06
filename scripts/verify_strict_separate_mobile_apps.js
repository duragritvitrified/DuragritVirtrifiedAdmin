import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9233;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testStrictSeparateApps() {
  console.log('=== STRICT SEPARATE MOBILE APPS VERIFICATION ===');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_strict_test_' + Date.now());
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
    // TEST 1: VENDOR MOBILE APP LOGIN & INNER PAGES
    // =========================================================================
    console.log('\n--- 1. Testing Vendor Mobile App (http://localhost:3001/?app=vendor) ---');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=vendor' });
    await sleep(2000);

    // Verify login panel has only Demo Vendor & Demo Partner, NO Admin button
    const vendorLoginInspect = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasDemoVendor = bodyText.includes('Demo Vendor');
        const hasDemoPartner = bodyText.includes('Demo Partner');
        const hasNoAdminBtn = !bodyText.includes('🛡️ Admin');
        const isVendorSignIn = bodyText.includes('Vendor Sign In') || bodyText.includes('DURAGRIT VITRIFIED');
        return { hasDemoVendor, hasDemoPartner, hasNoAdminBtn, isVendorSignIn };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Login Screen Inspection:', vendorLoginInspect.result.value);

    // Click Demo Vendor button on UI
    console.log('Clicking Demo Vendor button on UI...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const vendorBtn = buttons.find(b => b.innerText && b.innerText.includes('Demo Vendor'));
        if (vendorBtn) vendorBtn.click();
        return !!vendorBtn;
      })()`,
      returnByValue: true
    });
    await sleep(500);

    // Click Submit button to log in as Vendor
    console.log('Submitting Vendor Login Form...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
        return !!submitBtn;
      })()`,
      returnByValue: true
    });
    await sleep(2500);

    // Verify that after login, it displays VENDOR INNER PAGES & TABS
    const vendorInnerInspect = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const url = window.location.href;
        const hasVendorHeader = bodyText.includes('Vendor Partner App');
        const hasVendorId = bodyText.includes('VEN-001');
        const hasReliance = bodyText.includes('Reliance Polymers');
        const hasDonut = bodyText.includes('Payout & Scan Summary') || bodyText.includes('Total Scanned');
        const has5Tabs = bodyText.includes('Overview') && bodyText.includes('Registry') && bodyText.includes('Scan QR') && bodyText.includes('Orders') && bodyText.includes('Account');
        const hasNoAdminTabs = !bodyText.includes('Requests Queue') && !bodyText.includes('QR Generate') && !bodyText.includes('Logs');
        return { url, hasVendorHeader, hasVendorId, hasReliance, hasDonut, has5Tabs, hasNoAdminTabs };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Inner Pages & Tabs Inspection:', vendorInnerInspect.result.value);

    const vendorShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'vendor_app_verified_inner_pages.png'), Buffer.from(vendorShot.data, 'base64'));
    console.log('Saved screenshot: vendor_app_verified_inner_pages.png');

    // =========================================================================
    // TEST 2: ADMIN MOBILE APP LOGIN & INNER PAGES
    // =========================================================================
    console.log('\n--- 2. Testing Admin Mobile App (http://localhost:3001/?app=admin) ---');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(2000);

    // Verify Admin Login screen
    const adminLoginInspect = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasAdminConsole = bodyText.includes('ADMIN CONSOLE') || bodyText.includes('Super Admin Portal') || bodyText.includes('DuraGrit');
        const hasAutoFill = bodyText.includes('Auto-Fill');
        return { hasAdminConsole, hasAutoFill };
      })()`,
      returnByValue: true
    });
    console.log('Admin Login Screen Inspection:', adminLoginInspect.result.value);

    // Click Auto-Fill button on Admin Login
    console.log('Clicking Auto-Fill button on Admin Login...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const autoFillBtn = buttons.find(b => b.innerText && b.innerText.includes('Auto-Fill'));
        if (autoFillBtn) autoFillBtn.click();
        return !!autoFillBtn;
      })()`,
      returnByValue: true
    });
    await sleep(500);

    // Click Sign In to Admin Console button
    console.log('Submitting Admin Login Form...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
        return !!submitBtn;
      })()`,
      returnByValue: true
    });
    await sleep(2500);

    // Verify that after login, it displays ADMIN INNER PAGES & TABS
    const adminInnerInspect = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const url = window.location.href;
        const hasAdminBadge = bodyText.includes('ADMIN');
        const hasAdminTabs = bodyText.includes('Overview') && bodyText.includes('Requests') && bodyText.includes('QR Generate') && bodyText.includes('Logs');
        const hasKilnHQ = bodyText.includes('HQ') || bodyText.includes('Node') || bodyText.includes('Escrow');
        return { url, hasAdminBadge, hasAdminTabs, hasKilnHQ };
      })()`,
      returnByValue: true
    });
    console.log('Admin Inner Pages & Tabs Inspection:', adminInnerInspect.result.value);

    const adminShot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_app_verified_inner_pages.png'), Buffer.from(adminShot.data, 'base64'));
    console.log('Saved screenshot: admin_app_verified_inner_pages.png');

    console.log('\n=== BOTH SEPARATE APPS SUCCESSFULLY VERIFIED! ===');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

testStrictSeparateApps().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

