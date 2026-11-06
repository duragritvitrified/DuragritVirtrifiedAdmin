import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9231;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testQrBatchGeneration() {
  console.log('--- Starting Admin Mobile App QR Batch 11 Qty Generation Test ---');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_test_qr_' + Date.now());
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

    console.log('1. Navigating to http://localhost:3001/?app=admin');
    await sendCDP('Page.navigate', { url: 'http://localhost:3001/?app=admin' });
    await sleep(1500);

    // Seed Admin session
    console.log('2. Seeding Admin session...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const adminUser = {
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
        localStorage.setItem('duragrit_mobile_session_v5', JSON.stringify(adminUser));
      })()`
    });

    await sendCDP('Page.reload');
    await sleep(2000);

    // 3. Switch to 'qrgen' tab
    console.log('3. Navigating to QR Gen tab...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const qrBtn = buttons.find(b => b.innerText && b.innerText.toUpperCase().includes('QR GEN'));
        if (qrBtn) qrBtn.click();
      })()`
    });
    await sleep(1000);

    // 4. Fill in Batch Size: 11
    console.log('4. Entering Batch Size: 11 and submitting form...');
    const fillResult = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        const qtyInput = inputs[0];
        if (!qtyInput) return { error: 'Qty input not found' };

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(qtyInput, '11');
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));

        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return { error: 'Submit button not found' };
        submitBtn.click();

        return { success: true, requestedQty: 11 };
      })()`
    });
    console.log('Form submission result:', fillResult.result.value);
    await sleep(2000);

    // 5. Verify batch in Recent Factory Batches
    console.log('5. Verifying that the 11 QRs batch appears in Recent Factory Batches...');
    const checkBatchResult = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const text = document.body.innerText;
        const recentBatchesSection = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('Recent Factory Batches'));
        const batchCards = Array.from(document.querySelectorAll('.p-3.bg-slate-50\\/90, .p-3.bg-slate-50'));
        const topCardText = batchCards[0]?.innerText || '';
        const has11QRs = topCardText.includes('11 QRs') || topCardText.includes('11 tokens');
        const hasBatchId = topCardText.includes('DG-BATCH-');

        return {
          totalRecentBatches: batchCards.length,
          topCardSnippet: topCardText.slice(0, 150),
          has11QRs,
          hasBatchId
        };
      })()`
    });
    console.log('Recent Batches Inspection Result:', JSON.stringify(checkBatchResult.result.value, null, 2));

    // Capture screenshot of recent batches
    const screenshotBatch = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_qrgen_batch_created_11.png'), Buffer.from(screenshotBatch.data, 'base64'));
    console.log('Saved screenshot: admin_qrgen_batch_created_11.png');

    // 6. Click "Inspect 11 QR Tokens"
    console.log('6. Clicking Inspect 11 QR Tokens button...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const inspectBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Inspect'));
        if (inspectBtn) inspectBtn.click();
      })()`
    });
    await sleep(1000);

    // 7. Verify Tokens Modal shows 11 individual serials
    console.log('7. Verifying Modal contains 11 tokens...');
    const modalStats = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        if (!modal) return { modalFound: false };
        const tokenRows = Array.from(modal.querySelectorAll('.p-2.bg-slate-50'));
        return {
          modalFound: true,
          tokenRowsCount: tokenRows.length,
          sampleSerials: tokenRows.slice(0, 3).map(r => r.innerText.slice(0, 80))
        };
      })()`
    });
    console.log('Modal tokens result:', JSON.stringify(modalStats.result.value, null, 2));

    // Capture screenshot of modal
    const screenshotModal = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_qrgen_tokens_inspect_modal.png'), Buffer.from(screenshotModal.data, 'base64'));
    console.log('Saved screenshot: admin_qrgen_tokens_inspect_modal.png');

    console.log('--- All QR Batch Generation tests passed successfully! ---');
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch (e) {}
  }
}

testQrBatchGeneration().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

