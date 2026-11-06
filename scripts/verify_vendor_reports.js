import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function verifyVendorReports() {
  console.log('Testing Vendor Sales Report on Mobile & Tablet...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_rep_' + Date.now());
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

    // Set mobile viewport: 375x812
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });

    await sendCDP('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1000);

    // Set authenticated session and navigate to Vendor Sales Report
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const session = {
          isAuthenticated: true,
          loginTimestamp: Date.now(),
          id: 'admin',
          name: 'Super Admin',
          role: 'Admin',
          department: 'Executive HQ',
          sessionToken: 'test_token_' + Date.now()
        };
        localStorage.setItem('duragrit_active_session_v5', JSON.stringify(session));
        sessionStorage.setItem('duragrit_active_session_v5', JSON.stringify(session));
        location.reload();
      })()`
    });

    await sleep(2000);

    // Click hamburger menu
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Toggle navigation menu"]');
        if (btn) btn.click();
      })()`
    });

    await sleep(500);

    // Click Vendor Sales & Cashback menu item
    const navResult = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('aside nav button'));
        const btn = buttons.find(b => b.textContent.includes('Vendor Sales & Cashback') || b.textContent.includes('Vendor Sales'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('Navigated to Vendor Sales Report:', navResult.result.value);

    await sleep(1000);

    // Verify metrics on mobile
    const mobileMetrics = await sendCDP('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log('Vendor Sales Report Mobile (375px) Metrics:', mobileMetrics.result.value);

    const shot375 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_vendor_sales_report_375.png'), Buffer.from(shot375.data, 'base64'));

    // Switch to Tablet: 768x1024
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false,
      fitWindow: false
    });
    await sleep(500);

    const tabletMetrics = await sendCDP('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log('Vendor Sales Report Tablet (768px) Metrics:', tabletMetrics.result.value);

    const shot768 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_tablet_vendor_sales_report_768.png'), Buffer.from(shot768.data, 'base64'));

    ws.close();
    console.log('Vendor Sales Report responsive verification complete!');
  } finally {
    chromeProcess.kill();
  }
}

verifyVendorReports().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

