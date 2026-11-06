import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log('Launching headless Chrome with debugging port...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_' + Date.now());
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    // Wait for Chrome to be ready
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        versionData = await res.json();
        break;
      } catch (err) {}
    }

    if (!versionData) {
      console.error('Failed to connect to Chrome on port ' + PORT);
      return;
    }

    console.log('Connected to Chrome CDP:', versionData.Browser);

    const pages = [
      { name: 'admin_web', url: 'http://localhost:3000' },
      { name: 'mobile_app', url: 'http://localhost:3001' }
    ];

    const viewports = [
      { label: 'mobile_375x812', width: 375, height: 812, isMobile: true },
      { label: 'tablet_768x1024', width: 768, height: 1024, isMobile: false },
      { label: 'desktop_1440x900', width: 1440, height: 900, isMobile: false }
    ];

    // Create a new target page
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

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    const sendCDP = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await sendCDP('Page.enable');

    for (const page of pages) {
      console.log(`\nTesting page: ${page.name} (${page.url})`);
      await sendCDP('Page.navigate', { url: page.url });
      await sleep(2500); // Wait for React to render

      for (const vp of viewports) {
        console.log(`- Setting viewport: ${vp.label} (${vp.width}x${vp.height})`);
        await sendCDP('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 2,
          mobile: vp.isMobile,
          fitWindow: false
        });

        await sleep(600); // Allow layout recalculation

        // Measure page layout properties via Runtime.evaluate
        const evalRes = await sendCDP('Runtime.evaluate', {
          expression: `JSON.stringify({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
            title: document.title
          })`,
          returnByValue: true
        });

        const metrics = JSON.parse(evalRes.result.value || '{}');
        console.log(`  Metrics for ${vp.label}: clientWidth=${metrics.clientWidth}, scrollWidth=${metrics.scrollWidth}, hasHorizontalOverflow=${metrics.hasHorizontalOverflow}`);

        const screenshotRes = await sendCDP('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false
        });

        const filePath = path.join(OUTPUT_DIR, `${page.name}_${vp.label}.png`);
        fs.writeFileSync(filePath, Buffer.from(screenshotRes.data, 'base64'));
        console.log(`  Saved screenshot: ${filePath}`);
      }
    }

    ws.close();
    console.log('\nAll responsive tests and screenshots captured successfully!');
  } finally {
    chromeProcess.kill();
  }
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

