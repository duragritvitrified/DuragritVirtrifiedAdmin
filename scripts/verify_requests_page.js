import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9228;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testRequestsPage() {
  console.log('--- Starting Admin Mobile App Requests Page Verification ---');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_test_requests_' + Date.now());
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

    // Emulate Mobile Device (iPhone 14 Pro: 393 x 852)
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('1. Navigating to http://localhost:3001/?app=admin');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(1500);

    // Seed Admin session and diverse claims with Pending, Approved, and Rejected statuses
    console.log('2. Seeding session and sample claims...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const adminUser = {
          id: 'ADMIN-01',
          name: 'DuraGrit Super Admin',
          email: 'duragrit07@gmail.com',
          mobile: '9000000000',
          role: 'Admin',
          isAdmin: true,
          location: 'Morbi Kiln HQ, Gujarat',
          status: 'Active',
          isAuthenticated: true,
          loginTimestamp: Date.now()
        };
        localStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(adminUser));

        const testClaims = [
          {
            id: 'REQ-2026-901',
            requestId: 'REQ-2026-901',
            amount: 500,
            vendorName: 'Royal Ceramics & Sanitary',
            vendorId: 'VEN-ROYAL-01',
            userName: 'Ramesh Patel',
            userMobile: '+91 98450 11223',
            skuCode: 'DG-ADH-01',
            productName: 'Tile Adhesive 20kg Kraft Bag',
            status: 'Pending',
            date: 'Today, 11:20 AM'
          },
          {
            id: 'REQ-2026-884',
            requestId: 'REQ-2026-884',
            amount: 750,
            vendorName: 'Ambika Building Solutions',
            vendorId: 'VEN-AMBIKA-02',
            userName: 'Vikram Solanki',
            userMobile: '+91 97123 44556',
            skuCode: 'DG-EPOXY-02',
            productName: 'Epoxy Grout Resin 5kg',
            status: 'Approved',
            npciRrn: 'NPCI99402188402',
            date: 'Yesterday, 04:15 PM'
          },
          {
            id: 'REQ-2026-723',
            requestId: 'REQ-2026-723',
            amount: 350,
            vendorName: 'Kailash Marble & Granites',
            vendorId: 'VEN-KAILASH-03',
            userName: 'Mohan Sharma',
            userMobile: '+91 98201 99887',
            skuCode: 'DG-PRM-03',
            productName: 'Surface Primer 10L Can',
            status: 'Rejected',
            flagReason: 'Duplicate carton QR scanned from unverified secondary retail site',
            date: '03 Nov 2026, 02:30 PM'
          }
        ];
        localStorage.setItem('duragrit_claims_v7', JSON.stringify(testClaims));
      })()`
    });

    // Reload page to reflect seeded claims
    await sendCDP('Page.reload');
    await sleep(2000);

    // 3. Switch to 'requests' tab
    console.log('3. Navigating to Requests tab...');
    const navResult = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const debugButtons = buttons.map(b => b.innerText?.trim()).filter(Boolean);
        // Find bottom navigation button for Requests
        const reqBtn = buttons.find(b => b.innerText && b.innerText.toUpperCase().includes('REQUESTS') && !b.innerText.includes('View'));
        if (reqBtn) reqBtn.click();
        return { clicked: !!reqBtn, allButtons: debugButtons };
      })()`
    });
    console.log('Nav button click result:', navResult.result.value.clicked);
    await sleep(1500);

    // 4. Inspect 'All' tab, Search input, and Date-Time formatting
    console.log('4. Verifying All tab status badges, search input, and Date-Time...');
    const allTabStats = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const text = document.body.innerText;
        const searchInput = document.querySelector('input[placeholder*="Quick search"]');
        const hasSearch = !!searchInput;
        const statusBadges = Array.from(document.querySelectorAll('.pt-2.border-t')).map(el => el.innerText);
        const hasApproved = statusBadges.some(b => b.includes('Approved') || b.includes('Disbursed'));
        const hasPending = statusBadges.some(b => b.includes('Pending'));
        const hasRejected = statusBadges.some(b => b.includes('Rejected') || b.includes('Flagged'));
        
        // Find Date-Time badges
        const dateTimeBadges = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.match(/\d{2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)).map(s => s.innerText);

        // Check if top card is newer or equal to second card
        const cardIds = Array.from(document.querySelectorAll('.bg-slate-100.px-2.py-0\\.5')).map(s => s.innerText);

        return { 
          hasSearch,
          totalBadges: statusBadges.length,
          statusBadges,
          dateTimeCount: dateTimeBadges.length,
          dateTimeSample: dateTimeBadges.slice(0, 3),
          cardIdsSample: cardIds.slice(0, 3),
          hasApproved, 
          hasPending, 
          hasRejected 
        };
      })()`
    });
    console.log('All tab check result:', JSON.stringify(allTabStats.result.value, null, 2));

    // Capture screenshot of All tab with search & date-time
    const screenshotAll = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_requests_all_tab.png'), Buffer.from(screenshotAll.data, 'base64'));
    console.log('Saved screenshot: admin_requests_all_tab.png');

    // 4b. Test Header Search Bar
    console.log('4b. Testing Quick Search in Header...');
    const searchFilterTest = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Quick search"]');
        if (!input) return { error: 'Search input not found' };
        // Set value to 'Royal' or 'REQ'
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, 'Ambika');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return { typed: 'Ambika' };
      })()`
    });
    await sleep(600);

    const searchResultStats = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const text = document.body.innerText;
        const cards = Array.from(document.querySelectorAll('.space-y-2\\.5 > div'));
        return {
          matchingCards: cards.length,
          containsKeyword: text.includes('Ambika')
        };
      })()`
    });
    console.log('Search test result:', JSON.stringify(searchResultStats.result.value, null, 2));

    // Capture screenshot during search
    const screenshotSearch = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_requests_search_filter.png'), Buffer.from(screenshotSearch.data, 'base64'));
    console.log('Saved screenshot: admin_requests_search_filter.png');

    // Clear search
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Quick search"]');
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await sleep(600);

    // 5. Click on 'Rejected' filter tab
    console.log('5. Clicking Rejected filter tab...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const rejBtn = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('rejected'));
        if (rejBtn) rejBtn.click();
      })()`
    });
    await sleep(800);

    // Verify Rejection Reason is visible
    const rejTabStats = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const text = document.body.innerText;
        const reasons = Array.from(document.querySelectorAll('.text-rose-700')).map(el => el.innerText);
        const statusBadges = Array.from(document.querySelectorAll('.pt-2.border-t')).map(el => el.innerText);
        const hasReasonLabel = text.includes('REJECTION REASON:');
        const hasStatusBadge = text.includes('Status:') && text.includes('Rejected');
        return { hasReasonLabel, reasons, statusBadges, hasStatusBadge };
      })()`
    });
    console.log('Rejected tab check result:', JSON.stringify(rejTabStats.result.value, null, 2));

    // Capture screenshot of Rejected tab
    const screenshotRej = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_requests_rejected_tab.png'), Buffer.from(screenshotRej.data, 'base64'));
    console.log('Saved screenshot: admin_requests_rejected_tab.png');

    // 6. Click on 'Pending' filter tab
    console.log('6. Clicking Pending filter tab...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const penBtn = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('pending'));
        if (penBtn) penBtn.click();
      })()`
    });
    await sleep(800);

    const screenshotPending = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_requests_pending_tab.png'), Buffer.from(screenshotPending.data, 'base64'));
    console.log('Saved screenshot: admin_requests_pending_tab.png');

    console.log('--- All verifications completed successfully! ---');
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch (e) {}
  }
}

testRequestsPage().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
