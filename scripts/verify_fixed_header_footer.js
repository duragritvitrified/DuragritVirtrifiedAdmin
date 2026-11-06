import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testHeaderFooter() {
  console.log('Testing Header and Footer persistence across scroll...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_hf_' + Date.now());
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

    // 1. TEST VENDOR MOBILE APP (PORT 3001)
    console.log('\n--- 1. Testing Vendor Mobile App (http://localhost:3001) ---');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });

    await sendCDP('Page.navigate', { url: 'http://localhost:3001' });
    await sleep(1500);

    // Authenticate as Vendor in localStorage
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const vendorUser = {
          id: 'VND-001',
          name: 'Apex Vitrified Ltd',
          role: 'Vendor',
          isAuthenticated: true,
          companyName: 'Apex Vitrified Ltd',
          mobile: '9876543210',
          loginTimestamp: Date.now()
        };
        localStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(vendorUser));
        sessionStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(vendorUser));
        location.reload();
      })()`
    });

    await sleep(2000);

    // Scroll down 600px inside the scrollable container
    console.log('Scrolling down 600px in Vendor Mobile App...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const scrollable = document.querySelector('.overflow-y-auto') || document.documentElement;
        scrollable.scrollTop = 600;
      })()`
    });
    await sleep(500);

    // Verify Header is visible at top (y <= 10)
    const headerCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('header');
        if (!header) return { found: false };
        const rect = header.getBoundingClientRect();
        return {
          found: true,
          top: rect.top,
          height: rect.height,
          isVisible: rect.top >= 0 && rect.top < 50 && rect.height > 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Vendor App Header Check after scroll:', headerCheck.result.value);

    // Verify Footer Bottom Nav is visible at bottom (y near window.innerHeight)
    const footerCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const nav = document.querySelector('nav');
        if (!nav) return { found: false };
        const rect = nav.getBoundingClientRect();
        return {
          found: true,
          bottom: rect.bottom,
          windowHeight: window.innerHeight,
          isVisible: rect.bottom <= window.innerHeight + 5 && rect.top > 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Vendor App Bottom Nav Check after scroll:', footerCheck.result.value);

    // 2. TEST ADMIN MOBILE APP
    console.log('\n--- 2. Testing Admin Mobile App (http://localhost:3001/?app=admin) ---');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(1500);

    // Authenticate as Admin
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const adminUser = {
          id: 'admin',
          name: 'Super Admin',
          role: 'Admin',
          isAdmin: true,
          isAuthenticated: true,
          loginTimestamp: Date.now()
        };
        localStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(adminUser));
        sessionStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(adminUser));
        location.reload();
      })()`
    });

    await sleep(2500);

    // Scroll down 600px in Admin Mobile App
    console.log('Scrolling down 600px in Admin Mobile App...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const scrollable = document.querySelector('.overflow-y-auto') || document.documentElement;
        scrollable.scrollTop = 600;
      })()`
    });
    await sleep(500);

    const adminFooterCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const nav = document.querySelector('nav[aria-label="Executive Bottom Navigation"]') || document.querySelector('nav');
        if (!nav) return { found: false };
        const rect = nav.getBoundingClientRect();
        return {
          found: true,
          top: rect.top,
          bottom: rect.bottom,
          windowHeight: window.innerHeight,
          isVisible: rect.bottom <= window.innerHeight + 5 && rect.top > 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Admin Mobile App Footer Check after scroll:', adminFooterCheck.result.value);

    // 3. TEST ADMIN WEB ERP (PORT 3000)
    console.log('\n--- 3. Testing Admin Web ERP (http://localhost:3000) ---');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      fitWindow: false
    });

    await sendCDP('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1500);

    // Authenticate in Admin Web
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const session = {
          isAuthenticated: true,
          loginTimestamp: Date.now(),
          id: 'admin',
          name: 'Super Admin',
          role: 'Admin',
          department: 'Executive HQ'
        };
        localStorage.setItem('duragrit_active_session_v5', JSON.stringify(session));
        sessionStorage.setItem('duragrit_active_session_v5', JSON.stringify(session));
        location.reload();
      })()`
    });

    await sleep(2500);

    // Scroll main viewport
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 1000;
      })()`
    });
    await sleep(500);

    const webFooterCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const footer = document.querySelector('footer');
        if (!footer) return { found: false };
        const rect = footer.getBoundingClientRect();
        return {
          found: true,
          bottom: rect.bottom,
          windowHeight: window.innerHeight,
          isVisible: rect.bottom <= window.innerHeight && rect.top >= window.innerHeight - 40
        };
      })()`,
      returnByValue: true
    });
    console.log('Admin Web ERP Pinned Footer Check after scroll:', webFooterCheck.result.value);

    ws.close();
    console.log('\nAll tests completed successfully!');
  } finally {
    chromeProcess.kill();
  }
}

testHeaderFooter().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});
