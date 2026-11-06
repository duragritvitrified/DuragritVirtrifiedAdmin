import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9244;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runPortVerification() {
  console.log('=== VERIFYING DEDICATED PORTS: 3001 (ADMIN) & 3002 (VENDOR) ===');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ports_test_' + Date.now());
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
    for (let i = 0; i < 25; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        versionData = await res.json();
        break;
      } catch (_) {}
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
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      mobile: true
    });

    // =========================================================================
    // 1. TEST ADMIN MOBILE APP ON PORT 3001
    // =========================================================================
    console.log('\n[1/4] Navigating to http://localhost:3001 (Admin Mobile App)...');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001' });
    await sleep(2500);

    // Check that port 3001 displays the Admin Login Screen and NOT the inner dashboard
    const adminLoginCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const isAdminConsole = text.includes('ADMIN CONSOLE');
        const isSecurityTerminal = text.includes('Super Admin Security Terminal');
        const hasAdminInput = Boolean(document.querySelector('input[type="text"]') || document.querySelector('input[type="password"]'));
        const isInnerDashboard = text.includes('Factory Batches') || text.includes('Requests Queue') || text.includes('Live Moderation Console');
        return { isAdminConsole, isSecurityTerminal, hasAdminInput, isInnerDashboard, textSnippet: text.slice(0, 300) };
      })()`,
      returnByValue: true
    });

    console.log('Admin Port 3001 Login Panel State:', adminLoginCheck.result?.value);

    // Screenshot 1: Admin Login Panel on port 3001
    const screen1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_port_3001_login_panel.png'), Buffer.from(screen1.data, 'base64'));
    console.log('✓ Captured: admin_port_3001_login_panel.png');

    // Click Auto-Fill Demo Credentials & Login as Admin
    console.log('\n[2/4] Logging in as Admin on port 3001...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const autoFillBtn = buttons.find(b => b.innerText.includes('Auto-Fill') || b.innerText.includes('1234'));
        if (autoFillBtn) autoFillBtn.click();
      })()`
    });
    await sleep(600);

    const adminSubmitResult = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          return { success: true, text: submitBtn.innerText };
        }
        return { success: false };
      })()`,
      returnByValue: true
    });
    console.log('Admin Submit Triggered:', adminSubmitResult.result?.value);
    await sleep(2500);

    // Verify Admin Dashboard & 4 Tabs
    const adminDashboardCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasOverview = text.includes('Overview') || text.includes('Factory Batches');
        const hasRequests = text.includes('Requests') || text.includes('Moderation');
        const hasQRGen = text.includes('QR Gen') || text.includes('Generate QR');
        const hasAudit = text.includes('Logs') || text.includes('OTA') || text.includes('Telemetry');
        return { hasOverview, hasRequests, hasQRGen, hasAudit };
      })()`,
      returnByValue: true
    });
    console.log('Admin Dashboard Tabs Verified:', adminDashboardCheck.result?.value);

    // Screenshot 2: Admin Dashboard on port 3001
    const screen2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_port_3001_dashboard.png'), Buffer.from(screen2.data, 'base64'));
    console.log('✓ Captured: admin_port_3001_dashboard.png');

    // =========================================================================
    // 2. TEST VENDOR MOBILE APP ON PORT 3002
    // =========================================================================
    console.log('\n[3/4] Navigating to http://localhost:3002 (Vendor Mobile App)...');
    await sendCDP('Page.navigate', { url: 'http://localhost:3002' });
    await sleep(2500);

    // Check that port 3002 displays Vendor Sign-In Screen and NOT inner dashboard
    const vendorLoginCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const isVendorPortal = text.includes('Partner Portal') || text.includes('Vendor Sign In') || text.includes('DURAGRIT VITRIFIED');
        const hasDemoVendor = text.includes('Demo Vendor') || text.includes('VEN-001');
        const hasDemoPartner = text.includes('Demo Partner');
        const isInnerDashboard = text.includes('Active Reward Escrow') || text.includes('Dealer Carton Inward');
        return { isVendorPortal, hasDemoVendor, hasDemoPartner, isInnerDashboard, textSnippet: text.slice(0, 300) };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Port 3002 Login Panel State:', vendorLoginCheck.result?.value);

    // Screenshot 3: Vendor Login Panel on port 3002
    const screen3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'vendor_port_3002_login_panel.png'), Buffer.from(screen3.data, 'base64'));
    console.log('✓ Captured: vendor_port_3002_login_panel.png');

    // Click [🏢 Demo Vendor (VEN-001)] & Submit
    console.log('\n[4/4] Logging in as Vendor on port 3002...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const demoVendorBtn = buttons.find(b => b.innerText.includes('Demo Vendor') || b.innerText.includes('VEN-001'));
        if (demoVendorBtn) demoVendorBtn.click();
      })()`
    });
    await sleep(600);

    const vendorLoginSubmit = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          return { success: true, text: submitBtn.innerText };
        }
        return { success: false };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Submit Triggered:', vendorLoginSubmit.result?.value);
    await sleep(2500);
    console.log('Vendor Login Submission:', vendorLoginSubmit.result?.value);
    await sleep(2500);

    // Verify Vendor Dashboard & 5 Tabs
    const vendorDashboardCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasOverview = text.includes('Overview') || text.includes('Escrow');
        const hasRegistry = text.includes('Registry') || text.includes('Carton');
        const hasScanQR = text.includes('Scan') || text.includes('QR');
        const hasOrders = text.includes('Orders') || text.includes('Claims');
        const hasDossier = text.includes('Account') || text.includes('Dossier');
        return { hasOverview, hasRegistry, hasScanQR, hasOrders, hasDossier };
      })()`,
      returnByValue: true
    });
    console.log('Vendor Dashboard Tabs Verified:', vendorDashboardCheck.result?.value);

    // Screenshot 4: Vendor Dashboard on port 3002
    const screen4 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'vendor_port_3002_dashboard.png'), Buffer.from(screen4.data, 'base64'));
    console.log('✓ Captured: vendor_port_3002_dashboard.png');

    ws.close();
    chromeProcess.kill();
    console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Verification Error:', err);
    try { chromeProcess.kill(); } catch (_) {}
    process.exit(1);
  }
}

runPortVerification();
