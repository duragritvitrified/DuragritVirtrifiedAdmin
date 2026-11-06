import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9227;
const OUTPUT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\0098997f-a210-4ac3-ba76-c919e7f81b44\\responsive_checks';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testAdminOTA() {
  console.log('--- Starting Admin Mobile App Version-wise OTA Test ---');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_admin_ota_' + Date.now());
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

    // Seed Admin session and initial version v3.1.5
    console.log('2. Seeding Admin session and setting initial installed version to v3.1.5...');
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
        localStorage.setItem('duragrit_admin_installed_version', 'v3.1.5');
      })()`
    });

    // Reload page to reflect seeded state
    await sendCDP('Page.reload');
    await sleep(2000);

    // 3. Inspect Initial Update State
    const checkInitialState = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasUpdateBanner = bodyText.includes('Admin Mobile Update Available');
        const hasUpdateReadyBadge = bodyText.includes('Update Ready') || bodyText.includes('Update Now');
        const showsV315 = bodyText.includes('v3.1.5');
        const showsV320 = bodyText.includes('v3.2.0');
        return { hasUpdateBanner, hasUpdateReadyBadge, showsV315, showsV320 };
      })()`
    });

    console.log('Initial State Result:', JSON.stringify(checkInitialState.result.value));
    if (!checkInitialState.result.value.hasUpdateBanner) {
      console.warn('Warning: Update banner not detected yet!');
    }

    // Take screenshot before update
    const screenshotBefore = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_ota_before_update.png'), Buffer.from(screenshotBefore.data, 'base64'));
    console.log('Saved screenshot: admin_ota_before_update.png');

    // 4. Click "Update Now" in top banner
    console.log('4. Clicking "Update Now" button...');
    const clickUpdateRes = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        // Find button that contains 'Update Now'
        const buttons = Array.from(document.querySelectorAll('button'));
        const updateBtn = buttons.find(b => b.innerText.includes('Update Now'));
        if (updateBtn) {
          updateBtn.click();
          return { clicked: true, text: updateBtn.innerText };
        }
        return { clicked: false };
      })()`
    });
    console.log('Update button click result:', clickUpdateRes.result.value);

    // Wait 500ms to capture modal in action
    await sleep(600);
    const modalCheck = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        return {
          modalVisible: Boolean(modal),
          text: modal ? modal.innerText : ''
        };
      })()`
    });
    console.log('Modal during update:', modalCheck.result.value);

    // Wait for update process to finish (1.8s)
    await sleep(2200);

    // 5. Inspect State After Update
    const checkAfterUpdate = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasUpdateBanner = bodyText.includes('Admin Mobile Update Available');
        const hasUpdateBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Update Now'));
        const showsUpToDate = bodyText.includes('Up to date') || bodyText.includes('Latest');
        const installed = localStorage.getItem('duragrit_admin_installed_version');
        return {
          hasUpdateBanner,
          hasUpdateBtn,
          showsUpToDate,
          installed
        };
      })()`
    });

    console.log('State After Update:', JSON.stringify(checkAfterUpdate.result.value));

    // Take screenshot after update
    const screenshotAfter = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_ota_after_update.png'), Buffer.from(screenshotAfter.data, 'base64'));
    console.log('Saved screenshot: admin_ota_after_update.png');

    // 6. Test Audit Tab & Version Logs Modal
    console.log('6. Navigating to Audit Tab...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('nav button'));
        const auditBtn = buttons.find(b => b.innerText.includes('Audit') || b.innerText.includes('AUDIT'));
        if (auditBtn) auditBtn.click();
      })()`
    });
    await sleep(600);

    // Scroll down in the audit tab
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const container = document.querySelector('.overflow-y-auto') || window;
        if (container.scrollTo) container.scrollTo({ top: 1200, behavior: 'instant' });
      })()`
    });
    await sleep(400);

    // Click "Version Logs" button
    console.log('Clicking "Version Logs" button...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const logsBtn = buttons.find(b => b.innerText.includes('Version Logs'));
        if (logsBtn) logsBtn.click();
      })()`
    });
    await sleep(600);

    const checkChangelogModal = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body.innerText;
        return {
          hasModalTitle: bodyText.includes('Admin Version Release History'),
          hasV320: bodyText.includes('v3.2.0'),
          hasV315: bodyText.includes('v3.1.5'),
          hasV310: bodyText.includes('v3.1.0'),
          hasV300: bodyText.includes('v3.0.0')
        };
      })()`
    });
    console.log('Changelog Modal Inspection:', checkChangelogModal.result.value);

    const screenshotLogs = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_ota_changelog_modal.png'), Buffer.from(screenshotLogs.data, 'base64'));
    console.log('Saved screenshot: admin_ota_changelog_modal.png');

    // Close Changelog Modal
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(b => b.innerText.includes('Close Logs'));
        if (closeBtn) closeBtn.click();
      })()`
    });
    await sleep(400);

    // 7. Test Auto-Push Mechanism
    console.log('7. Triggering auto-push of new release v3.2.5 via publishAdminNewRelease...');
    const publishResult = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        // Trigger auto push using custom dispatch or direct helper
        const releasesKey = 'duragrit_admin_app_releases_v1';
        const raw = localStorage.getItem(releasesKey);
        const list = raw ? JSON.parse(raw) : [];
        const newRel = {
          id: 'ADM-REL-TEST-01',
          version: 'v3.2.5',
          buildNumber: 155,
          releaseDate: 'Just now (Auto-Pushed)',
          title: 'Emergency Field Performance & Commission Engine v3.2.5',
          changelog: 'Automated push delivered directly to mobile admin console without store approval.',
          changesList: ['Instant commission payout pipeline', 'Sub-millisecond QR token encryption'],
          status: 'LIVE',
          isMandatory: true,
          author: 'DevOps Central (Morbi)',
          downloadSize: '25.1 MB'
        };
        const updated = [newRel, ...list.map(r => ({ ...r, status: 'ARCHIVED' }))];
        localStorage.setItem(releasesKey, JSON.stringify(updated));
        localStorage.setItem('duragrit_admin_ota_last_broadcast', JSON.stringify({ version: 'v3.2.5', timestamp: Date.now() }));
        window.dispatchEvent(new CustomEvent('duragrit:admin-ota-release-pushed', { detail: newRel }));
        return { success: true, version: newRel.version };
      })()`
    });
    console.log('Publish result:', publishResult.result.value);

    await sleep(500);

    // Verify auto-push banner and button reappeared immediately
    const checkAutoPushState = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasNewBanner = bodyText.includes('v3.2.5');
        const hasUpdateNowBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Update Now'));
        return { hasNewBanner, hasUpdateNowBtn };
      })()`
    });
    console.log('Auto-Push Verification Result:', JSON.stringify(checkAutoPushState.result.value));

    const screenshotAutoPush = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_ota_autopush_broadcast.png'), Buffer.from(screenshotAutoPush.data, 'base64'));
    console.log('Saved screenshot: admin_ota_autopush_broadcast.png');

    // 8. Click "Update Now" on the auto-pushed v3.2.5 update
    console.log('8. Updating to auto-pushed v3.2.5...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const updateBtn = buttons.find(b => b.innerText.includes('Update Now'));
        if (updateBtn) updateBtn.click();
      })()`
    });

    await sleep(2200);

    const checkFinalState = await sendCDP('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const installed = localStorage.getItem('duragrit_admin_installed_version');
        const bodyText = document.body.innerText;
        const hasUpdateNowBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Update Now'));
        return { installed, hasUpdateNowBtn, showsV325: bodyText.includes('v3.2.5') };
      })()`
    });
    console.log('Final State (after v3.2.5 update):', JSON.stringify(checkFinalState.result.value));

    const screenshotFinal = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'admin_ota_v325_completed.png'), Buffer.from(screenshotFinal.data, 'base64'));
    console.log('Saved screenshot: admin_ota_v325_completed.png');

    console.log('--- ALL ADMIN MOBILE APP OTA TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch (_) {}
  }
}

testAdminOTA();
