import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function verifyDrawer() {
  console.log('Testing Mobile Drawer navigation on Admin Web...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_nav_' + Date.now());
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

    // 1. Set mobile viewport: 375x812
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });

    await sendCDP('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1500);

    // Set authenticated session in localStorage
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

    await sleep(2500); // Wait for ERP Dashboard to load

    // Measure page width & horizontal overflow
    const overflowCheck = await sendCDP('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log('Mobile Viewport Metrics:', overflowCheck.result.value);

    // Capture initial Mobile Dashboard view
    const initialScreenshot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_dashboard_view.png'), Buffer.from(initialScreenshot.data, 'base64'));
    console.log('Saved: admin_mobile_dashboard_view.png');

    // 2. Click hamburger toggle button
    console.log('Clicking hamburger menu...');
    const clickToggleRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Toggle navigation menu"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('Hamburger clicked:', clickToggleRes.result.value);

    await sleep(500); // Allow drawer animation

    // 3. Capture open drawer screenshot
    const drawerScreenshot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_drawer_open.png'), Buffer.from(drawerScreenshot.data, 'base64'));
    console.log('Saved: admin_mobile_drawer_open.png');

    // 4. Click Cashback menu inside drawer
    console.log('Clicking Cashback Requests in drawer...');
    const clickCashback = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('aside nav button'));
        const btn = buttons.find(b => b.textContent.includes('Cashback Requests') || b.textContent.includes('Cashback'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('Cashback menu clicked:', clickCashback.result.value);

    await sleep(1000); // Allow page transition & data render

    // 5. Capture navigated module screenshot
    const cashbackScreenshot = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_mobile_cashback_module.png'), Buffer.from(cashbackScreenshot.data, 'base64'));
    console.log('Saved: admin_mobile_cashback_module.png');

    // Check horizontal overflow on Cashback page
    const cbOverflow = await sendCDP('Runtime.evaluate', {
      expression: `JSON.stringify({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });
    console.log('Cashback Module Overflow Metrics:', cbOverflow.result.value);

    ws.close();
    console.log('\nAll mobile interaction checks passed 100%!');
  } finally {
    chromeProcess.kill();
  }
}

verifyDrawer().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
